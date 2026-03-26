import { buildGhostCutSign } from '@/lib/sign'
import type {
	CreateGhostCutTaskRequest,
	CreateGhostCutTaskResponse,
	GetGhostCutTaskStatusResponse,
} from '@/types/api'
import type { LanguageCode } from '@/types/task'

const GHOSTCUT_CREATE_PATH = '/v-w-c/gateway/ve/work/free'
const GHOSTCUT_STATUS_PATH = '/v-w-c/gateway/ve/work/status'

type OcrTranslatePayloadInput = {
	sourceUrl: string
	sourceLang: LanguageCode
	targetLang: LanguageCode
	videoInpaintMasks?: unknown[]
	bboxGroups?: unknown[]
}

type GhostCutApiEnvelope = Record<string, unknown> & {
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

function unwrapEnvelope(payload: GhostCutApiEnvelope) {
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

function resolveTaskStatus(payload: Record<string, unknown>) {
	const processStatus = typeof payload.processStatus === 'number' ? payload.processStatus : undefined
	const errorMessage = readStringField(payload, ['errorMessage', 'errMsg', 'message'])

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

	return response.json() as Promise<T>
}

export function buildOcrTranslatePayload(input: OcrTranslatePayloadInput): CreateGhostCutTaskRequest {
	return {
		urls: [input.sourceUrl],
		needChineseOcclude: 11,
		videoInpaintLang: input.sourceLang,
		lang: input.targetLang,
		...(input.videoInpaintMasks ? { videoInpaintMasks: stringifyCompactJson(input.videoInpaintMasks) } : {}),
		...(input.bboxGroups ? { bboxGroups: stringifyCompactJson(input.bboxGroups) } : {}),
	}
}

export async function createOcrTranslateTask(payload: CreateGhostCutTaskRequest): Promise<CreateGhostCutTaskResponse> {
	const response = await postGhostCut<GhostCutApiEnvelope>(GHOSTCUT_CREATE_PATH, payload)
	const result = unwrapEnvelope(response)
	const id = readStringField(result, ['id'])

	if (!id) {
		throw new Error('GhostCut 创建任务成功，但响应中缺少任务 id')
	}

	return { id }
}

export async function getGhostCutTaskStatus(taskId: string): Promise<GetGhostCutTaskStatusResponse> {
	const response = await postGhostCut<GhostCutApiEnvelope>(GHOSTCUT_STATUS_PATH, { id: taskId })
	const result = unwrapEnvelope(response)
	const mappedStatus = resolveTaskStatus(result)
	const resultUrl = readStringField(result, ['videoUrl', 'resultUrl'])

	return {
		taskId: readStringField(result, ['id']) ?? taskId,
		status: mappedStatus.status,
		...(typeof mappedStatus.processStatus === 'number' ? { processStatus: mappedStatus.processStatus } : {}),
		...(resultUrl ? { resultUrl } : {}),
		...(mappedStatus.errorMessage ? { errorMessage: mappedStatus.errorMessage } : {}),
	}
}
