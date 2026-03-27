import { LoaderCircleIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type CreateTaskButtonProps = {
	onCreateTask?: () => void
	disabled?: boolean
	isCreating?: boolean
}

export function CreateTaskButton({ onCreateTask, disabled, isCreating }: CreateTaskButtonProps) {
	return (
		<Button
			className='w-full'
			disabled={disabled || isCreating}
			onClick={onCreateTask}>
			{isCreating
				? <LoaderCircleIcon data-icon='inline-start' className='animate-spin' />
				: <UploadIcon data-icon='inline-start' />}
			{isCreating ? '上传中...' : '创建任务'}
		</Button>
	)
}
