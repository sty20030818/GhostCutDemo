import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	buildOcrTranslatePayload,
	createOcrTranslateTask,
	getGhostCutTaskStatus,
} from '@/lib/ghostcut'

describe('ghostcut api', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it('可以构建 4.1.1.4 文字翻译请求体', () => {
		const payload = buildOcrTranslatePayload({
			sourceUrl: 'https://example.com/source.mp4',
			sourceLang: 'zh',
			targetLang: 'en',
			videoInpaintMasks: [{ type: 'trans_only_ocr' }],
			bboxGroups: [{ fill_color: '#ffffff', font_size: 32 }],
		})

		expect(payload).toEqual({
			urls: ['https://example.com/source.mp4'],
			needChineseOcclude: 11,
			videoInpaintLang: 'zh',
			lang: 'en',
			videoInpaintMasks: '[{"type":"trans_only_ocr"}]',
			bboxGroups: '[{"fill_color":"#ffffff","font_size":32}]',
		})
	})

	it('可以提交文字翻译任务并返回任务 id', async () => {
		vi.stubEnv('VITE_GHOSTCUT_BASE_URL', 'https://api.zhaoli.com')
		vi.stubEnv('VITE_GHOSTCUT_APP_KEY', 'demo-key')
		vi.stubEnv('VITE_GHOSTCUT_APP_SECRET', 'demo-secret')

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				id: 'task-123',
			}),
		})
		vi.stubGlobal('fetch', fetchMock)

		const payload = buildOcrTranslatePayload({
			sourceUrl: 'https://example.com/source.mp4',
			sourceLang: 'zh',
			targetLang: 'en',
		})

		const result = await createOcrTranslateTask(payload)

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.zhaoli.com/v-w-c/gateway/ve/work/free',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					AppKey: 'demo-key',
					AppSign: expect.any(String),
				}),
				body: '{"urls":["https://example.com/source.mp4"],"needChineseOcclude":11,"videoInpaintLang":"zh","lang":"en"}',
			}),
		)
		expect(result).toEqual({
			id: 'task-123',
		})
	})

	it('可以查询任务状态并映射完成结果', async () => {
		vi.stubEnv('VITE_GHOSTCUT_BASE_URL', 'https://api.zhaoli.com')
		vi.stubEnv('VITE_GHOSTCUT_APP_KEY', 'demo-key')
		vi.stubEnv('VITE_GHOSTCUT_APP_SECRET', 'demo-secret')

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				id: 'task-123',
				processStatus: 1,
				videoUrl: 'https://example.com/result.mp4',
			}),
		})
		vi.stubGlobal('fetch', fetchMock)

		const result = await getGhostCutTaskStatus('task-123')

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.zhaoli.com/v-w-c/gateway/ve/work/status',
			expect.objectContaining({
				method: 'POST',
				body: '{"id":"task-123"}',
			}),
		)
		expect(result).toEqual({
			taskId: 'task-123',
			status: 'completed',
			processStatus: 1,
			resultUrl: 'https://example.com/result.mp4',
		})
	})
})
