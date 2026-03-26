import { DownloadCloudIcon } from 'lucide-react'

import { getLanguageLabel } from '@/constants/language'
import { shortTaskId } from '@/lib/short-id'
import { ResultCard } from '@/components/result/result-card'
import { TaskStatusBadge } from '@/components/task/task-status-badge'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import type { TaskFileStatus, TaskResultGroup, TranslateTask } from '@/types/task'
import { getTaskDisplayStatus } from '@/lib/task-display-status'

type ResultPanelProps = {
	tasks: TranslateTask[]
}

function countFilesByStatus(tasks: TranslateTask[], statuses: TaskFileStatus[]) {
	return tasks.flatMap((task) => task.files).filter((file) => statuses.includes(file.status)).length
}

function buildResultGroups(tasks: TranslateTask[]): TaskResultGroup[] {
	return tasks
		.map((task) => {
			const completedFiles = task.files.filter((file) => file.status === 'completed')

			return {
				id: task.id,
				taskName: task.name,
				createdAt: task.createdAt,
				sourceLanguage: task.sourceLanguage,
				targetLanguage: task.targetLanguage,
				status: getTaskDisplayStatus(task),
				totalCount: task.files.length,
				completedCount: completedFiles.length,
				failedCount: task.files.filter((file) => file.status === 'failed').length,
				processingCount: countFilesByStatus([task], ['uploading', 'uploaded', 'submitting', 'processing']),
				results: completedFiles.map((file) => ({
					id: `${task.id}-${file.id}`,
					taskId: task.id,
					taskName: task.name,
					fileId: file.id,
					fileName: file.name,
					sourceLanguage: task.sourceLanguage,
					targetLanguage: task.targetLanguage,
					finishedAt: task.createdAt,
					format: 'MP4 / 内嵌字幕',
					downloadUrl: file.resultUrl,
					sourceVideoUrl: file.sourceVideoUrl,
					srcSrtUrl: file.srcSrtUrl,
					tgtSrtUrl: file.tgtSrtUrl,
					ocrTranslateTaskId: file.ocrTranslateTaskId,
				})),
			}
		})
		.filter((group) => group.completedCount > 0)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function ResultPanel({ tasks }: ResultPanelProps) {
	const resultGroups = buildResultGroups(tasks)

	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader>
				<h2 className='font-heading text-lg font-medium'>结果区</h2>
				<p className='text-sm text-muted-foreground'>右侧按任务分组汇总所有已完成结果，支持直接下载成片、原视频和字幕文件。</p>
				<CardAction>
					<div className='flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
						<DownloadCloudIcon className='size-5' />
					</div>
				</CardAction>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
				{resultGroups.length === 0 ? (
					<div className='rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-sm text-muted-foreground'>
						任务完成后，这里会按任务分组展示可下载结果。
					</div>
				) : null}
				{resultGroups.map((group) => (
					<div
						key={group.id}
						className='flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/40 p-3'
					>
						<div className='flex flex-col gap-3 rounded-xl border border-border/70 bg-card/95 p-3'>
							<div className='flex items-start justify-between gap-3'>
								<div className='flex min-w-0 flex-col gap-1'>
									<h3 className='truncate text-sm font-medium'>任务 #{shortTaskId(group.id)}</h3>
									<p className='text-xs text-muted-foreground'>
										{getLanguageLabel(group.sourceLanguage)} → {getLanguageLabel(group.targetLanguage)}
									</p>
								</div>
								<TaskStatusBadge status={group.status} />
							</div>
							<div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground xl:grid-cols-4'>
								<div className='rounded-lg border border-border/70 bg-muted/40 px-3 py-2'>
									<span>{group.completedCount} / {group.totalCount} 已完成</span>
								</div>
								<div className='rounded-lg border border-border/70 bg-muted/40 px-3 py-2'>
									<span>{group.processingCount} 个进行中</span>
								</div>
								<div className='rounded-lg border border-border/70 bg-muted/40 px-3 py-2'>
									<span>{group.failedCount} 个失败</span>
								</div>
								<div className='rounded-lg border border-border/70 bg-muted/40 px-3 py-2'>
									<span>{group.createdAt}</span>
								</div>
							</div>
						</div>
						{group.results.map((result) => (
							<ResultCard
								key={result.id}
								result={result}
							/>
						))}
					</div>
				))}
			</CardContent>
		</Card>
	)
}
