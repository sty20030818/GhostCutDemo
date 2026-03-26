import { getGhostCutTaskStatuses } from '@/lib/ghostcut'
import { taskStore, useTaskStore, type TaskStoreApi } from '@/store/task-store'

const DEFAULT_POLLING_INTERVAL = 5_000

type CreateTaskPollingControllerInput = {
	store: TaskStoreApi
	intervalMs?: number
	getTaskStatuses?: typeof getGhostCutTaskStatuses
}

type ProcessingEntry = {
	taskId: string
	fileId: string
	ghostcutTaskId: string
}

function getProcessingEntries(store: TaskStoreApi): ProcessingEntry[] {
	return store
		.getState()
		.tasks.flatMap((task) =>
			task.files
				.filter((file) => file.status === 'processing' && file.ghostcutTaskId)
				.map((file) => ({
					taskId: task.id,
					fileId: file.id,
					ghostcutTaskId: file.ghostcutTaskId!,
				})),
		)
}

function getStatusErrorMessage(errorMessage?: string) {
	return errorMessage?.trim() || '任务处理失败，请稍后重试'
}

export function createTaskPollingController({
	store,
	intervalMs = DEFAULT_POLLING_INTERVAL,
	getTaskStatuses = getGhostCutTaskStatuses,
}: CreateTaskPollingControllerInput) {
	let timer: ReturnType<typeof setInterval> | null = null
	let isTickRunning = false

	async function pollNow() {
		if (isTickRunning) {
			return
		}

		const processingEntries = getProcessingEntries(store)
		if (processingEntries.length === 0) {
			stop()
			return
		}

		isTickRunning = true

		try {
			const results = await getTaskStatuses(processingEntries.map((entry) => entry.ghostcutTaskId))
			const resultMap = new Map(results.map((result) => [result.taskId, result]))

			for (const entry of processingEntries) {
				const result = resultMap.get(entry.ghostcutTaskId)
				if (!result) {
					continue
				}

				if (result.status === 'completed') {
					await store.getState().markFileStatus(entry.taskId, entry.fileId, {
						status: 'completed',
						progress: result.progress ?? 100,
						resultUrl: result.resultUrl,
						sourceVideoUrl: result.sourceVideoUrl,
						srcSrtUrl: result.srcSrtUrl,
						tgtSrtUrl: result.tgtSrtUrl,
						ocrTranslateTaskId: result.ocrTranslateTaskId,
						error: undefined,
						resultLabel: '成片已生成',
					})
				}
				else if (result.status === 'failed') {
					await store.getState().markFileStatus(entry.taskId, entry.fileId, {
						status: 'failed',
						progress: 100,
						error: getStatusErrorMessage(result.errorMessage),
						resultLabel: '处理失败',
					})
				}
				else if (typeof result.progress === 'number') {
					await store.getState().markFileStatus(entry.taskId, entry.fileId, {
						status: 'processing',
						progress: result.progress,
						resultLabel: '任务处理中',
					})
				}
			}
		}
		finally {
			isTickRunning = false
		}

		if (getProcessingEntries(store).length === 0) {
			stop()
		}
	}

	function start() {
		if (timer) {
			return
		}

		if (getProcessingEntries(store).length === 0) {
			store.getState().setIsPolling(false)
			return
		}

		store.getState().setIsPolling(true)
		timer = setInterval(() => {
			void pollNow()
		}, intervalMs)
		void pollNow()
	}

	function stop() {
		if (timer) {
			clearInterval(timer)
			timer = null
		}

		store.getState().setIsPolling(false)
	}

	return {
		start,
		stop,
		pollNow,
		isRunning: () => timer !== null,
	}
}

const taskPollingController = createTaskPollingController({
	store: taskStore,
})

export function useTaskPolling() {
	const isPolling = useTaskStore((state) => state.isPolling)

	return {
		start: taskPollingController.start,
		stop: taskPollingController.stop,
		isPolling,
	}
}
