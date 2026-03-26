import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import { deleteTask, getAllTasks, saveTask, updateTask as persistTask } from '@/lib/db'
import { uploadToTos } from '@/lib/tos'
import type { LanguageCode, PendingUploadFile, TaskBatchStatus, TaskFile, TranslateTask } from '@/types/task'

type CreateLocalTaskInput = {
	taskName: string
	sourceLanguage: LanguageCode
	targetLanguage: LanguageCode
	files: PendingUploadFile[]
}

type MarkFileStatusInput = Partial<
	Pick<
		TaskFile,
		| 'status'
		| 'progress'
		| 'idProject'
		| 'tosKey'
		| 'sourceUrl'
		| 'ghostcutTaskId'
		| 'resultUrl'
		| 'sourceVideoUrl'
		| 'srcSrtUrl'
		| 'tgtSrtUrl'
		| 'ocrTranslateTaskId'
		| 'resultLabel'
		| 'error'
	>
>

export type TaskStoreState = {
	tasks: TranslateTask[]
	selectedTaskId: string | null
	isPolling: boolean
	setSelectedTaskId: (taskId: string | null) => void
	setIsPolling: (isPolling: boolean) => void
	loadTasksFromDB: () => Promise<TranslateTask[]>
	createLocalTask: (input: CreateLocalTaskInput) => Promise<TranslateTask>
	uploadTaskFiles: (taskId: string, files: File[]) => Promise<void>
	updateTask: (task: TranslateTask) => Promise<void>
	removeTask: (taskId: string) => Promise<void>
	markTaskCompleted: (taskId: string) => Promise<void>
	markFileStatus: (taskId: string, fileId: string, patch: MarkFileStatusInput) => Promise<void>
}

function getInitialSelectedTaskId(tasks: TranslateTask[], selectedTaskId: string | null) {
	if (selectedTaskId && tasks.some((task) => task.id === selectedTaskId)) {
		return selectedTaskId
	}

	return tasks[0]?.id ?? null
}

function deriveBatchStatus(files: TaskFile[]): TaskBatchStatus {
	if (files.length === 0) {
		return 'draft'
	}

	if (files.some((file) => ['uploading', 'uploaded', 'submitting', 'processing'].includes(file.status))) {
		return 'processing'
	}

	if (files.every((file) => file.status === 'completed')) {
		return 'completed'
	}

	if (files.every((file) => file.status === 'failed')) {
		return 'failed'
	}

	if (files.some((file) => file.status === 'failed')) {
		return 'partial_failed'
	}

	if (files.every((file) => file.status === 'pending')) {
		return 'queued'
	}

	return 'processing'
}

function buildPendingTaskFiles(files: PendingUploadFile[]): TaskFile[] {
	return files.map((file) => ({
		id: file.id,
		name: file.name,
		size: file.size,
		duration: file.duration ?? '--:--',
		status: 'pending',
		progress: 0,
	}))
}

function createLocalTaskRecord(input: CreateLocalTaskInput): TranslateTask {
	const now = new Date()
	const taskId = globalThis.crypto?.randomUUID?.() ?? `task-${now.getTime()}`

	return {
		id: taskId,
		name: input.taskName,
		createdAt: now.toLocaleString('zh-CN', {
			hour12: false,
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		}),
		sourceLanguage: input.sourceLanguage,
		targetLanguage: input.targetLanguage,
		status: 'queued',
		files: buildPendingTaskFiles(input.files).map((file, index) => ({
			...file,
			id: `${taskId}-file-${index + 1}`,
		})),
	}
}

function replaceTask(tasks: TranslateTask[], nextTask: TranslateTask) {
	return tasks.map((task) => (task.id === nextTask.id ? nextTask : task))
}

