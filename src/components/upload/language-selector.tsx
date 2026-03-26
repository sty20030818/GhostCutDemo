import { Globe2Icon } from 'lucide-react'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { LanguageOption } from '@/types/task'

type LanguageSelectorProps = {
	label: string
	description: string
	items: LanguageOption[]
	value?: string
	onValueChange?: (value: string) => void
}

export function LanguageSelector({ label, description, items, value, onValueChange }: LanguageSelectorProps) {
	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<p className='text-sm font-medium'>{label}</p>
					<p className='text-xs text-muted-foreground'>{description}</p>
				</div>
				<Globe2Icon className='mt-0.5 size-4 text-muted-foreground' />
			</div>
			<Select items={items} value={value} onValueChange={(v) => { if (v) onValueChange?.(v) }}>
				<SelectTrigger className='w-full'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent
					alignItemWithTrigger={false}
					side='bottom'>
					<SelectGroup>
						<SelectLabel>{label}</SelectLabel>
						{items
							.filter((item) => item.value !== null)
							.map((item) => (
								<SelectItem
									key={item.value}
									value={item.value}>
									{item.label}
								</SelectItem>
							))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	)
}
