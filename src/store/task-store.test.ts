import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PendingUploadFile, TranslateTask } from '@/types/task'
import { clearTasks, getTaskById, saveTask } from '@/lib/db'
import { createTaskStore } from '@/store/task-store'

const { uploadToTosMock } = vi.hoisted(() => ({
	uploadToTosMock: vi.fn(),
}))

vi.mock('@/lib/tos', () => ({
	uploadToTos: uploadToTosMock,
}))

const pendingFiles: PendingUploadFile[] = [
	{ id: 'file-1', name: 'brand-intro.mp4', size: '128 MB' },
	{ id: 'file-2', name: 'feature-demo.mov', size: '246 MB' },
	{ id: 'file-3', name: 'customer-story.mp4', size: '88 MB' },
]

const testTask: TranslateTask = {
	id: 'test-task-1',
	name: '品牌视频翻译',
	createdAt: '2025-01-01 10:00',
	sourceLanguage: 'auto',
	targetLanguage: 'en',
	status: 'processing',
	files: [
		{ id: 'f-1', name: 'brand-intro.mp4', duration: '00:48', size: '128 MB', status: 'uploading', progress: 72 },
		{ id: 'f-2', name: 'feature-demo.mov', duration: '01:32', size: '246 MB', status: 'processing', progress: 46 },
	],
}

const testTask2: TranslateTask = {
	id: 'test-task-2',
	name: '客户案例校对',
	createdAt: '2025-01-01 11:00',
	sourceLanguage: 'zh',
	targetLanguage: 'ja',
	status: 'completed',
	files: [
		{ id: 'f-3', name: 'customer-story.mp4', duration: '02:10', size: '88 MB', status: 'completed', progress: 100 },
	],
}

describe('task store', () => {
	afterEach(async () => {
		await clearTasks()
	})

	it('可以从数据库加载任务并恢复选中项', async () => {
		await saveTask(testTask)
		await saveTask(testTask2)

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

		await saveTask(testTask)
		await store.getState().loadTasksFromDB()

		await store.getState().markFileStatus(testTask.id, testTask.files[0]!.id, {
			status: 'completed',
			progress: 100,
			resultUrl: 'https://example.com/brand-intro.mp4',
		})

		await store.getState().markFileStatus(testTask.id, testTask.files[1]!.id, {
			status: 'completed',
			progress: 100,
			resultUrl: 'https://example.com/feature-demo.mp4',
		})

		const task = await getTaskById(testTask.id)

		expect(store.getState().tasks[0]?.status).toBe('completed')
		expect(task?.status).toBe('completed')
		expect(task?.files.every((file) => file.status === 'completed')).toBe(true)
	})

	it('可以上传本地文件并把 sourceUrl 写回任务', async () => {
		uploadToTosMock
			.mockResolvedValueOnce({ key: 'ghostcut-demo/brand-intro.mp4', url: 'https://tos.example.com/brand-intro.mp4' })
			.mockResolvedValueOnce({ key: 'ghostcut-demo/feature-demo.mov', url: 'https://tos.example.com/feature-demo.mov' })

		const store = createTaskStore()
		const files = [
			new File(['brand-video'], 'brand-intro.mp4', { type: 'video/mp4' }),
			new File(['feature-video'], 'feature-demo.mov', { type: 'video/quicktime' }),
		]

		const task = await store.getState().createLocalTask({
			taskName: '上传测试任务',
			sourceLanguage: '自动识别',
			targetLanguage: 'English',
			files: files.map((file, index) => ({
				id: `pending-${index + 1}`,
				name: file.name,
				size: `${file.size} B`,
			})),
		})

		await store.getState().uploadTaskFiles(task.id, files)
		const storedTask = await getTaskById(task.id)

		expect(storedTask?.status).toBe('processing')
		expect(storedTask?.files[0]?.status).toBe('uploaded')
		expect(storedTask?.files[0]?.sourceUrl).toBe('https://tos.example.com/brand-intro.mp4')
		expect(storedTask?.files[0]?.tosKey).toContain('brand-intro.mp4')
	})
})
