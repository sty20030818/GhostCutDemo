import { afterEach, describe, expect, it } from 'vitest'

import type { TranslateTask } from '@/types/task'
import { clearTasks, deleteTask, getAllTasks, getTaskById, saveTask, updateTask } from '@/lib/db'

const testTask1: TranslateTask = {
	id: 'test-task-1',
	name: '测试任务 A',
	createdAt: '2025-01-01 10:00',
	sourceLanguage: 'auto',
	targetLanguage: 'en',
	status: 'processing',
	files: [
		{ id: 'f-1', name: 'a.mp4', duration: '00:30', size: '50 MB', status: 'processing', progress: 30 },
	],
}

const testTask2: TranslateTask = {
	id: 'test-task-2',
	name: '测试任务 B',
	createdAt: '2025-01-01 11:00',
	sourceLanguage: 'zh',
	targetLanguage: 'ja',
	status: 'completed',
	files: [
		{ id: 'f-2', name: 'b.mp4', duration: '01:00', size: '80 MB', status: 'completed', progress: 100, resultUrl: 'https://example.com/b.mp4' },
	],
}

describe('ghostcut db', () => {
	afterEach(async () => {
		await clearTasks()
	})

	it('可以保存并读取任务列表', async () => {
		await saveTask(testTask1)
		await saveTask(testTask2)

		const tasks = await getAllTasks()

		expect(tasks).toHaveLength(2)
		expect(tasks.map((task) => task.id)).toEqual(expect.arrayContaining([testTask1.id, testTask2.id]))
	})

	it('可以更新单个任务状态和结果字段', async () => {
		await saveTask(testTask1)

		const updatedTask: TranslateTask = {
			...testTask1,
			status: 'completed',
			files: testTask1.files.map((file) => ({
				...file,
				status: 'completed' as const,
				progress: 100,
				resultUrl: 'https://example.com/result.mp4',
			})),
		}

		await updateTask(updatedTask)
		const task = await getTaskById(testTask1.id)

		expect(task?.status).toBe('completed')
		expect(task?.files[0]?.resultUrl).toBe('https://example.com/result.mp4')
	})

	it('可以删除任务并清空数据库', async () => {
		await saveTask(testTask1)
		await saveTask(testTask2)

		await deleteTask(testTask1.id)
		expect(await getTaskById(testTask1.id)).toBeUndefined()

		await clearTasks()
		expect(await getAllTasks()).toEqual([])
	})
})
