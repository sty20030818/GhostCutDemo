import { CheckCircle2Icon, FileArchiveIcon } from 'lucide-react'

import { DownloadAction } from '@/components/result/download-action'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { TaskResult } from '@/types/task'

type ResultCardProps = {
	result: TaskResult
}

type ResultActionItem = {
	key: string
	label: string
	href: string
	download?: boolean
	variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
}

export function ResultCard({ result }: ResultCardProps) {
	const actionItems: ResultActionItem[] = []

	if (result.downloadUrl) {
		actionItems.push({
			key: 'result',
			label: '下载成片',
			href: result.downloadUrl,
			download: true,
			variant: 'default',
		})
	}

	if (result.sourceVideoUrl) {
		actionItems.push({
			key: 'source-video',
			label: '查看原视频',
			href: result.sourceVideoUrl,
		})
	}

	if (result.srcSrtUrl) {
		actionItems.push({
			key: 'source-srt',
			label: '下载源字幕',
			href: result.srcSrtUrl,
			download: true,
		})
	}

	if (result.tgtSrtUrl) {
		actionItems.push({
			key: 'target-srt',
			label: '下载目标字幕',
			href: result.tgtSrtUrl,
			download: true,
		})
	}

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
							<p className='text-xs text-muted-foreground'>文件结果项</p>
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
					<div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/40 p-3'>
						<span>完成时间</span>
						<span className='text-sm font-medium text-foreground'>{result.finishedAt}</span>
					</div>
					<div className='flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/40 p-3'>
						<span>任务编号</span>
						<span className='truncate text-sm font-medium text-foreground'>{result.ocrTranslateTaskId ?? '未返回'}</span>
					</div>
				</div>

				{actionItems.length > 0 ? (
					<div className='flex flex-wrap gap-2'>
						{actionItems.map((action) => (
							<DownloadAction
								key={action.key}
								label={action.label}
								href={action.href}
								download={action.download}
								variant={action.variant}
							/>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}
