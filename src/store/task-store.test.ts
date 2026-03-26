import { afterEach, describe, expect, it } from 'vitest'

import { clearTasks, getTaskById, saveTask } from '@/lib/db'
import { mockTasks, pendingFiles } from '@/pages/task-dashboard.mock'
import { createTaskStore } from '@/store/task-store'

describe('task store', () => {
	afterEach(async () => {
		await clearTasks()
	})

	it('可以从数据库加载任务并恢复选中项', async () => {
		await saveTask(mockTasks[0]!)
		await saveTask(mockTasks[1]!)

		const store = createTaskStore()
		const tasks = await store.getState().loadTasksFromDB()

		expect(tasks).toHaveLength(2)
		expect(store.getState().tasks).toHaveLength(2)
		expect(store.getState().selectedTaskId).toBe(tasks[0]?.id)
	})

	it('可以创建本地任务并同步写入数据库', async () => {
		const store = createTaskStore()

		const task = await store.getState().createLocalTask({
			taskName: '新的演示任务',
			sourceLanguage: '自动识别',
			targetLanguage: 'English',
			files: pendingFiles,
		})

		expect(store.getState().tasks).toHaveLength(1)
		expect(store.getState().selectedTaskId).toBe(task.id)
		expect(task.files.every((file) => file.status === 'pending')).toBe(true)
		expect(await getTaskById(task.id)).toMatchObject({
			id: task.id,
			name: '新的演示任务',
		})
	})

	it('可以更新文件状态并回写批次状态', async () => {
		const store = createTaskStore()
		await store.getState().bootstrapDemoTasks([mockTasks[0]!])

		await store.getState().markFileStatus(mockTasks[0]!.id, mockTasks[0]!.files[0]!.id, {
			status: 'completed',
			progress: 100,
			resultUrl: 'https://example.com/brand-intro.mp4',
		})

		await store.getState().markFileStatus(mockTasks[0]!.id, mockTasks[0]!.files[1]!.id, {
			status: 'completed',
			progress: 100,
			resultUrl: 'https://example.com/feature-demo.mp4',
		})

		const task = await getTaskById(mockTasks[0]!.id)

		expect(store.getState().tasks[0]?.status).toBe('completed')
		expect(task?.status).toBe('completed')
		expect(task?.files.every((file) => file.status === 'completed')).toBe(true)
	})
})
