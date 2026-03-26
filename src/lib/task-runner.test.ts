import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearTasks, getTaskById } from '@/lib/db'
import { runTaskBatch } from '@/lib/task-runner'
import { createTaskStore } from '@/store/task-store'

const { uploadToTosMock, createOcrTranslateTasksMock } = vi.hoisted(() => ({
	uploadToTosMock: vi.fn(),
	createOcrTranslateTasksMock: vi.fn(),
}))

vi.mock('@/lib/tos', () => ({
	uploadToTos: uploadToTosMock,
}))

vi.mock('@/lib/ghostcut', () => ({
	buildOcrTranslatePayload: ({
		sourceUrls,
		names,
		sourceLang,
		targetLang,
	}: {
		sourceUrls: string[]
		names: string[]
		sourceLang: string
		targetLang: string
	}) => ({
		urls: sourceUrls,
		names,
		needChineseOcclude: 11,
		videoInpaintLang: sourceLang,
		lang: targetLang,
	}),
	createOcrTranslateTasks: createOcrTranslateTasksMock,
}))

describe('task runner', () => {
	afterEach(async () => {
		uploadToTosMock.mockReset()
		createOcrTranslateTasksMock.mockReset()
		await clearTasks()
	})

	it('会顺序上传文件并批量创建 GhostCut 任务', async () => {
		const store = createTaskStore()
		const files = [
			new File(['video-1'], 'episode-1.mp4', { type: 'video/mp4' }),
			new File(['video-2'], 'episode-2.mp4', { type: 'video/mp4' }),
		]

		const task = await store.getState().createLocalTask({
			taskName: '批量翻译任务',
			sourceLanguage: 'zh',
			targetLanguage: 'en',
			files: files.map((file, index) => ({
				id: `pending-${index + 1}`,
				name: file.name,
				size: `${file.size} B`,
			})),
		})

		uploadToTosMock
			.mockResolvedValueOnce({
				key: 'ghostcut-demo/episode-1.mp4',
				url: 'https://tos.example.com/episode-1.mp4',
			})
			.mockResolvedValueOnce({
				key: 'ghostcut-demo/episode-2.mp4',
				url: 'https://tos.example.com/episode-2.mp4',
			})

		createOcrTranslateTasksMock.mockResolvedValueOnce({
			idProject: 'project-1',
			items: [
				{
					url: 'https://tos.example.com/episode-1.mp4',
					id: 'ghostcut-task-1',
				},
				{
					url: 'https://tos.example.com/episode-2.mp4',
					id: 'ghostcut-task-2',
				},
			],
		})

		await runTaskBatch({
			store,
			taskId: task.id,
			files,
		})

		const storedTask = await getTaskById(task.id)

		expect(uploadToTosMock).toHaveBeenCalledTimes(2)
		expect(createOcrTranslateTasksMock).toHaveBeenCalledWith(
			expect.objectContaining({
				urls: ['https://tos.example.com/episode-1.mp4', 'https://tos.example.com/episode-2.mp4'],
				names: ['episode-1-英文', 'episode-2-英文'],
				videoInpaintLang: 'zh',
				lang: 'en',
			}),
		)
		expect(storedTask?.status).toBe('processing')
		expect(storedTask?.files[0]).toMatchObject({
			status: 'processing',
			ghostcutTaskId: 'ghostcut-task-1',
			idProject: 'project-1',
			sourceUrl: 'https://tos.example.com/episode-1.mp4',
			tosKey: 'ghostcut-demo/episode-1.mp4',
		})
		expect(storedTask?.files[1]).toMatchObject({
			status: 'processing',
			ghostcutTaskId: 'ghostcut-task-2',
			idProject: 'project-1',
		})
	})

	it('批量创建 GhostCut 任务失败时会把已上传文件标记为失败', async () => {
		const store = createTaskStore()
		const files = [
			new File(['video-1'], 'broken-1.mp4', { type: 'video/mp4' }),
			new File(['video-2'], 'broken-2.mp4', { type: 'video/mp4' }),
		]

		const task = await store.getState().createLocalTask({
			taskName: '失败任务',
			sourceLanguage: 'zh',
			targetLanguage: 'en',
			files: files.map((file, index) => ({
				id: `pending-${index + 1}`,
				name: file.name,
				size: `${file.size} B`,
			})),
		})

		uploadToTosMock
			.mockResolvedValueOnce({
				key: 'ghostcut-demo/broken-1.mp4',
				url: 'https://tos.example.com/broken-1.mp4',
			})
			.mockResolvedValueOnce({
				key: 'ghostcut-demo/broken-2.mp4',
				url: 'https://tos.example.com/broken-2.mp4',
			})
		createOcrTranslateTasksMock.mockRejectedValueOnce(new Error('GhostCut 批量创建失败'))

		await runTaskBatch({
			store,
			taskId: task.id,
			files,
		})

		const storedTask = await getTaskById(task.id)

		expect(storedTask?.status).toBe('failed')
		expect(storedTask?.files[0]).toMatchObject({
			status: 'failed',
			error: 'GhostCut 批量创建失败',
			sourceUrl: 'https://tos.example.com/broken-1.mp4',
		})
		expect(storedTask?.files[1]).toMatchObject({
			status: 'failed',
			error: 'GhostCut 批量创建失败',
			sourceUrl: 'https://tos.example.com/broken-2.mp4',
		})
	})
})
