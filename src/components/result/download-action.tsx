import { DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DownloadAction() {
	return (
		<Button
			size='sm'
			variant='outline'>
			下载占位
			<DownloadIcon data-icon='inline-end' />
		</Button>
	)
}
