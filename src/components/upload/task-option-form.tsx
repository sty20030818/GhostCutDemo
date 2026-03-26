import { SparklesIcon, SubtitlesIcon, WandSparklesIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const taskOptions = [
	{
		title: '字幕翻译',
		description: '默认开启，作为主链路演示能力。',
		icon: SubtitlesIcon,
	},
	{
		title: '术语润色',
		description: '先做静态占位，后续阶段再接业务参数。',
		icon: WandSparklesIcon,
	},
	{
		title: '成片导出',
		description: '右侧结果区会展示未来生成的下载项。',
		icon: SparklesIcon,
	},
]

export function TaskOptionForm() {
	return (
		<div className='flex flex-col gap-3 rounded-xl border border-dashed border-border/80 bg-muted/30 p-3'>
			<div className='flex items-center justify-between gap-3'>
				<div className='flex flex-col gap-1'>
					<p className='text-sm font-medium'>任务选项</p>
					<p className='text-xs text-muted-foreground'>当前仍保留轻量选项结构，后续阶段再继续接更细的 4.1.1.4 业务参数。</p>
				</div>
				<Badge variant='outline'>阶段九</Badge>
			</div>
			<div className='flex flex-col gap-2'>
				{taskOptions.map((option) => {
					const Icon = option.icon

					return (
						<div
							key={option.title}
							className='flex items-start gap-3 rounded-lg border border-border/70 bg-background/80 p-3'>
							<div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
								<Icon className='size-4' />
							</div>
							<div className='flex flex-col gap-1'>
								<p className='text-sm font-medium'>{option.title}</p>
								<p className='text-xs leading-5 text-muted-foreground'>{option.description}</p>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
