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

	it('可以把本地文件转换成可访问的上传结果', async () => {
		const file = new File(['demo-video'], 'demo-video.mp4', {
			type: 'video/mp4',
		})

		const result = await uploadToTos(file)

		expect(result.key).toContain('demo-video.mp4')
		expect(result.url.startsWith('blob:')).toBe(true)
	})

	it('会拒绝空文件上传', async () => {
		const emptyFile = new File([], 'empty.mp4', {
			type: 'video/mp4',
		})

		await expect(uploadToTos(emptyFile)).rejects.toThrow('上传文件不能为空')
	})

	it('在 sdk 模式下会调用 TOS 客户端并返回源站 URL', async () => {
		vi.stubEnv('VITE_TOS_UPLOAD_MODE', 'sdk')
		vi.stubEnv('VITE_TOS_ACCESS_KEY_ID', 'demo-ak')
		vi.stubEnv('VITE_TOS_ACCESS_KEY_SECRET', 'demo-sk')
		vi.stubEnv('VITE_TOS_REGION', 'cn-shanghai')
		vi.stubEnv('VITE_TOS_ENDPOINT', 'tos-cn-shanghai.volces.com')
		vi.stubEnv('VITE_TOS_BUCKET', 'ghostcut')
		putObjectMock.mockResolvedValue({})

		const file = new File(['sdk-video'], 'sdk-demo.mp4', {
			type: 'video/mp4',
		})

		const result = await uploadToTos(file)

		expect(tosClientMock).toHaveBeenCalledWith({
			accessKeyId: 'demo-ak',
			accessKeySecret: 'demo-sk',
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
		expect(result.key).toContain('sdk-demo.mp4')
		expect(result.url.startsWith('https://ghostcut.tos-cn-shanghai.volces.com/')).toBe(true)
	})
})
