import { buildGhostCutSign } from '@/lib/sign'
import type {
	CreateGhostCutTaskRequest,
	CreateGhostCutTaskResponse,
	GetGhostCutTaskStatusResponse,
} from '@/types/api'
import type { LanguageCode } from '@/types/task'

const GHOSTCUT_CREATE_PATH = '/v-w-c/gateway/ve/work/free'
const GHOSTCUT_STATUS_PATH = '/v-w-c/gateway/ve/work/status'
const GHOSTCUT_SUCCESS_CODES = new Set([0, 1000])

type OcrTranslatePayloadInput = {
	sourceUrl?: string
	sourceUrls?: string[]
	names?: string[]
	sourceLang: LanguageCode
	targetLang: LanguageCode
	videoInpaintMasks?: unknown[]
	bboxGroups?: unknown[]
}

type GhostCutApiEnvelope = Record<string, unknown> & {
	code?: number
	msg?: string
	body?: Record<string, unknown>
	data?: Record<string, unknown>
}

function getRequiredEnv(name: string) {
	const value = import.meta.env[name]
	if (!value?.trim()) {
		throw new Error(`缺少 GhostCut 配置：${name}`)
	}

	return value.trim()
}

function getBaseUrl() {
	return getRequiredEnv('VITE_GHOSTCUT_BASE_URL').replace(/\/+$/, '')
}

function stringifyCompactJson(value: unknown) {
	return JSON.stringify(value)
}

function normalizeIdValue(id: string) {
	const parsed = Number(id)
	return Number.isFinite(parsed) ? parsed : id
}

function normalizeGhostCutLanguage(language: LanguageCode) {
	const normalized = language.trim().toLowerCase()

	if (normalized.startsWith('zh') || normalized.includes('中文')) {
		return 'zh'
	}

	if (normalized.startsWith('en') || normalized.includes('english')) {
		return 'en'
	}

	return language
}

function unwrapEnvelope(payload: GhostCutApiEnvelope) {
	if (payload.body && typeof payload.body === 'object' && !Array.isArray(payload.body)) {
		return payload.body
	}

	if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
		return payload.data
	}

	return payload
}

function readStringField(payload: Record<string, unknown>, keys: string[]) {
	for (const key of keys) {
		const value = payload[key]
		if (typeof value === 'string' && value.trim()) {
			return value
		}
	}

	return undefined
}

function readIdField(payload: Record<string, unknown>, keys: string[]) {
	for (const key of keys) {
		const value = payload[key]
		if (typeof value === 'number' && Number.isFinite(value)) {
			return String(value)
		}

		if (typeof value === 'string' && value.trim()) {
			return value
		}
	}

	return undefined
}

function resolveTaskStatus(payload: Record<string, unknown>) {
	const processStatus = typeof payload.processStatus === 'number' ? payload.processStatus : undefined
	const errorMessage = readStringField(payload, ['errorDetail', 'errorMsg', 'errorMessage', 'errMsg', 'message'])

	if (processStatus === 1) {
		return {
			status: 'completed' as const,
			processStatus,
			errorMessage,
		}
	}

	if (processStatus === -1 || processStatus === 2 || errorMessage) {
		return {
			status: 'failed' as const,
			processStatus,
			errorMessage,
		}
	}

	return {
		status: 'processing' as const,
		processStatus,
		errorMessage,
	}
}

