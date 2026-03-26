import { FilmIcon, FilesIcon, UploadCloudIcon } from 'lucide-react'

import { CreateTaskButton } from '@/components/upload/create-task-button'
import { SourceLanguageSelector } from '@/components/upload/source-language-selector'
import { TargetLanguageSelector } from '@/components/upload/target-language-selector'
import { TaskOptionForm } from '@/components/upload/task-option-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import type { LanguageOption, PendingUploadFile } from '@/types/task'

type UploadPanelProps = {
	sourceLanguageOptions: LanguageOption[]
	targetLanguageOptions: LanguageOption[]
	pendingFiles: PendingUploadFile[]
}

export function UploadPanel({ sourceLanguageOptions, targetLanguageOptions, pendingFiles }: UploadPanelProps) {
	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader>
				<h2 className='font-heading text-lg font-medium'>创建任务</h2>
				<CardDescription>左侧先承载上传与参数入口，后续阶段再接入真实文件和 API 链路。</CardDescription>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
				<div className='rounded-xl border border-dashed border-border bg-muted/30 p-4'>
					<div className='flex items-start gap-3'>
						<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-foreground ring-1 ring-border'>
							<UploadCloudIcon className='size-5' />
						</div>
						<div className='flex flex-col gap-1'>
							<p className='text-sm font-medium'>上传视频文件</p>
							<p className='text-xs leading-5 text-muted-foreground'>阶段二只展示待上传文件列表，不触发真实上传。</p>
						</div>
					</div>
					<div className='mt-4 flex flex-col gap-2'>
						{pendingFiles.map((file) => (
							<div
								key={file.id}
								className='flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2'>
								<div className='flex min-w-0 items-center gap-2'>
									<FilmIcon className='size-4 shrink-0 text-muted-foreground' />
									<p className='truncate text-sm font-medium'>{file.name}</p>
								</div>
								<p className='shrink-0 text-xs text-muted-foreground'>{file.size}</p>
							</div>
						))}
					</div>
					<div className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
						<FilesIcon className='size-4' />
						<span>支持一次性选择多个视频文件，阶段九再接入完整链路。</span>
					</div>
				</div>

				<SourceLanguageSelector items={sourceLanguageOptions} />
				<TargetLanguageSelector items={targetLanguageOptions} />
				<TaskOptionForm />
				<CreateTaskButton />
			</CardContent>
		</Card>
	)
}
