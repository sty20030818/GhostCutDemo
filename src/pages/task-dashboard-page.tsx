import { BarChart3Icon, SparklesIcon } from 'lucide-react'

import { ResultPanel } from '@/components/result/result-panel'
import { TaskList } from '@/components/task/task-list'
import { UploadPanel } from '@/components/upload/upload-panel'
import { Badge } from '@/components/ui/badge'
import {
	mockResults,
	mockTasks,
	pendingFiles,
	sourceLanguageOptions,
	targetLanguageOptions,
} from '@/pages/task-dashboard.mock'

const overviewItems = [
	{ label: '处理中任务', value: '03' },
	{ label: '已完成结果', value: '02' },
	{ label: '待上传文件', value: '03' },
]

export function TaskDashboardPage() {
	return (
		<div className='min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_transparent_38%),linear-gradient(180deg,_rgba(241,245,249,0.95),_rgba(248,250,252,1))] px-2 py-2 text-foreground sm:px-3 sm:py-3 xl:px-4 xl:py-4'>
			<div className='flex w-full flex-col gap-3'>
				<header className='flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur sm:p-5'>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
						<div className='flex flex-col gap-3'>
							<Badge variant='outline'>
								<SparklesIcon data-icon='inline-start' />
								阶段二 · 页面骨架
							</Badge>
							<div className='flex flex-col gap-2'>
								<h1 className='font-heading text-3xl font-medium tracking-tight sm:text-4xl'>GhostCut 任务工作台</h1>
								<p className='max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base'>
									先把上传入口、任务列表和结果区稳定摆出来，后续阶段只需要把真实数据源逐步替换进来。
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
							<BarChart3Icon className='size-4' />
							<span>当前页面全部由 mock 数据驱动</span>
						</div>
					</div>
					<div className='grid gap-3 sm:grid-cols-3'>
						{overviewItems.map((item) => (
							<div
								key={item.label}
								className='rounded-2xl border border-border/70 bg-card/80 px-4 py-3'>
								<p className='text-xs tracking-[0.2em] text-muted-foreground uppercase'>{item.label}</p>
								<p className='mt-2 font-heading text-2xl font-medium'>{item.value}</p>
							</div>
						))}
					</div>
				</header>

				<div className='grid min-h-[calc(100svh-14rem)] gap-3 lg:grid-cols-2 xl:h-[calc(100svh-12.5rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]'>
					<div className='min-h-0 lg:col-span-2 xl:col-span-1'>
						<UploadPanel
							sourceLanguageOptions={sourceLanguageOptions}
							targetLanguageOptions={targetLanguageOptions}
							pendingFiles={pendingFiles}
						/>
					</div>
					<div className='min-h-0 min-w-0'>
						<TaskList tasks={mockTasks} />
					</div>
					<div className='min-h-0 min-w-0'>
						<ResultPanel results={mockResults} />
					</div>
				</div>
			</div>
		</div>
	)
}
