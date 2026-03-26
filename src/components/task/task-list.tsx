import { FolderClockIcon } from 'lucide-react'

import { TaskCard } from '@/components/task/task-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DashboardTask } from '@/pages/task-dashboard.mock'

type TaskListProps = {
	tasks: DashboardTask[]
}

export function TaskList({ tasks }: TaskListProps) {
	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader className='flex flex-col gap-2'>
				<div className='flex items-start justify-between gap-3'>
					<div className='flex flex-col gap-1'>
						<h2 className='font-heading text-lg font-medium'>任务列表</h2>
						<p className='text-sm text-muted-foreground'>中间区域默认展开每个任务的文件列表，优先确认信息结构。</p>
					</div>
					<div className='flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
						<FolderClockIcon className='size-5' />
					</div>
				</div>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
					/>
				))}
			</CardContent>
		</Card>
	)
}
