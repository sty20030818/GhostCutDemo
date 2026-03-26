import type { LanguageCode, TaskFileStatus } from '@/types/task'

export type UploadToTosResult = {
	key: string
	url: string
}

export type CreateGhostCutTaskRequest = {
	urls: string[]
	names?: string[]
	needChineseOcclude: 11
	videoInpaintLang: LanguageCode
	lang: LanguageCode
	videoInpaintMasks?: string
	bboxGroups?: string
}

export type CreateGhostCutTaskResponse = {
	idProject: string
	items: Array<{
		url: string
		id: string
	}>
}

export type GetGhostCutTaskStatusResponse = {
	taskId: string
	idProject?: string
	status: Extract<TaskFileStatus, 'processing' | 'completed' | 'failed'>
	processStatus?: number
	progress?: number
	resultUrl?: string
	sourceVideoUrl?: string
	srcSrtUrl?: string
	tgtSrtUrl?: string
	ocrTranslateTaskId?: string
	errorMessage?: string
}
