import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTaskPolling } from '@/hooks/use-task-polling'
import { formatDuration, probeVideoDuration } from '@/lib/probe-duration'
import { runTaskBatch } from '@/lib/task-runner'
import { ResultPanel } from '@/components/result/result-panel'
import { TaskList } from '@/components/task/task-list'
import { UploadPanel } from '@/components/upload/upload-panel'
import { sourceLanguageOptions, targetLanguageOptions } from '@/constants/language'
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

function buildPendingUploadFiles(files: File[], durationMap: Map<File, string>): PendingUploadFile[] {
	return files.map((file, index) => ({
		id: `${file.name}-${index}-${file.size}`,
		name: file.name,
		size: formatFileSize(file.size),
		duration: durationMap.get(file),
	}))
}

function hasPollingCandidates(tasks: TranslateTask[]) {
	return tasks.some((task) => task.files.some((file) => file.status === 'processing' && file.ghostcutTaskId))
}

export function TaskDashboardPage() {
	const resultPanelRef = useRef<HTMLDivElement | null>(null)
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const [durationMap, setDurationMap] = useState<Map<File, string>>(() => new Map())
	const [sourceLanguage, setSourceLanguage] = useState('auto')
	const [targetLanguage, setTargetLanguage] = useState('en')
	const { start: startPolling } = useTaskPolling()
	const tasks = useTaskStore((state) => state.tasks)
	const selectedTaskId = useTaskStore((state) => state.selectedTaskId)
	const loadTasksFromDB = useTaskStore((state) => state.loadTasksFromDB)
	const createLocalTask = useTaskStore((state) => state.createLocalTask)
	const setSelectedTaskId = useTaskStore((state) => state.setSelectedTaskId)

	useEffect(() => {
		let active = true

		void (async () => {
			const storedTasks = await loadTasksFromDB()

			if (active && hasPollingCandidates(storedTasks)) {
				startPolling()
			}
		})()

		return () => {
			active = false
		}
	}, [loadTasksFromDB, startPolling])

	const completedResultsCount = useMemo(
		() => tasks.flatMap((task) => task.files).filter((file) => file.status === 'completed').length,
		[tasks],
	)
	const pendingFiles = useMemo(() => buildPendingUploadFiles(selectedFiles, durationMap), [selectedFiles, durationMap])

	/** 异步探测新文件的时长，探测完逐个写入 durationMap */
	const probeNewFiles = useCallback((files: File[]) => {
		for (const file of files) {
			if (durationMap.has(file)) continue
			void probeVideoDuration(file)
				.then((seconds) => {
					setDurationMap((prev) => {
						const next = new Map(prev)
						next.set(file, formatDuration(seconds))
						return next
					})
				})
				.catch(() => {
					// 探测失败保持 --:--
				})
		}
	}, [durationMap])
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
			sourceLanguage,
			targetLanguage,
			files: pendingFiles,
		})

		await runTaskBatch({
			store: taskStore,
			taskId: task.id,
			files: selectedFiles,
		})
		startPolling()
		setSelectedFiles([])
		setDurationMap(new Map())
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
				<header className='flex items-center justify-between gap-4 rounded-[1.75rem] border border-border/70 bg-background/85 px-4 py-3 shadow-sm backdrop-blur sm:px-5'>
					<div className='flex flex-col gap-1'>
						<h1 className='font-heading text-xl font-medium tracking-tight sm:text-2xl'>GhostCut 任务工作台</h1>
						<p className='max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm'>
							上传、批量提交、统一轮询和结果分组展示已串成完整链路。
						</p>
					</div>
					<div className='flex shrink-0 items-center gap-3'>
						{overviewItems.map((item) => (
							<div
								key={item.label}
								className='rounded-2xl border border-border/70 bg-card/80 px-5 py-3 text-center'>
								<p className='text-xs tracking-[0.15em] text-muted-foreground uppercase'>{item.label}</p>
								<p className='mt-1 font-heading text-2xl font-medium'>{item.value}</p>
							</div>
						))}
					</div>
				</header>

				<div className='grid min-h-0 flex-1 gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]'>
					<div className='min-h-0 lg:col-span-2 xl:col-span-1'>
						<UploadPanel
							sourceLanguageOptions={sourceLanguageOptions}
							targetLanguageOptions={targetLanguageOptions}
							sourceLanguage={sourceLanguage}
							targetLanguage={targetLanguage}
							onSourceLanguageChange={setSourceLanguage}
							onTargetLanguageChange={setTargetLanguage}
							pendingFiles={pendingFiles}
						onFilesChange={(newFiles) => {
							probeNewFiles(newFiles)
							setSelectedFiles((prev) => [...prev, ...newFiles])
						}}
						onRemoveFile={(index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
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
