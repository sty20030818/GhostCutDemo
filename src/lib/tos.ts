import { TosClient } from '@volcengine/tos-sdk'

import type { UploadToTosResult } from '@/types/api'

const DEFAULT_MOCK_UPLOAD_DELAY = 160
const MOCK_UPLOAD_MODE = 'mock'
const SDK_UPLOAD_MODE = 'sdk'
const DEFAULT_OBJECT_PREFIX = 'ghostcut-demo'

type UploadToTosOptions = {
	timeoutMs?: number
}

function getUploadMode() {
	return import.meta.env.VITE_TOS_UPLOAD_MODE ?? MOCK_UPLOAD_MODE
}

function getObjectPrefix() {
	return import.meta.env.VITE_TOS_OBJECT_PREFIX?.trim() || DEFAULT_OBJECT_PREFIX
}

function getMockDelay() {
	const rawDelay = Number(import.meta.env.VITE_MOCK_TOS_DELAY_MS ?? DEFAULT_MOCK_UPLOAD_DELAY)

	return Number.isFinite(rawDelay) && rawDelay >= 0 ? rawDelay : DEFAULT_MOCK_UPLOAD_DELAY
}

function assertUploadFile(file: File) {
	if (!(file instanceof File)) {
		throw new Error('上传参数必须是 File 对象')
	}

	if (file.size <= 0) {
		throw new Error('上传文件不能为空')
	}
}

function buildMockObjectKey(file: File) {
	const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`
	return `mock/${randomId}-${file.name}`
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

async function mockUploadToTos(file: File): Promise<UploadToTosResult> {
	const key = buildMockObjectKey(file)
	const url = URL.createObjectURL(file)

	return new Promise((resolve) => {
		globalThis.setTimeout(() => {
			resolve({
				key,
				url,
			})
		}, getMockDelay())
	})
}

async function sdkUploadToTos(file: File): Promise<UploadToTosResult> {
	const bucket = getRequiredEnv('VITE_TOS_BUCKET')
	const endpoint = getRequiredEnv('VITE_TOS_ENDPOINT')
	const key = buildDefaultObjectKey(file)
	const client = createTosClient()

	await client.putObject({
		bucket,
		key,
		body: file,
		contentType: file.type || undefined,
	})

	return {
		key,
		url: buildPublicObjectUrl(bucket, endpoint, key),
	}
}

export async function uploadToTos(file: File, options: UploadToTosOptions = {}): Promise<UploadToTosResult> {
	assertUploadFile(file)

	const uploadMode = getUploadMode()
	const timeoutMs = options.timeoutMs ?? 10_000

	const uploadPromise = uploadMode === SDK_UPLOAD_MODE ? sdkUploadToTos(file) : mockUploadToTos(file)
	const result = await withTimeout(uploadPromise, timeoutMs)
	if (!result.url) {
		throw new Error('上传返回的 URL 为空')
	}

	return result
}
