import type { TaskStatus, TranslateTask } from '@/types/task'

function getProcessingDisplayStatus(task: TranslateTask): TaskStatus {
	// 批次聚合会把 uploading/uploaded/submitting/processing 折叠成 `processing`，
	// 这里做展示层还原，避免统一显示“处理中”。
	const statuses = new Set(task.files.map((f) => f.status))

	if (statuses.has('uploading')) return 'uploading'
	if (statuses.has('uploaded')) return 'uploaded'
	if (statuses.has('submitting')) return 'submitting'
	if (statuses.has('processing')) return 'processing'

	return 'processing'
}

export function getTaskDisplayStatus(task: TranslateTask): TaskStatus {
	if (task.status === 'processing') {
		return getProcessingDisplayStatus(task)
	}

	return task.status
}

