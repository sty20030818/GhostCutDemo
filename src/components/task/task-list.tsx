import { FolderClockIcon } from 'lucide-react'

import { TaskCard } from '@/components/task/task-card'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import type { TranslateTask } from '@/types/task'

type TaskListProps = {
	tasks: TranslateTask[]
	selectedTaskId?: string | null
	onSelectTask?: (taskId: string) => void
}

export function TaskList({ tasks, selectedTaskId = null, onSelectTask }: TaskListProps) {
	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader>
				<h2 className='font-heading text-lg font-medium'>任务列表</h2>
				<p className='text-sm text-muted-foreground'>中间区域默认展开每个任务的文件列表，优先确认信息结构。</p>
				<CardAction>
					<div className='flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
						<FolderClockIcon className='size-5' />
					</div>
				</CardAction>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-1'>
				{tasks.length === 0 ? (
					<div className='rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground'>
						还没有任务，点击左侧“创建任务”先生成一个本地演示任务。
					</div>
				) : null}
				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
						isSelected={selectedTaskId === task.id}
						onSelect={() => onSelectTask?.(task.id)}
					/>
				))}
			</CardContent>
		</Card>
	)
}
