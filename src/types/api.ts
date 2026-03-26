import type { LanguageCode, TaskFileStatus } from '@/types/task'

export type UploadToTosResult = {
	key: string
	url: string
}

export type CreateGhostCutTaskRequest = {
	urls: string[]
	sourceLanguage: LanguageCode
	targetLanguage: LanguageCode
	taskName?: string
}

export type CreateGhostCutTaskResponse = {
	requestId: string
	taskIds: string[]
}

export type GetGhostCutTaskStatusResponse = {
	taskId: string
	status: Extract<TaskFileStatus, 'processing' | 'completed' | 'failed'>
	progress?: number
	resultUrl?: string
	errorMessage?: string
}
