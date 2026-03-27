import { ArrowRightIcon, LoaderCircleIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type CreateTaskButtonProps = {
	onCreateTask?: () => void
	onShowResults?: () => void
	disabled?: boolean
	isCreating?: boolean
}

export function CreateTaskButton({ onCreateTask, onShowResults, disabled, isCreating }: CreateTaskButtonProps) {
	return (
		<div className='flex flex-col gap-2 sm:flex-row'>
			<Button
				className='sm:flex-1'
				disabled={disabled || isCreating}
				onClick={onCreateTask}>
				{isCreating
					? <LoaderCircleIcon data-icon='inline-start' className='animate-spin' />
					: <UploadIcon data-icon='inline-start' />}
				{isCreating ? '上传中...' : '创建任务'}
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
