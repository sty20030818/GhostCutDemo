import { describe, expect, expectTypeOf, it } from 'vitest'

import {
	sourceLanguageOptions,
	targetLanguageOptions,
} from '@/constants/language'
import {
	TASK_BATCH_STATUS_ORDER,
	TASK_FILE_STATUS_ORDER,
	type LanguageOption,
} from '@/types/task'

describe('task types', () => {
	it('配置数据符合核心类型定义', () => {
		expect(sourceLanguageOptions[0]?.value).toBeNull()
		expect(targetLanguageOptions[0]?.value).toBeNull()
		expect(TASK_FILE_STATUS_ORDER).toContain('processing')
		expect(TASK_BATCH_STATUS_ORDER).toContain('completed')

		expectTypeOf(sourceLanguageOptions).toMatchTypeOf<LanguageOption[]>()
		expectTypeOf(targetLanguageOptions).toMatchTypeOf<LanguageOption[]>()
	})
})
