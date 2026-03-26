import { LanguageSelector } from '@/components/upload/language-selector'
import type { LanguageOption } from '@/types/task'

type SourceLanguageSelectorProps = {
	items: LanguageOption[]
}

export function SourceLanguageSelector({ items }: SourceLanguageSelectorProps) {
	return (
		<LanguageSelector
			label='源语言'
			description='先用静态数据确认交互位置，后续再接真实参数。'
			items={items}
		/>
	)
}
