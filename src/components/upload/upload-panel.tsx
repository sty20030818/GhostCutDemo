import type { ChangeEvent } from 'react'
import { FilmIcon, FilesIcon, PlusCircleIcon, UploadCloudIcon, XIcon } from 'lucide-react'

import { CreateTaskButton } from '@/components/upload/create-task-button'
import { SourceLanguageSelector } from '@/components/upload/source-language-selector'
import { TargetLanguageSelector } from '@/components/upload/target-language-selector'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LanguageOption, PendingUploadFile } from '@/types/task'

type UploadPanelProps = {
	sourceLanguageOptions: LanguageOption[]
	targetLanguageOptions: LanguageOption[]
	sourceLanguage?: string
	targetLanguage?: string
	onSourceLanguageChange?: (value: string) => void
	onTargetLanguageChange?: (value: string) => void
	pendingFiles: PendingUploadFile[]
	onFilesChange?: (files: File[]) => void
	onRemoveFile?: (index: number) => void
	onCreateTask?: () => void
	isCreating?: boolean
}

export function UploadPanel({
	sourceLanguageOptions,
	targetLanguageOptions,
	sourceLanguage,
	targetLanguage,
	onSourceLanguageChange,
	onTargetLanguageChange,
	pendingFiles,
	onFilesChange,
	onRemoveFile,
	onCreateTask,
	isCreating,
}: UploadPanelProps) {
	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		onFilesChange?.(Array.from(event.target.files ?? []))
		event.target.value = ''
	}

	return (
		<Card className='h-full overflow-hidden border-border/80 bg-card/90 backdrop-blur'>
			<CardHeader>
				<h2 className='font-heading text-lg font-medium'>创建任务</h2>
				<CardDescription>左侧负责收集本地视频与语言配置，创建后会直接走上传、批量提交和轮询链路。</CardDescription>
				<CardAction>
					<div className='flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground'>
						<PlusCircleIcon className='size-5' />
					</div>
				</CardAction>
			</CardHeader>
			<CardContent className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto'>
				<div className='rounded-xl border border-dashed border-border bg-muted/30 p-4'>
					<div className='flex items-start gap-3'>
						<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-foreground ring-1 ring-border'>
							<UploadCloudIcon className='size-5' />
						</div>
						<div className='flex flex-col gap-1'>
							<p className='text-sm font-medium'>上传视频文件</p>
						<p className='text-xs leading-5 text-muted-foreground'>选择本地视频后，创建任务会按当前顺序上传文件并提交到 GhostCut 批量任务。</p>
						</div>
					</div>
					<div className='mt-4'>
						<label
							htmlFor='video-upload-input'
							className={cn(buttonVariants({ variant: 'outline' }), 'flex w-full cursor-pointer')}>
							<span className='sr-only'>选择本地视频文件</span>
							<UploadCloudIcon className='size-4' />
							选择本地视频文件
						</label>
						<input
							id='video-upload-input'
							type='file'
							accept='video/*'
							multiple
							className='sr-only'
							aria-label='选择本地视频文件'
							onChange={handleFileChange}
						/>
					</div>
					<div className='mt-4 flex flex-col gap-2'>
						{pendingFiles.length > 0
							? pendingFiles.map((file, index) => (
								<div
									key={file.id}
									className='flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2'>
									<div className='flex min-w-0 items-center gap-2'>
										<FilmIcon className='size-4 shrink-0 text-muted-foreground' />
										<p className='truncate text-sm font-medium'>{file.name}</p>
									</div>
								<div className='flex shrink-0 items-center gap-2'>
									<p className='text-xs text-muted-foreground'>
										{file.duration ? `${file.duration} · ` : ''}{file.size}
									</p>
										<button
											type='button'
											aria-label={`移除 ${file.name}`}
											className='flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
											onClick={() => onRemoveFile?.(index)}
										>
											<XIcon className='size-3.5' />
										</button>
									</div>
								</div>
							))
							: (
									<div className='rounded-lg border border-border/70 bg-background/70 px-3 py-4 text-center text-sm text-muted-foreground'>
										暂未选择本地视频文件
									</div>
								)}
					</div>
					<div className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
						<FilesIcon className='size-4' />
						<span>支持一次性选择多个视频文件，上传完成后会统一提交并由全局轮询器持续跟踪结果。</span>
					</div>
				</div>

				<SourceLanguageSelector items={sourceLanguageOptions} value={sourceLanguage} onValueChange={onSourceLanguageChange} />
				<TargetLanguageSelector items={targetLanguageOptions} value={targetLanguage} onValueChange={onTargetLanguageChange} />
				<CreateTaskButton
					disabled={pendingFiles.length === 0}
					isCreating={isCreating}
					onCreateTask={onCreateTask}
				/>
			</CardContent>
		</Card>
	)
}
