import { describe, expect, expectTypeOf, it } from 'vitest'

import {
	mockResults,
	mockTasks,
	pendingFiles,
	sourceLanguageOptions,
	targetLanguageOptions,
} from '@/pages/task-dashboard.mock'
import {
	TASK_BATCH_STATUS_ORDER,
	TASK_FILE_STATUS_ORDER,
	type LanguageOption,
	type PendingUploadFile,
	type TaskResult,
	type TranslateTask,
} from '@/types/task'

describe('task types', () => {
	it('让阶段二的 mock 数据复用阶段三核心类型', () => {
		expect(mockTasks.length).toBeGreaterThan(0)
		expect(mockResults.length).toBeGreaterThan(0)
		expect(pendingFiles.length).toBeGreaterThan(0)

		expect(sourceLanguageOptions[0]?.value).toBeNull()
		expect(targetLanguageOptions[0]?.value).toBeNull()
		expect(TASK_FILE_STATUS_ORDER).toContain('processing')
		expect(TASK_BATCH_STATUS_ORDER).toContain('completed')

		expectTypeOf(mockTasks).toMatchTypeOf<TranslateTask[]>()
		expectTypeOf(mockResults).toMatchTypeOf<TaskResult[]>()
		expectTypeOf(pendingFiles).toMatchTypeOf<PendingUploadFile[]>()
		expectTypeOf(sourceLanguageOptions).toMatchTypeOf<LanguageOption[]>()
		expectTypeOf(targetLanguageOptions).toMatchTypeOf<LanguageOption[]>()
	})
})
