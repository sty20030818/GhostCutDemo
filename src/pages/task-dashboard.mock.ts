import type { LanguageOption, PendingUploadFile, TaskResult, TranslateTask } from '@/types/task'

export const sourceLanguageOptions: LanguageOption[] = [
	{ label: '选择源语言', value: null },
	{ label: '自动识别', value: 'auto' },
	{ label: '中文', value: 'zh' },
	{ label: 'English', value: 'en' },
	{ label: '日本語', value: 'ja' },
]

export const targetLanguageOptions: LanguageOption[] = [
	{ label: '选择目标语言', value: null },
	{ label: '简体中文', value: 'zh-CN' },
	{ label: 'English', value: 'en-US' },
	{ label: '日本語', value: 'ja-JP' },
	{ label: '한국어', value: 'ko-KR' },
]

export const pendingFiles: PendingUploadFile[] = [
	{ id: 'file-1', name: 'brand-intro.mp4', size: '128 MB' },
	{ id: 'file-2', name: 'feature-demo.mov', size: '246 MB' },
	{ id: 'file-3', name: 'customer-story.mp4', size: '88 MB' },
]

export const mockTasks: TranslateTask[] = [
	{
		id: 'task-1',
		name: '品牌视频首批翻译',
		createdAt: '今天 13:40',
		sourceLanguage: '自动识别',
		targetLanguage: 'English',
		status: 'processing',
		files: [
			{
				id: 'task-1-file-1',
				name: 'brand-intro.mp4',
				duration: '00:48',
				size: '128 MB',
				status: 'uploading',
				progress: 72,
			},
			{
				id: 'task-1-file-2',
				name: 'feature-demo.mov',
				duration: '01:32',
				size: '246 MB',
				status: 'processing',
				progress: 46,
				resultLabel: '字幕生成中',
			},
		],
	},
	{
		id: 'task-2',
		name: '客户案例二次校对',
		createdAt: '今天 12:15',
		sourceLanguage: '中文',
		targetLanguage: '日本語',
		status: 'completed',
		files: [
			{
				id: 'task-2-file-1',
				name: 'customer-story.mp4',
				duration: '02:10',
				size: '88 MB',
				status: 'completed',
				progress: 100,
				resultLabel: '成片已生成',
			},
		],
	},
	{
		id: 'task-3',
		name: '活动预热视频补发',
		createdAt: '昨天 20:08',
		sourceLanguage: 'English',
		targetLanguage: '简体中文',
		status: 'failed',
		files: [
			{
				id: 'task-3-file-1',
				name: 'promo-teaser.mp4',
				duration: '00:34',
				size: '56 MB',
				status: 'failed',
				progress: 100,
				error: '字幕轨解析失败，等待重试',
			},
		],
	},
]

export const mockResults: TaskResult[] = [
	{
		id: 'result-1',
		taskName: '客户案例二次校对',
		fileName: 'customer-story-ja.mp4',
		targetLanguage: '日本語',
		finishedAt: '今天 12:38',
		format: 'MP4 / 内嵌字幕',
	},
	{
		id: 'result-2',
		taskName: '品牌视频历史版本',
		fileName: 'brand-intro-en.srt',
		targetLanguage: 'English',
		finishedAt: '今天 10:12',
		format: 'SRT / 字幕文件',
	},
]
