import { Globe2Icon } from 'lucide-react'

import type { DashboardLanguageOption } from '@/pages/task-dashboard.mock'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

type LanguageSelectorProps = {
	label: string
	description: string
	items: DashboardLanguageOption[]
}

export function LanguageSelector({ label, description, items }: LanguageSelectorProps) {
	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<p className='text-sm font-medium'>{label}</p>
					<p className='text-xs text-muted-foreground'>{description}</p>
				</div>
				<Globe2Icon className='mt-0.5 size-4 text-muted-foreground' />
			</div>
			<Select items={items}>
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
