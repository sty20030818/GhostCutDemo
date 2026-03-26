import { ArrowRightIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type CreateTaskButtonProps = {
	onCreateTask?: () => void
	onShowResults?: () => void
	disabled?: boolean
}

export function CreateTaskButton({ onCreateTask, onShowResults, disabled }: CreateTaskButtonProps) {
	return (
		<div className='flex flex-col gap-2 sm:flex-row'>
			<Button
				className='sm:flex-1'
				disabled={disabled}
				onClick={onCreateTask}>
				<UploadIcon data-icon='inline-start' />
				创建任务
			</Button>
			<Button
				variant='outline'
				className='sm:flex-1'
				onClick={onShowResults}>
				查看结果区
				<ArrowRightIcon data-icon='inline-end' />
			</Button>
		</div>
	)
}
