import { CheckCircle2Icon, Clock3Icon, LoaderCircleIcon, TriangleAlertIcon, UploadIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { DashboardTaskStatus } from '@/pages/task-dashboard.mock'

type TaskStatusBadgeProps = {
	status: DashboardTaskStatus
}

const statusConfig = {
	queued: {
		label: '待创建',
		variant: 'secondary' as const,
		icon: Clock3Icon,
	},
	uploading: {
		label: '上传中',
		variant: 'outline' as const,
		icon: UploadIcon,
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
	failed: {
		label: '失败',
		variant: 'destructive' as const,
		icon: TriangleAlertIcon,
	},
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
	const { icon: Icon, label, variant } = statusConfig[status]

	return (
		<Badge variant={variant}>
			<Icon data-icon='inline-start' />
			{label}
		</Badge>
	)
}
