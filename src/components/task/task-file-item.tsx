import { FileVideo2Icon } from 'lucide-react'

import { TaskStatusBadge } from '@/components/task/task-status-badge'
import type { TaskFile } from '@/types/task'

type TaskFileItemProps = {
	file: TaskFile
}

export function TaskFileItem({ file }: TaskFileItemProps) {
	return (
		<div className='flex flex-col gap-3 rounded-xl border border-border/70 bg-background/90 p-3'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex min-w-0 items-start gap-3'>
					<div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
						<FileVideo2Icon className='size-4' />
					</div>
					<div className='flex min-w-0 flex-col gap-1'>
						<p className='truncate text-sm font-medium'>{file.name}</p>
						<p className='text-xs text-muted-foreground'>
							{file.duration} · {file.size}
						</p>
					</div>
				</div>
				<TaskStatusBadge status={file.status} />
			</div>

			<div className='flex flex-col gap-2'>
				<div className='h-2 overflow-hidden rounded-full bg-muted'>
					<div
						className='h-full rounded-full bg-primary transition-all'
						style={{ width: `${file.progress}%` }}
					/>
				</div>
				<div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
					<span>{file.resultLabel ?? '等待执行下一阶段能力接入'}</span>
					<span>{file.progress}%</span>
				</div>
			</div>

			{file.error ? <p className='text-xs leading-5 text-destructive'>{file.error}</p> : null}
		</div>
	)
}
