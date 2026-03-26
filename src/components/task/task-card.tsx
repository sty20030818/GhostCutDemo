import { Clock4Icon, LanguagesIcon } from 'lucide-react'

import { TaskFileItem } from '@/components/task/task-file-item'
import { TaskStatusBadge } from '@/components/task/task-status-badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DashboardTask } from '@/pages/task-dashboard.mock'

type TaskCardProps = {
	task: DashboardTask
}

export function TaskCard({ task }: TaskCardProps) {
	return (
		<Card className='border-border/80 bg-card/95'>
			<CardHeader className='flex flex-col gap-3'>
				<div className='flex items-start justify-between gap-3'>
					<div className='flex flex-col gap-1'>
						<h3 className='font-heading text-base font-medium'>{task.name}</h3>
						<div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
							<span className='inline-flex items-center gap-1'>
								<Clock4Icon className='size-3.5' />
								{task.createdAt}
							</span>
							<span className='inline-flex items-center gap-1'>
								<LanguagesIcon className='size-3.5' />
								{task.sourceLanguage} → {task.targetLanguage}
							</span>
						</div>
					</div>
					<TaskStatusBadge status={task.status} />
				</div>
			</CardHeader>
			<CardContent className='flex flex-col gap-3'>
				{task.files.map((file) => (
					<TaskFileItem
						key={file.id}
						file={file}
					/>
				))}
			</CardContent>
		</Card>
	)
}
