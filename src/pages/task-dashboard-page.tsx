import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3Icon, DatabaseIcon, SparklesIcon } from 'lucide-react'

import { useTaskPolling } from '@/hooks/use-task-polling'
import { runTaskBatch } from '@/lib/task-runner'
import { ResultPanel } from '@/components/result/result-panel'
import { TaskList } from '@/components/task/task-list'
import { UploadPanel } from '@/components/upload/upload-panel'
import { Badge } from '@/components/ui/badge'
import { mockTasks, sourceLanguageOptions, targetLanguageOptions } from '@/pages/task-dashboard.mock'
import { taskStore, useTaskStore } from '@/store/task-store'
import type { PendingUploadFile, TranslateTask } from '@/types/task'

function formatFileSize(size: number) {
	if (size >= 1024 * 1024 * 1024) {
		return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
	}

	if (size >= 1024 * 1024) {
		return `${(size / 1024 / 1024).toFixed(1)} MB`
	}

	if (size >= 1024) {
		return `${Math.round(size / 1024)} KB`
	}

	return `${size} B`
}

function buildPendingUploadFiles(files: File[]): PendingUploadFile[] {
	return files.map((file, index) => ({
		id: `${file.name}-${index}-${file.size}`,
		name: file.name,
		size: formatFileSize(file.size),
	}))
}

function hasPollingCandidates(tasks: TranslateTask[]) {
	return tasks.some((task) => task.files.some((file) => file.status === 'processing' && file.ghostcutTaskId))
}

export function TaskDashboardPage() {
	const resultPanelRef = useRef<HTMLDivElement | null>(null)
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const { start: startPolling } = useTaskPolling()
	const tasks = useTaskStore((state) => state.tasks)
	const selectedTaskId = useTaskStore((state) => state.selectedTaskId)
	const isPolling = useTaskStore((state) => state.isPolling)
	const loadTasksFromDB = useTaskStore((state) => state.loadTasksFromDB)
	const bootstrapDemoTasks = useTaskStore((state) => state.bootstrapDemoTasks)
	const createLocalTask = useTaskStore((state) => state.createLocalTask)
	const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId)

	useEffect(() => {
		let active = true

		void (async () => {
			const storedTasks = await loadTasksFromDB()
			const nextTasks
				= active && storedTasks.length === 0
					? await bootstrapDemoTasks(mockTasks)
					: storedTasks

			if (active && hasPollingCandidates(nextTasks)) {
				startPolling()
			}
		})()

		return () => {
			active = false
		}
	}, [bootstrapDemoTasks, loadTasksFromDB, startPolling])

	const completedResultsCount = useMemo(
		() => tasks.flatMap((task) => task.files).filter((file) => file.status === 'completed').length,
		[tasks],
	)
	const pendingFiles = useMemo(() => buildPendingUploadFiles(selectedFiles), [selectedFiles])
	const overviewItems = useMemo(
		() => [
			{
				label: '处理中任务',
				value: String(tasks.filter((task) => task.status === 'queued' || task.status === 'processing').length).padStart(
					2,
					'0',
				),
			},
			{
				label: '已完成结果',
				value: String(completedResultsCount).padStart(2, '0'),
			},
			{
				label: '待上传文件',
				value: String(tasks.flatMap((task) => task.files).filter((file) => file.status === 'pending').length).padStart(
					2,
					'0',
				),
			},
		],
		[completedResultsCount, tasks],
	)

	async function handleCreateTask() {
		if (selectedFiles.length === 0) {
			return
		}

		const task = await createLocalTask({
			taskName: '新的本地任务',
			sourceLanguage: sourceLanguageOptions[2]?.value ?? 'zh',
			targetLanguage: targetLanguageOptions[2]?.value ?? 'en',
			files: pendingFiles,
		})

		await runTaskBatch({
			store: taskStore,
			taskId: task.id,
			files: selectedFiles,
		})
		startPolling()
		setSelectedFiles([])
	}

	function handleShowResults() {
		resultPanelRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}

	return (
		<div className='h-svh overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),transparent_38%),linear-gradient(180deg,rgba(241,245,249,0.95),rgba(248,250,252,1))] px-2 py-2 text-foreground sm:px-3 sm:py-3 xl:px-4 xl:py-4'>
			<div className='flex h-full w-full flex-col gap-3'>
				<header className='flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur sm:p-5'>
					<div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
						<div className='flex flex-col gap-3'>
							<Badge variant='outline'>
								<SparklesIcon data-icon='inline-start' />
								阶段九 · 完整链路联调
							</Badge>
							<div className='flex flex-col gap-2'>
								<h1 className='font-heading text-3xl font-medium tracking-tight sm:text-4xl'>GhostCut 任务工作台</h1>
								<p className='max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base'>
									页面现在已经把上传、批量提交、统一轮询和结果分组展示串成完整链路，刷新后也能继续恢复处理中任务。
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
							{isPolling ? <BarChart3Icon className='size-4' /> : <DatabaseIcon className='size-4' />}
							<span>{isPolling ? '统一轮询运行中' : '当前页面由 store + 调度器 + 轮询器驱动'}</span>
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

				<div className='grid min-h-0 flex-1 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]'>
					<div className='min-h-0 lg:col-span-2 xl:col-span-1'>
						<UploadPanel
							sourceLanguageOptions={sourceLanguageOptions}
							targetLanguageOptions={targetLanguageOptions}
							pendingFiles={pendingFiles}
							onFilesChange={setSelectedFiles}
							onCreateTask={handleCreateTask}
							onShowResults={handleShowResults}
						/>
					</div>
					<div className='min-h-0 min-w-0'>
						<TaskList
							tasks={tasks}
							selectedTaskId={selectedTaskId}
							onSelectTask={setSelectedTaskId}
						/>
					</div>
					<div
						ref={resultPanelRef}
						className='min-h-0 min-w-0'>
						<ResultPanel tasks={tasks} />
					</div>
				</div>
			</div>
		</div>
	)
}