async function postGhostCut<T>(path: string, payload: Record<string, unknown>) {
	const body = stringifyCompactJson(payload)
	const response = await fetch(`${getBaseUrl()}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			AppKey: getRequiredEnv('VITE_GHOSTCUT_APP_KEY'),
			AppSign: buildGhostCutSign(body, getRequiredEnv('VITE_GHOSTCUT_APP_SECRET')),
		},
		body,
	})

	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(errorText || `GhostCut 请求失败：${response.status}`)
	}

	const responseJson = (await response.json()) as GhostCutApiEnvelope
	if (typeof responseJson.code === 'number' && !GHOSTCUT_SUCCESS_CODES.has(responseJson.code)) {
		throw new Error(responseJson.msg || 'GhostCut 返回失败状态')
	}

	return responseJson as T
}

function getSourceUrls(input: OcrTranslatePayloadInput) {
	if (input.sourceUrls?.length) {
		return input.sourceUrls
	}

	if (input.sourceUrl) {
		return [input.sourceUrl]
	}

	return []
}

export function buildOcrTranslatePayload(input: OcrTranslatePayloadInput): CreateGhostCutTaskRequest {
	const sourceUrls = getSourceUrls(input)

	return {
		urls: sourceUrls,
		...(input.names?.length ? { names: input.names } : {}),
		needChineseOcclude: 11,
		videoInpaintLang: normalizeGhostCutLanguage(input.sourceLang),
		lang: normalizeGhostCutLanguage(input.targetLang),
		...(input.videoInpaintMasks ? { videoInpaintMasks: stringifyCompactJson(input.videoInpaintMasks) } : {}),
		...(input.bboxGroups ? { bboxGroups: stringifyCompactJson(input.bboxGroups) } : {}),
	}
}

export async function createOcrTranslateTasks(payload: CreateGhostCutTaskRequest): Promise<CreateGhostCutTaskResponse> {
	const response = await postGhostCut<GhostCutApiEnvelope>(GHOSTCUT_CREATE_PATH, payload)
	const result = unwrapEnvelope(response)
	const idProject = readIdField(result, ['idProject'])
	const dataList = Array.isArray(result.dataList) ? result.dataList : []

	if (!idProject || dataList.length === 0) {
		throw new Error('GhostCut 创建任务成功，但响应中缺少批次或作品信息')
	}

	return {
		idProject,
		items: dataList
			.map((item) => (typeof item === 'object' && item ? item as Record<string, unknown> : null))
			.filter((item): item is Record<string, unknown> => Boolean(item))
			.map((item) => ({
				url: readStringField(item, ['url']) ?? '',
				id: readIdField(item, ['id']) ?? '',
			}))
			.filter((item) => item.url && item.id),
	}
}

export async function createOcrTranslateTask(payload: CreateGhostCutTaskRequest): Promise<{ id: string }> {
	const result = await createOcrTranslateTasks(payload)
	const firstItem = result.items[0]
	if (!firstItem) {
		throw new Error('GhostCut 创建任务成功，但未返回首个作品 ID')
	}

	return { id: firstItem.id }
}

export async function getGhostCutTaskStatuses(taskIds: string[]): Promise<GetGhostCutTaskStatusResponse[]> {
	const response = await postGhostCut<GhostCutApiEnvelope>(GHOSTCUT_STATUS_PATH, {
		idWorks: taskIds.map((taskId) => normalizeIdValue(taskId)),
	})
	const result = unwrapEnvelope(response)
	const content = Array.isArray(result.content) ? result.content : []

	return content
		.map((item) => (typeof item === 'object' && item ? item as Record<string, unknown> : null))
		.filter((item): item is Record<string, unknown> => Boolean(item))
		.map((item) => {
			const mappedStatus = resolveTaskStatus(item)
			const resultUrl = readStringField(item, ['videoUrl', 'resultUrl'])
			const progress = typeof item.processProgress === 'number' ? item.processProgress : undefined

			return {
				taskId: readIdField(item, ['id']) ?? '',
				...(readIdField(item, ['idProject']) ? { idProject: readIdField(item, ['idProject']) } : {}),
				status: mappedStatus.status,
				...(typeof mappedStatus.processStatus === 'number' ? { processStatus: mappedStatus.processStatus } : {}),
				...(typeof progress === 'number' ? { progress } : {}),
				...(resultUrl ? { resultUrl } : {}),
				...(readStringField(item, ['sourceVideoUrl']) ? { sourceVideoUrl: readStringField(item, ['sourceVideoUrl']) } : {}),
				...(readStringField(item, ['srcSrtUrl']) ? { srcSrtUrl: readStringField(item, ['srcSrtUrl']) } : {}),
				...(readStringField(item, ['tgtSrtUrl']) ? { tgtSrtUrl: readStringField(item, ['tgtSrtUrl']) } : {}),
				...(readIdField(item, ['idVeOcrTranslateTask'])
					? { ocrTranslateTaskId: readIdField(item, ['idVeOcrTranslateTask']) }
					: {}),
				...(mappedStatus.errorMessage ? { errorMessage: mappedStatus.errorMessage } : {}),
			} satisfies GetGhostCutTaskStatusResponse
		})
		.filter((item) => item.taskId)
}

export async function getGhostCutTaskStatus(taskId: string): Promise<GetGhostCutTaskStatusResponse> {
	const results = await getGhostCutTaskStatuses([taskId])
	const firstResult = results[0]

	if (!firstResult) {
		throw new Error('GhostCut 状态查询成功，但响应中缺少作品状态')
	}

	return firstResult
}
