import { LanguageSelector } from '@/components/upload/language-selector'
import type { LanguageOption } from '@/types/task'

type SourceLanguageSelectorProps = {
	items: LanguageOption[]
	value?: string
	onValueChange?: (value: string) => void
}

export function SourceLanguageSelector({ items, value, onValueChange }: SourceLanguageSelectorProps) {
	return (
		<LanguageSelector
			label='源语言'
			description='选择视频的原始语言，支持自动识别。'
			items={items}
			value={value}
			onValueChange={onValueChange}
		/>
	)
}
