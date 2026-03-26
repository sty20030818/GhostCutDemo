// 统一语言值类型，后续可直接映射到表单、API 和本地存储。
export type LanguageCode = string

export type LanguageOption = {
	label: string
	value: LanguageCode | null
}

// 文件级状态更细，方便后续表达上传、提交、处理中等真实链路。
export const TASK_FILE_STATUS_ORDER = [
	'pending',
	'uploading',
	'uploaded',
	'submitting',
	'processing',
	'completed',
	'failed',
] as const

export type TaskFileStatus = (typeof TASK_FILE_STATUS_ORDER)[number]

// 批次级状态聚合文件执行结果，后续 store 和轮询器都复用这层状态。
export const TASK_BATCH_STATUS_ORDER = [
	'draft',
	'queued',
	'processing',
	'completed',
	'partial_failed',
	'failed',
] as const

export type TaskBatchStatus = (typeof TASK_BATCH_STATUS_ORDER)[number]

export type TaskStatus = TaskFileStatus | TaskBatchStatus

export type PendingUploadFile = {
	id: string
	name: string
	size: string
}

export type TaskFile = {
	id: string
	name: string
	duration: string
	size: string
	status: TaskFileStatus
	progress: number
	idProject?: string
	tosKey?: string
	sourceUrl?: string
	ghostcutTaskId?: string
	resultUrl?: string
	sourceVideoUrl?: string
	srcSrtUrl?: string
	tgtSrtUrl?: string
	ocrTranslateTaskId?: string
	resultLabel?: string
	error?: string
}

export type TranslateTask = {
	id: string
	name: string
	createdAt: string
	sourceLanguage: LanguageCode
	targetLanguage: LanguageCode
	status: TaskBatchStatus
	files: TaskFile[]
}

export type TaskResult = {
	id: string
	taskId?: string
	taskName: string
	fileId?: string
	fileName: string
	targetLanguage: LanguageCode
	finishedAt: string
	format: string
	downloadUrl?: string
}

// 第四阶段接 Dexie 时，先以当前任务模型作为持久化结构的单一事实来源。
export type StoredTaskFile = TaskFile
export type StoredTask = TranslateTask
