import { DownloadCloudIcon } from 'lucide-react'

import { ResultCard } from '@/components/result/result-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { DashboardResult } from '@/pages/task-dashboard.mock'

type ResultPanelProps = {
	results: DashboardResult[]
}

export function ResultPanel({ results }: ResultPanelProps) {
	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader className='flex flex-col gap-2'>
				<div className='flex items-start justify-between gap-3'>
					<div className='flex flex-col gap-1'>
						<h2 className='font-heading text-lg font-medium'>结果区</h2>
						<p className='text-sm text-muted-foreground'>右侧先平铺展示已完成文件，后续再与真实任务结果联动。</p>
					</div>
					<div className='flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
						<DownloadCloudIcon className='size-5' />
					</div>
				</div>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
				{results.map((result) => (
					<ResultCard
						key={result.id}
						result={result}
					/>
				))}
			</CardContent>
		</Card>
	)
}
