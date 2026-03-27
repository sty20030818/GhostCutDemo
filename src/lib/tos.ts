import { TosClient } from '@volcengine/tos-sdk'

import type { UploadToTosResult } from '@/types/api'

const DEFAULT_OBJECT_PREFIX = 'ghostcut-demo'

type UploadToTosOptions = {
	timeoutMs?: number
	onProgress?: (percent: number) => void
}

const DEFAULT_UPLOAD_PART_SIZE = 5 * 1024 * 1024
const DEFAULT_UPLOAD_TASK_NUM = 4

function getObjectPrefix() {
	return import.meta.env.VITE_TOS_OBJECT_PREFIX?.trim() || DEFAULT_OBJECT_PREFIX
}

function assertUploadFile(file: File) {
	if (!(file instanceof File)) {
		throw new Error('上传参数必须是 File 对象')
	}

	if (file.size <= 0) {
		throw new Error('上传文件不能为空')
	}
}

function normalizeEndpoint(endpoint: string) {
	return endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

function buildDefaultObjectKey(file: File) {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`

	return `${getObjectPrefix()}/${year}/${month}/${day}/${randomId}-${file.name}`
}

function buildPublicObjectUrl(bucket: string, endpoint: string, key: string) {
	const normalizedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/')

	return `https://${bucket}.${normalizeEndpoint(endpoint)}/${normalizedKey}`
}

function getRequiredEnv(name: string) {
	const value = import.meta.env[name]
	if (!value?.trim()) {
		throw new Error(`缺少 TOS 配置：${name}`)
	}

	return value.trim()
}

function createTosClient() {
	return new TosClient({
		accessKeyId: getRequiredEnv('VITE_TOS_ACCESS_KEY_ID'),
		accessKeySecret: getRequiredEnv('VITE_TOS_ACCESS_KEY_SECRET'),
		region: getRequiredEnv('VITE_TOS_REGION'),
		endpoint: normalizeEndpoint(getRequiredEnv('VITE_TOS_ENDPOINT')),
	})
}

function getUploadPartSize() {
	const raw = Number(import.meta.env.VITE_TOS_UPLOAD_PART_SIZE_MB)
	if (!Number.isFinite(raw) || raw <= 0) {
		return DEFAULT_UPLOAD_PART_SIZE
	}

	return Math.round(raw * 1024 * 1024)
}

function getUploadTaskNum() {
	const raw = Number(import.meta.env.VITE_TOS_UPLOAD_TASK_NUM)
	if (!Number.isFinite(raw) || raw <= 0) {
		return DEFAULT_UPLOAD_TASK_NUM
	}

	return Math.max(1, Math.min(10, Math.floor(raw)))
}

function resolveUploadTimeoutMs(file: File, overrideTimeoutMs?: number) {
	void file
	if (typeof overrideTimeoutMs === 'number') {
		return overrideTimeoutMs
	}

	// 默认固定 10 分钟，避免慢网络环境下的误判超时。
	return 10 * 60_000
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
	if (timeoutMs <= 0) {
		return Promise.reject(new Error('上传超时'))
	}

	return new Promise<T>((resolve, reject) => {
		const timer = globalThis.setTimeout(() => {
			globalThis.clearTimeout(timer)
			reject(new Error('上传超时'))
		}, timeoutMs)

		promise
			.then((value) => {
				globalThis.clearTimeout(timer)
				resolve(value)
			})
			.catch((error) => {
				globalThis.clearTimeout(timer)
				reject(error)
			})
	})
}

async function sdkUploadToTos(
	file: File,
	options: Pick<UploadToTosOptions, 'onProgress'>,
): Promise<UploadToTosResult> {
	const bucket = getRequiredEnv('VITE_TOS_BUCKET')
	const endpoint = getRequiredEnv('VITE_TOS_ENDPOINT')
	const key = buildDefaultObjectKey(file)
	const client = createTosClient()
	const partSize = getUploadPartSize()
	const taskNum = getUploadTaskNum()

	await client.uploadFile({
		bucket,
		key,
		file,
		contentType: file.type || undefined,
		partSize,
		taskNum,
		progress: (percent) => {
			const normalizedPercent = Number.isFinite(percent) ? Math.max(0, Math.min(1, percent)) : 0
			options.onProgress?.(normalizedPercent)
		},
	})

	return {
		key,
		url: buildPublicObjectUrl(bucket, endpoint, key),
	}
}

export async function uploadToTos(file: File, options: UploadToTosOptions = {}): Promise<UploadToTosResult> {
	assertUploadFile(file)

	const timeoutMs = resolveUploadTimeoutMs(file, options.timeoutMs)
	const result = await withTimeout(sdkUploadToTos(file, options), timeoutMs)

	if (!result.url) {
		throw new Error('上传返回的 URL 为空')
	}

	return result
}
