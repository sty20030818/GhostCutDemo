import { afterEach, describe, expect, it } from 'vitest'

import { mockTasks } from '@/pages/task-dashboard.mock'
import { clearTasks, deleteTask, getAllTasks, getTaskById, saveTask, updateTask } from '@/lib/db'

describe('ghostcut db', () => {
	afterEach(async () => {
		await clearTasks()
	})

	it('可以保存并读取任务列表', async () => {
		await saveTask(mockTasks[0]!)
		await saveTask(mockTasks[1]!)

		const tasks = await getAllTasks()

		expect(tasks).toHaveLength(2)
		expect(tasks.map((task) => task.id)).toEqual(expect.arrayContaining([mockTasks[0]!.id, mockTasks[1]!.id]))
	})

	it('可以更新单个任务状态和结果字段', async () => {
		const originalTask = mockTasks[0]!
		await saveTask(originalTask)

		const updatedTask = {
			...originalTask,
			status: 'completed' as const,
			files: originalTask.files.map((file, index) =>
				index === 0
					? {
							...file,
							status: 'completed' as const,
							progress: 100,
							resultUrl: 'https://example.com/result.mp4',
						}
					: file,
			),
		}

		await updateTask(updatedTask)
		const task = await getTaskById(originalTask.id)

		expect(task?.status).toBe('completed')
		expect(task?.files[0]?.resultUrl).toBe('https://example.com/result.mp4')
	})

	it('可以删除任务并清空数据库', async () => {
		await saveTask(mockTasks[0]!)
		await saveTask(mockTasks[1]!)

		await deleteTask(mockTasks[0]!.id)
		expect(await getTaskById(mockTasks[0]!.id)).toBeUndefined()

		await clearTasks()
		expect(await getAllTasks()).toEqual([])
	})
})
