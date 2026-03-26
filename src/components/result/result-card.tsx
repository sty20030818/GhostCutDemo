import { CheckCircle2Icon, FileArchiveIcon } from 'lucide-react'

import { DownloadAction } from '@/components/result/download-action'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { TaskResult } from '@/types/task'

type ResultCardProps = {
	result: TaskResult
}

export function ResultCard({ result }: ResultCardProps) {
	return (
		<Card className='border-border/80 bg-card/95'>
			<CardContent className='flex flex-col gap-4 pt-4'>
				<div className='flex items-start justify-between gap-3'>
					<div className='flex min-w-0 items-start gap-3'>
						<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
							<FileArchiveIcon className='size-4' />
						</div>
						<div className='flex min-w-0 flex-col gap-1'>
							<p className='truncate text-sm font-medium'>{result.fileName}</p>
							<p className='text-xs text-muted-foreground'>{result.taskName}</p>
						</div>
					</div>
					<Badge>
						<CheckCircle2Icon data-icon='inline-start' />
						已完成
					</Badge>
				</div>

				<div className='grid grid-cols-2 gap-3 text-xs text-muted-foreground'>
					<div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/40 p-3'>
						<span>目标语言</span>
						<span className='text-sm font-medium text-foreground'>{result.targetLanguage}</span>
					</div>
					<div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/40 p-3'>
						<span>输出格式</span>
						<span className='text-sm font-medium text-foreground'>{result.format}</span>
					</div>
				</div>

				<div className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
					<span>{result.finishedAt}</span>
					<DownloadAction />
				</div>
			</CardContent>
		</Card>
	)
}
