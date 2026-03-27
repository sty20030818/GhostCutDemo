import { Clock4Icon, LanguagesIcon } from 'lucide-react'

import { getLanguageLabel } from '@/constants/language'
import { shortTaskId } from '@/lib/short-id'
import { TaskFileItem } from '@/components/task/task-file-item'
import { TaskStatusBadge } from '@/components/task/task-status-badge'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TranslateTask } from '@/types/task'
import { getTaskDisplayStatus } from '@/lib/task-display-status'

type TaskCardProps = {
	task: TranslateTask
	isSelected?: boolean
	onSelect?: () => void
	onRetryFailedUpload?: () => void
	isActionLoading?: boolean
}

export function TaskCard({
	task,
	isSelected = false,
	onSelect,
	onRetryFailedUpload,
	isActionLoading = false,
}: TaskCardProps) {
	const canRetryFailedUpload = task.files.some((file) => file.status === 'failed' && !file.sourceUrl)

	return (
		<Card
			className={`overflow-visible border-border/80 bg-card/95 transition-all ${isSelected ? 'ring-2 ring-primary/30' : ''}`}
			onClick={onSelect}>
			<CardHeader>
				<div className='flex min-w-0 items-center gap-2'>
					<h3 className='truncate font-heading text-base font-medium'>任务 #{shortTaskId(task.id)}</h3>
				</div>
				<div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
					<span className='inline-flex items-center gap-1'>
						<Clock4Icon className='size-3.5' />
						{task.createdAt}
					</span>
					<span className='inline-flex items-center gap-1'>
						<LanguagesIcon className='size-3.5' />
						{getLanguageLabel(task.sourceLanguage)} → {getLanguageLabel(task.targetLanguage)}
					</span>
				</div>
				<CardAction>
					<TaskStatusBadge
						status={getTaskDisplayStatus(task)}
						size='lg'
					/>
				</CardAction>
			</CardHeader>
			<CardContent className='flex flex-col gap-3'>
				{task.files.map((file) => (
					<TaskFileItem
						key={file.id}
						file={file}
					/>
				))}
				{canRetryFailedUpload ? (
					<div className='flex items-center justify-end gap-2 border-t border-border/70 pt-3'>
						<Button
							type='button'
							size='sm'
							disabled={isActionLoading}
							onClick={(event) => {
								event.stopPropagation()
								onRetryFailedUpload?.()
							}}>
							重试上传
						</Button>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
