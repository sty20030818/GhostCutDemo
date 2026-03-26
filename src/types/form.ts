import type { LanguageCode } from '@/types/task'

export type CreateTaskFormValues = {
	taskName: string
	files: File[]
	sourceLanguage: LanguageCode
	targetLanguage: LanguageCode
	enableSubtitleTranslation: boolean
	enableExportVideo: boolean
}