async function updateTaskWithFilePatch(
	get: () => TaskStoreState,
	set: (partial: Partial<TaskStoreState> | ((state: TaskStoreState) => Partial<TaskStoreState>)) => void,
	taskId: string,
	fileId: string,
	patch: MarkFileStatusInput,
) {
	const currentTask = get().tasks.find((task) => task.id === taskId)
	if (!currentTask) {
		return
	}

	const files = currentTask.files.map((file) => (file.id === fileId ? { ...file, ...patch } : file))
	const nextTask: TranslateTask = {
		...currentTask,
		files,
		status: deriveBatchStatus(files),
	}

	await persistTask(nextTask)
	set((state) => ({
		tasks: replaceTask(state.tasks, nextTask),
	}))
}

export function createTaskStore(
	initialState?: Partial<Pick<TaskStoreState, 'tasks' | 'selectedTaskId' | 'isPolling'>>,
) {
	return createStore<TaskStoreState>()((set, get) => ({
		tasks: initialState?.tasks ?? [],
		selectedTaskId: initialState?.selectedTaskId ?? null,
		isPolling: initialState?.isPolling ?? false,

		setSelectedTaskId(taskId) {
			set({ selectedTaskId: taskId })
		},

		setIsPolling(isPolling) {
			set({ isPolling })
		},

		async loadTasksFromDB() {
			const tasks = await getAllTasks()
			set((state) => ({
				tasks,
				selectedTaskId: getInitialSelectedTaskId(tasks, state.selectedTaskId),
			}))
			return tasks
		},

		async createLocalTask(input) {
			const task = createLocalTaskRecord(input)
			await saveTask(task)

			set((state) => ({
				tasks: [task, ...state.tasks],
				selectedTaskId: task.id,
			}))

			return task
		},

		async uploadTaskFiles(taskId, files) {
			const currentTask = get().tasks.find((task) => task.id === taskId)
			if (!currentTask) {
				return
			}

			for (const [index, file] of files.entries()) {
				const taskFile = get().tasks.find((task) => task.id === taskId)?.files[index]
				if (!taskFile) {
					continue
				}

				await updateTaskWithFilePatch(get, set, taskId, taskFile.id, {
					status: 'uploading',
					progress: 12,
					error: undefined,
					resultLabel: '上传中',
				})

				try {
					const uploadResult = await uploadToTos(file)

					await updateTaskWithFilePatch(get, set, taskId, taskFile.id, {
						status: 'uploaded',
						progress: 100,
						sourceUrl: uploadResult.url,
						tosKey: uploadResult.key,
						resultLabel: '上传完成',
					})
				}
				catch (error) {
					await updateTaskWithFilePatch(get, set, taskId, taskFile.id, {
						status: 'failed',
						progress: 100,
						error: error instanceof Error ? error.message : '上传失败，请稍后重试',
						resultLabel: '上传失败',
					})
				}
			}
		},

		async updateTask(task) {
			await persistTask(task)
			set((state) => ({
				tasks: replaceTask(state.tasks, task),
				selectedTaskId: getInitialSelectedTaskId(replaceTask(state.tasks, task), state.selectedTaskId),
			}))
		},

		async removeTask(taskId) {
			await deleteTask(taskId)
			set((state) => {
				const tasks = state.tasks.filter((task) => task.id !== taskId)

				return {
					tasks,
					selectedTaskId: getInitialSelectedTaskId(
						tasks,
						state.selectedTaskId === taskId ? null : state.selectedTaskId,
					),
				}
			})
		},

		async markTaskCompleted(taskId) {
			const currentTask = get().tasks.find((task) => task.id === taskId)
			if (!currentTask) {
				return
			}

			const nextTask: TranslateTask = {
				...currentTask,
				status: 'completed',
				files: currentTask.files.map((file) => ({
					...file,
					status: 'completed',
					progress: 100,
				})),
			}

			await persistTask(nextTask)
			set((state) => ({
				tasks: replaceTask(state.tasks, nextTask),
			}))
		},

		async markFileStatus(taskId, fileId, patch) {
			await updateTaskWithFilePatch(get, set, taskId, fileId, patch)
		},
	}))
}

export type TaskStoreApi = ReturnType<typeof createTaskStore>
export const taskStore = createTaskStore()

export function useTaskStore<T>(selector: (state: TaskStoreState) => T) {
	return useStore(taskStore, selector)
}
