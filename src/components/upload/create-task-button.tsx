import { ArrowRightIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CreateTaskButton() {
	return (
		<div className='flex flex-col gap-2 sm:flex-row'>
			<Button className='sm:flex-1'>
				<UploadIcon data-icon='inline-start' />
				创建任务
			</Button>
			<Button
				variant='outline'
				className='sm:flex-1'>
				查看结果区
				<ArrowRightIcon data-icon='inline-end' />
			</Button>
		</div>
	)
}
