import { afterEach, describe, expect, it, vi } from 'vitest'

import { uploadToTos } from '@/lib/tos'

const { putObjectMock, tosClientMock } = vi.hoisted(() => {
	const putObjectMock = vi.fn()
	const tosClientMock = vi.fn(function TosClientMock() {
		return {
			putObject: putObjectMock,
		}
	})

	return {
		putObjectMock,
		tosClientMock,
	}
})

vi.mock('@volcengine/tos-sdk', () => ({
	TosClient: tosClientMock,
}))

describe('tos upload', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		putObjectMock.mockReset()
		tosClientMock.mockClear()
	})

	it('会拒绝空文件上传', async () => {
		const emptyFile = new File([], 'empty.mp4', {
			type: 'video/mp4',
		})

		await expect(uploadToTos(emptyFile)).rejects.toThrow('上传文件不能为空')
	})

	it('调用 TOS SDK 上传并返回源站 URL', async () => {
		vi.stubEnv('VITE_TOS_ACCESS_KEY_ID', 'test-ak')
		vi.stubEnv('VITE_TOS_ACCESS_KEY_SECRET', 'test-sk')
		vi.stubEnv('VITE_TOS_REGION', 'cn-shanghai')
		vi.stubEnv('VITE_TOS_ENDPOINT', 'tos-cn-shanghai.volces.com')
		vi.stubEnv('VITE_TOS_BUCKET', 'ghostcut')
		putObjectMock.mockResolvedValue({})

		const file = new File(['video-content'], 'intro.mp4', {
			type: 'video/mp4',
		})

		const result = await uploadToTos(file)

		expect(tosClientMock).toHaveBeenCalledWith({
			accessKeyId: 'test-ak',
			accessKeySecret: 'test-sk',
			region: 'cn-shanghai',
			endpoint: 'tos-cn-shanghai.volces.com',
		})
		expect(putObjectMock).toHaveBeenCalledWith(
			expect.objectContaining({
				bucket: 'ghostcut',
				body: file,
				contentType: 'video/mp4',
			}),
		)
		expect(result.key).toContain('intro.mp4')
		expect(result.url.startsWith('https://ghostcut.tos-cn-shanghai.volces.com/')).toBe(true)
	})

	it('缺少 TOS 环境变量时抛出错误', async () => {
		vi.stubEnv('VITE_TOS_ACCESS_KEY_ID', '')
		vi.stubEnv('VITE_TOS_ACCESS_KEY_SECRET', '')
		vi.stubEnv('VITE_TOS_REGION', '')
		vi.stubEnv('VITE_TOS_ENDPOINT', '')
		vi.stubEnv('VITE_TOS_BUCKET', '')

		const file = new File(['video-content'], 'test.mp4', {
			type: 'video/mp4',
		})

		await expect(uploadToTos(file)).rejects.toThrow('缺少 TOS 配置')
	})
})
