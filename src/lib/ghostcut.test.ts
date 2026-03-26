import { afterEach, describe, expect, it, vi } from 'vitest'

import {
	buildOcrTranslatePayload,
	createOcrTranslateTasks,
	getGhostCutTaskStatuses,
} from '@/lib/ghostcut'

describe('ghostcut api', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it('可以构建 4.1.1.4 文字翻译请求体', () => {
		const payload = buildOcrTranslatePayload({
			sourceUrls: ['https://example.com/source.mp4', 'https://example.com/source-2.mp4'],
			names: ['source', 'source-2'],
			sourceLang: 'zh',
			targetLang: 'en',
			videoInpaintMasks: [{ type: 'trans_only_ocr' }],
			bboxGroups: [{ fill_color: '#ffffff', font_size: 32 }],
		})

		expect(payload).toEqual({
			urls: ['https://example.com/source.mp4', 'https://example.com/source-2.mp4'],
			names: ['source', 'source-2'],
			needChineseOcclude: 11,
			videoInpaintLang: 'zh',
			lang: 'en',
			videoInpaintMasks: '[{"type":"trans_only_ocr"}]',
			bboxGroups: '[{"fill_color":"#ffffff","font_size":32}]',
		})
	})

	it('可以批量提交文字翻译任务并返回批次与作品 id', async () => {
		vi.stubEnv('VITE_GHOSTCUT_BASE_URL', 'https://api.zhaoli.com')
		vi.stubEnv('VITE_GHOSTCUT_APP_KEY', 'demo-key')
		vi.stubEnv('VITE_GHOSTCUT_APP_SECRET', 'demo-secret')

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				code: 1000,
				msg: 'success',
				body: {
					idProject: 230953994,
					dataList: [
						{
							url: 'https://example.com/source.mp4',
							id: 488026661,
						},
						{
							url: 'https://example.com/source-2.mp4',
							id: 488026662,
						},
					],
				},
			}),
		})
		vi.stubGlobal('fetch', fetchMock)

		const payload = buildOcrTranslatePayload({
			sourceUrls: ['https://example.com/source.mp4', 'https://example.com/source-2.mp4'],
			names: ['source', 'source-2'],
			sourceLang: 'zh',
			targetLang: 'en',
		})

		const result = await createOcrTranslateTasks(payload)

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.zhaoli.com/v-w-c/gateway/ve/work/free',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					AppKey: 'demo-key',
					AppSign: expect.any(String),
				}),
				body: '{"urls":["https://example.com/source.mp4","https://example.com/source-2.mp4"],"names":["source","source-2"],"needChineseOcclude":11,"videoInpaintLang":"zh","lang":"en"}',
			}),
		)
		expect(result).toEqual({
			idProject: '230953994',
			items: [
				{
					url: 'https://example.com/source.mp4',
					id: '488026661',
				},
				{
					url: 'https://example.com/source-2.mp4',
					id: '488026662',
				},
			],
		})
	})

	it('可以批量查询任务状态并映射完成结果', async () => {
		vi.stubEnv('VITE_GHOSTCUT_BASE_URL', 'https://api.zhaoli.com')
		vi.stubEnv('VITE_GHOSTCUT_APP_KEY', 'demo-key')
		vi.stubEnv('VITE_GHOSTCUT_APP_SECRET', 'demo-secret')

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				code: 1000,
				msg: 'success',
				body: {
					content: [
						{
							id: 488026661,
							idProject: 230953994,
							processStatus: 1,
							processProgress: 100,
							videoUrl: 'https://example.com/result.mp4',
							srcSrtUrl: 'https://example.com/source.srt',
							tgtSrtUrl: 'https://example.com/target.srt',
							sourceVideoUrl: 'https://example.com/clean.mp4',
							idVeOcrTranslateTask: 7302345,
						},
						{
							id: 488026662,
							idProject: 230953994,
							processStatus: 2,
							errorDetail: '处理失败',
						},
					],
				},
			}),
		})
		vi.stubGlobal('fetch', fetchMock)

		const result = await getGhostCutTaskStatuses(['488026661', '488026662'])

		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.zhaoli.com/v-w-c/gateway/ve/work/status',
			expect.objectContaining({
				method: 'POST',
				body: '{"idWorks":[488026661,488026662]}',
			}),
		)
		expect(result).toEqual([
			{
				taskId: '488026661',
				idProject: '230953994',
				status: 'completed',
				processStatus: 1,
				progress: 100,
				resultUrl: 'https://example.com/result.mp4',
				srcSrtUrl: 'https://example.com/source.srt',
				tgtSrtUrl: 'https://example.com/target.srt',
				sourceVideoUrl: 'https://example.com/clean.mp4',
				ocrTranslateTaskId: '7302345',
			},
			{
				taskId: '488026662',
				idProject: '230953994',
				status: 'failed',
				processStatus: 2,
				errorMessage: '处理失败',
			},
		])
	})
})
