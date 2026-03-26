import type { LanguageCode, TaskFileStatus } from '@/types/task'

export type UploadToTosResult = {
	key: string
	url: string
}

export type CreateGhostCutTaskRequest = {
	urls: string[]
	needChineseOcclude: 11
	videoInpaintLang: LanguageCode
	lang: LanguageCode
	videoInpaintMasks?: string
	bboxGroups?: string
}

export type CreateGhostCutTaskResponse = {
	id: string
}

export type GetGhostCutTaskStatusResponse = {
	taskId: string
	status: Extract<TaskFileStatus, 'processing' | 'completed' | 'failed'>
	processStatus?: number
	progress?: number
	resultUrl?: string
	errorMessage?: string
}
