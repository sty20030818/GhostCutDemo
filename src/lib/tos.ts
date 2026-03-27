import { TosClient } from '@volcengine/tos-sdk'

import type { UploadToTosResult } from '@/types/api'

const DEFAULT_OBJECT_PREFIX = 'ghostcut-demo'

type UploadToTosOptions = {
	timeoutMs?: number
}

type UploadTraceContext = {
	traceId: string
	fileName: string
	fileSize: number
	timeoutMs: number
}

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

function logUploadTrace(phase: string, context: UploadTraceContext, extra?: Record<string, unknown>) {
	console.info(`[tos-upload][${context.traceId}] ${phase}`, {
		fileName: context.fileName,
		fileSize: context.fileSize,
		timeoutMs: context.timeoutMs,
		...extra,
	})
}

function buildUploadTraceContext(file: File, timeoutMs: number): UploadTraceContext {
	return {
		traceId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
		fileName: file.name,
		fileSize: file.size,
		timeoutMs,
	}
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: UploadTraceContext) {
	if (timeoutMs <= 0) {
		return Promise.reject(new Error('上传超时'))
	}

	return new Promise<T>((resolve, reject) => {
		let settled = false
		let timeoutTriggered = false
		const startAt = Date.now()
		const timer = globalThis.setTimeout(() => {
			timeoutTriggered = true
			const elapsedMs = Date.now() - startAt
			logUploadTrace('timeout_triggered', context, { elapsedMs })
			globalThis.clearTimeout(timer)
			reject(new Error('上传超时'))
		}, timeoutMs)

		promise
			.then((value) => {
				const elapsedMs = Date.now() - startAt
				if (settled) {
					logUploadTrace('promise_resolved_after_settled', context, { elapsedMs })
					return
				}
				settled = true
				globalThis.clearTimeout(timer)
				if (timeoutTriggered) {
					logUploadTrace('promise_resolved_after_timeout', context, { elapsedMs })
					return
				}
				logUploadTrace('promise_resolved_before_timeout', context, { elapsedMs })
				resolve(value)
			})
			.catch((error) => {
				const elapsedMs = Date.now() - startAt
				if (settled) {
					logUploadTrace('promise_rejected_after_settled', context, { elapsedMs, error })
					return
				}
				settled = true
				globalThis.clearTimeout(timer)
				if (timeoutTriggered) {
					logUploadTrace('promise_rejected_after_timeout', context, { elapsedMs, error })
					return
				}
				logUploadTrace('promise_rejected_before_timeout', context, { elapsedMs, error })
				reject(error)
			})
	})
}

async function sdkUploadToTos(file: File, context: UploadTraceContext): Promise<UploadToTosResult> {
	const bucket = getRequiredEnv('VITE_TOS_BUCKET')
	const endpoint = getRequiredEnv('VITE_TOS_ENDPOINT')
	const key = buildDefaultObjectKey(file)
	const client = createTosClient()
	const startAt = Date.now()

	logUploadTrace('sdk_upload_start', context, {
		bucket,
		endpoint: normalizeEndpoint(endpoint),
		key,
	})

	const putObjectResult = await client.putObject({
		bucket,
		key,
		body: file,
		contentType: file.type || undefined,
	})
	logUploadTrace('sdk_upload_success', context, {
		key,
		elapsedMs: Date.now() - startAt,
		putObjectResult,
	})

	return {
		key,
		url: buildPublicObjectUrl(bucket, endpoint, key),
	}
}

export async function uploadToTos(file: File, options: UploadToTosOptions = {}): Promise<UploadToTosResult> {
	assertUploadFile(file)

	const timeoutMs = options.timeoutMs ?? 10_000
	const traceContext = buildUploadTraceContext(file, timeoutMs)
	logUploadTrace('upload_start', traceContext)
	const result = await withTimeout(sdkUploadToTos(file, traceContext), timeoutMs, traceContext)
	logUploadTrace('upload_finish', traceContext, { url: result.url, key: result.key })

	if (!result.url) {
		throw new Error('上传返回的 URL 为空')
	}

	return result
}
