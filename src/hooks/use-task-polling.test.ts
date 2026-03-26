import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearTasks, saveTask } from '@/lib/db'
import { createTaskStore } from '@/store/task-store'
import type { TranslateTask } from '@/types/task'
import { createTaskPollingController } from '@/hooks/use-task-polling'

const { getGhostCutTaskStatusesMock } = vi.hoisted(() => ({
	getGhostCutTaskStatusesMock: vi.fn(),
}))

vi.mock('@/lib/ghostcut', () => ({
	getGhostCutTaskStatuses: getGhostCutTaskStatusesMock,
}))

describe('task polling', () => {
	afterEach(async () => {
		getGhostCutTaskStatusesMock.mockReset()
		await clearTasks()
	})

	it('轮询完成后会把文件结果写回并自动停止', async () => {
		const task: TranslateTask = {
			id: 'task-processing',
			name: '处理中任务',
			createdAt: '03-26 15:00',
			sourceLanguage: 'zh',
			targetLanguage: 'en',
			status: 'processing',
			files: [
				{
					id: 'task-processing-file-1',
					name: 'episode-1.mp4',
					duration: '--:--',
					size: '12 MB',
					status: 'processing',
					progress: 100,
					ghostcutTaskId: 'ghostcut-task-1',
					sourceUrl: 'https://tos.example.com/episode-1.mp4',
				},
			],
		}

		await saveTask(task)
		const store = createTaskStore({
			tasks: [task],
			selectedTaskId: task.id,
			isPolling: false,
		})

		getGhostCutTaskStatusesMock.mockResolvedValueOnce([
			{
				taskId: 'ghostcut-task-1',
				status: 'completed',
				processStatus: 1,
				progress: 100,
				resultUrl: 'https://ghostcut.example.com/episode-1.mp4',
				srcSrtUrl: 'https://ghostcut.example.com/episode-1-src.srt',
				tgtSrtUrl: 'https://ghostcut.example.com/episode-1-tgt.srt',
				sourceVideoUrl: 'https://ghostcut.example.com/episode-1-clean.mp4',
				ocrTranslateTaskId: 'ocr-task-1',
			},
		])

		const controller = createTaskPollingController({
			store,
			intervalMs: 5_000,
		})

		store.getState().setIsPolling(true)
		await controller.pollNow()

		const nextTask = store.getState().tasks[0]

		expect(getGhostCutTaskStatusesMock).toHaveBeenCalledWith(['ghostcut-task-1'])
		expect(nextTask?.files[0]).toMatchObject({
			status: 'completed',
			resultUrl: 'https://ghostcut.example.com/episode-1.mp4',
			srcSrtUrl: 'https://ghostcut.example.com/episode-1-src.srt',
			tgtSrtUrl: 'https://ghostcut.example.com/episode-1-tgt.srt',
			sourceVideoUrl: 'https://ghostcut.example.com/episode-1-clean.mp4',
			ocrTranslateTaskId: 'ocr-task-1',
			resultLabel: '成片已生成',
		})
		expect(store.getState().isPolling).toBe(false)
	})

	it('轮询失败时会写入错误并停止重复查询', async () => {
		const task: TranslateTask = {
			id: 'task-failed',
			name: '失败轮询任务',
			createdAt: '03-26 15:05',
			sourceLanguage: 'zh',
			targetLanguage: 'en',
			status: 'processing',
			files: [
				{
					id: 'task-failed-file-1',
					name: 'episode-2.mp4',
					duration: '--:--',
					size: '18 MB',
					status: 'processing',
					progress: 100,
					ghostcutTaskId: 'ghostcut-task-2',
					sourceUrl: 'https://tos.example.com/episode-2.mp4',
				},
			],
		}

		await saveTask(task)
		const store = createTaskStore({
			tasks: [task],
			selectedTaskId: task.id,
			isPolling: false,
		})

		getGhostCutTaskStatusesMock.mockResolvedValueOnce([
			{
				taskId: 'ghostcut-task-2',
				status: 'failed',
				processStatus: 2,
				errorMessage: '处理失败',
			},
		])

		const controller = createTaskPollingController({
			store,
			intervalMs: 5_000,
		})

		store.getState().setIsPolling(true)
		await controller.pollNow()

		const nextTask = store.getState().tasks[0]

		expect(nextTask?.files[0]).toMatchObject({
			status: 'failed',
			error: '处理失败',
			resultLabel: '处理失败',
		})
		expect(store.getState().isPolling).toBe(false)
	})
})
