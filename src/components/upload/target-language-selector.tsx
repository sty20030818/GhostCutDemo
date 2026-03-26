import { LanguageSelector } from '@/components/upload/language-selector'
import type { LanguageOption } from '@/types/task'

type TargetLanguageSelectorProps = {
	items: LanguageOption[]
	value?: string
	onValueChange?: (value: string) => void
}

export function TargetLanguageSelector({ items, value, onValueChange }: TargetLanguageSelectorProps) {
	return (
		<LanguageSelector
			label='目标语言'
			description='选择翻译后的输出语言。'
			items={items}
			value={value}
			onValueChange={onValueChange}
		/>
	)
}
