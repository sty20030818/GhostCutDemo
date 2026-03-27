import { CheckCircle2Icon, Clock3Icon, LoaderCircleIcon, SendIcon, TriangleAlertIcon, UploadIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@/types/task'

type TaskStatusBadgeProps = {
	status: TaskStatus
	size?: 'default' | 'lg'
}

const statusConfig = {
	draft: {
		label: '草稿',
		variant: 'secondary' as const,
		icon: Clock3Icon,
	},
	pending: {
		label: '待上传',
		variant: 'secondary' as const,
		icon: Clock3Icon,
	},
	queued: {
		label: '排队中',
		variant: 'secondary' as const,
		icon: Clock3Icon,
	},
	uploading: {
		label: '上传中',
		variant: 'outline' as const,
		icon: LoaderCircleIcon,
	},
	uploaded: {
		label: '已上传',
		variant: 'outline' as const,
		icon: UploadIcon,
	},
	submitting: {
		label: '提交中',
		variant: 'outline' as const,
		icon: SendIcon,
	},
	processing: {
		label: '处理中',
		variant: 'outline' as const,
		icon: LoaderCircleIcon,
	},
	completed: {
		label: '已完成',
		variant: 'default' as const,
		icon: CheckCircle2Icon,
	},
	partial_failed: {
		label: '部分失败',
		variant: 'destructive' as const,
		icon: TriangleAlertIcon,
	},
	failed: {
		label: '失败',
		variant: 'destructive' as const,
		icon: TriangleAlertIcon,
	},
}

export function TaskStatusBadge({ status, size = 'default' }: TaskStatusBadgeProps) {
	const { icon: Icon, label, variant } = statusConfig[status]
	const shouldSpin = status === 'uploading' || status === 'submitting' || status === 'processing'
	const badgeSizeClass = size === 'lg' ? 'h-6 px-2.5 text-sm [&>svg]:size-3.5!' : undefined

	return (
		<Badge
			variant={variant}
			className={badgeSizeClass}>
			<Icon data-icon='inline-start' className={shouldSpin ? 'animate-spin' : undefined} />
			{label}
		</Badge>
	)
}
