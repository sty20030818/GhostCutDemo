import { LanguageSelector } from '@/components/upload/language-selector'
import type { DashboardLanguageOption } from '@/pages/task-dashboard.mock'

type TargetLanguageSelectorProps = {
	items: DashboardLanguageOption[]
}

export function TargetLanguageSelector({ items }: TargetLanguageSelectorProps) {
	return (
		<LanguageSelector
			label='目标语言'
			description='这里先展示单选下拉，后续阶段再映射到 GhostCut 请求体。'
			items={items}
		/>
	)
}
