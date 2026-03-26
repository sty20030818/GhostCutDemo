import type { LanguageCode, LanguageOption } from '@/types/task'

export const sourceLanguageOptions: LanguageOption[] = [
	{ label: '选择源语言', value: null },
	{ label: '自动识别', value: 'auto' },
	{ label: '中文/繁体', value: 'zh' },
	{ label: '英文', value: 'en' },
	{ label: '日语', value: 'ja' },
	{ label: '韩语', value: 'ko' },
	{ label: '印尼语', value: 'id' },
	{ label: '马来语', value: 'ms' },
	{ label: '菲律宾语', value: 'fil' },
	{ label: '德语', value: 'de' },
	{ label: '法语', value: 'fr' },
	{ label: '阿拉伯语', value: 'ar' },
	{ label: '西班牙语', value: 'es' },
	{ label: '葡萄牙语', value: 'pt' },
	{ label: '意大利语', value: 'it' },
	{ label: '土耳其语', value: 'tr' },
	{ label: '保加利亚语', value: 'bg' },
	{ label: '越南语', value: 'vi' },
	{ label: '荷兰语', value: 'nl' },
]

export const targetLanguageOptions: LanguageOption[] = [
	{ label: '选择目标语言', value: null },
	{ label: '中文', value: 'zh' },
	{ label: '英文', value: 'en' },
	{ label: '繁体中文', value: 'zh-hant' },
	{ label: '日语', value: 'ja' },
	{ label: '韩语', value: 'ko' },
	{ label: '葡萄牙语', value: 'pt' },
	{ label: '葡萄牙语-巴西', value: 'pt-br' },
	{ label: '法语', value: 'fr' },
	{ label: '西班牙语', value: 'es' },
	{ label: '阿拉伯语', value: 'ar' },
	{ label: '越南语', value: 'vi' },
	{ label: '泰语', value: 'th' },
	{ label: '德语', value: 'de' },
	{ label: '俄语', value: 'ru' },
	{ label: '意大利语', value: 'it' },
	{ label: '印尼语', value: 'id' },
	{ label: '印地语', value: 'hi' },
	{ label: '土耳其语', value: 'tr' },
	{ label: '菲律宾语', value: 'fil' },
	{ label: '马来西亚语', value: 'ms' },
	{ label: '高棉语', value: 'km' },
	{ label: '波兰语', value: 'pl' },
	{ label: '匈牙利语', value: 'hu' },
	{ label: '捷克语', value: 'cs' },
	{ label: '保加利亚语', value: 'bg' },
	{ label: '罗马尼亚语', value: 'ro' },
	{ label: '丹麦语', value: 'da' },
	{ label: '挪威语', value: 'no' },
	{ label: '瑞典语', value: 'sv' },
	{ label: '荷兰语', value: 'nl' },
	{ label: '芬兰语', value: 'fi' },
]

/** 语言代码 → 中文标签映射表，合并源语言和目标语言 */
const languageLabelMap: Record<string, string> = Object.fromEntries(
	[...sourceLanguageOptions, ...targetLanguageOptions]
		.filter((opt) => opt.value !== null)
		.map((opt) => [opt.value, opt.label]),
)

/** 将语言代码转为中文标签，找不到时原样返回 */
export function getLanguageLabel(code: LanguageCode): string {
	return languageLabelMap[code] ?? code
}
