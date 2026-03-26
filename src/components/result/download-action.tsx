import type { ComponentType } from 'react'
import { DownloadIcon, FileVideo2Icon, LanguagesIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DownloadActionProps = {
	label: string
	href: string
	icon?: ComponentType<{ className?: string }>
	variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
	download?: boolean
}

const iconByLabel: Record<string, ComponentType<{ className?: string }>> = {
	下载成片: DownloadIcon,
	查看原视频: FileVideo2Icon,
	下载源字幕: LanguagesIcon,
	下载目标字幕: LanguagesIcon,
}

export function DownloadAction({
	label,
	href,
	icon,
	variant = 'outline',
	download = false,
}: DownloadActionProps) {
	const Icon = icon ?? iconByLabel[label] ?? DownloadIcon

	return (
		<a
			href={href}
			target='_blank'
			rel='noreferrer'
			download={download}
			className={cn(buttonVariants({ size: 'sm', variant }))}
		>
			{label}
			<Icon data-icon='inline-end' />
		</a>
	)
}
