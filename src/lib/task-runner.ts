import { buildOcrTranslatePayload, createOcrTranslateTasks } from '@/lib/ghostcut'
import { uploadToTos } from '@/lib/tos'
import { getLanguageLabel } from '@/constants/language'
import type { TaskStoreApi } from '@/store/task-store'

type RunTaskBatchInput = {
	store: TaskStoreApi
	taskId: string
	files: File[]
	autoSubmit?: boolean
}

function getTaskFileByIndex(store: TaskStoreApi, taskId: string, index: number) {
	return store.getState().tasks.find((task) => task.id === taskId)?.files[index]
}

function getTaskLanguages(store: TaskStoreApi, taskId: string) {
	const task = store.getState().tasks.find((item) => item.id === taskId)
	if (!task) {
		return null
	}

	return {
		sourceLanguage: task.sourceLanguage,
		targetLanguage: task.targetLanguage,
	}
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : '任务执行失败，请稍后重试'
}

function stripFileExtension(fileName: string) {
	// 只去掉最后一个扩展名段，例如 `a.b.mp4` -> `a.b`
	return fileName.replace(/\.[^/.]+$/, '')
}

type UploadedTaskFile = {
	fileId: string
	name: string
	sourceUrl: string
	tosKey: string
}

async function submitUploadedTaskFiles(store: TaskStoreApi, taskId: string, uploadedTaskFiles: UploadedTaskFile[]) {
	const taskLanguages = getTaskLanguages(store, taskId)
	if (!taskLanguages) {
		return
	}

	for (const uploadedTaskFile of uploadedTaskFiles) {
		await store.getState().markFileStatus(taskId, uploadedTaskFile.fileId, {
			status: 'submitting',
			progress: 100,
			resultLabel: '提交任务中',
		})
	}

	try {
		const targetLangLabel = getLanguageLabel(taskLanguages.targetLanguage)
		const payload = buildOcrTranslatePayload({
			sourceUrls: uploadedTaskFiles.map((file) => file.sourceUrl),
			// GhostCut 支持用 `names` 自定义作品名：`原名-语言名(中文)`，且不包含扩展名
			names: uploadedTaskFiles.map((file) => `${stripFileExtension(file.name)}-${targetLangLabel}`),
			sourceLang: taskLanguages.sourceLanguage,
			targetLang: taskLanguages.targetLanguage,
		})
		const ghostcutTaskBatch = await createOcrTranslateTasks(payload)

		for (const [index, uploadedTaskFile] of uploadedTaskFiles.entries()) {
			const matchedTask =
				ghostcutTaskBatch.items.find((item) => item.url === uploadedTaskFile.sourceUrl) ?? ghostcutTaskBatch.items[index]

			if (!matchedTask) {
				await store.getState().markFileStatus(taskId, uploadedTaskFile.fileId, {
					status: 'failed',
					progress: 100,
					error: 'GhostCut 批量创建成功，但响应中缺少作品 ID',
					resultLabel: '处理失败',
				})
				continue
			}

			await store.getState().markFileStatus(taskId, uploadedTaskFile.fileId, {
				status: 'processing',
				progress: 100,
				idProject: ghostcutTaskBatch.idProject,
				ghostcutTaskId: matchedTask.id,
				resultLabel: '任务处理中',
			})
		}
	}
	catch (error) {
		for (const uploadedTaskFile of uploadedTaskFiles) {
			await store.getState().markFileStatus(taskId, uploadedTaskFile.fileId, {
				status: 'failed',
				progress: 100,
				error: getErrorMessage(error),
				resultLabel: '处理失败',
			})
		}
	}
}

export async function submitUploadedFilesForTask({ store, taskId }: Pick<RunTaskBatchInput, 'store' | 'taskId'>) {
	const task = store.getState().tasks.find((item) => item.id === taskId)
	if (!task) {
		return
	}

	const uploadedTaskFiles = task.files
		.filter((file) => file.status === 'uploaded' && file.sourceUrl && file.tosKey)
		.map((file) => ({
			fileId: file.id,
			name: file.name,
			sourceUrl: file.sourceUrl as string,
			tosKey: file.tosKey as string,
		}))

	if (uploadedTaskFiles.length === 0) {
		return
	}

	await submitUploadedTaskFiles(store, taskId, uploadedTaskFiles)
}

export async function retryFailedUploadsForTask({ store, taskId, files }: RunTaskBatchInput) {
	const uploadedTaskFiles: UploadedTaskFile[] = []
	const progressState = new Map<string, { percent: number; timestamp: number }>()

	for (const [index, file] of files.entries()) {
		const taskFile = getTaskFileByIndex(store, taskId, index)
		if (!taskFile) {
			continue
		}

		// 仅重试“上传阶段失败”的文件；已经有 sourceUrl 的失败通常是后续处理失败。
		if (taskFile.status !== 'failed' || taskFile.sourceUrl) {
			continue
		}

		try {
			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'uploading',
				progress: 0,
				error: undefined,
				resultLabel: '上传重试中 0%',
			})

			const uploadResult = await uploadToTos(file, {
				onProgress: (percent) => {
					const nextPercent = Math.max(0, Math.min(99, Math.round(percent * 100)))
					const prev = progressState.get(taskFile.id)
					const now = Date.now()
					const shouldSkip = !!prev && nextPercent <= prev.percent && now - prev.timestamp < 400
					if (shouldSkip) return

					progressState.set(taskFile.id, {
						percent: nextPercent,
						timestamp: now,
					})

					void store.getState().markFileStatus(taskId, taskFile.id, {
						status: 'uploading',
						progress: nextPercent,
						resultLabel: `上传重试中 ${nextPercent}%`,
					})
				},
			})

			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'uploaded',
				progress: 100,
				sourceUrl: uploadResult.url,
				tosKey: uploadResult.key,
				error: undefined,
				resultLabel: '上传完成',
			})

			uploadedTaskFiles.push({
				fileId: taskFile.id,
				name: file.name,
				sourceUrl: uploadResult.url,
				tosKey: uploadResult.key,
			})
		}
		catch (error) {
			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'failed',
				progress: 100,
				error: getErrorMessage(error),
				resultLabel: '上传失败',
			})
		}
	}

	if (uploadedTaskFiles.length === 0) {
		return
	}

	await submitUploadedTaskFiles(store, taskId, uploadedTaskFiles)
}

export async function runTaskBatch({ store, taskId, files, autoSubmit = true }: RunTaskBatchInput) {
	const uploadedTaskFiles: UploadedTaskFile[] = []
	const progressState = new Map<string, { percent: number; timestamp: number }>()

	for (const [index, file] of files.entries()) {
		const taskFile = getTaskFileByIndex(store, taskId, index)

		if (!taskFile) {
			continue
		}

		try {
			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'uploading',
				progress: 0,
				error: undefined,
				resultLabel: '上传中 0%',
			})

			const uploadResult = await uploadToTos(file, {
				onProgress: (percent) => {
					const nextPercent = Math.max(0, Math.min(99, Math.round(percent * 100)))
					const prev = progressState.get(taskFile.id)
					const now = Date.now()
					const shouldSkip = !!prev && nextPercent <= prev.percent && now - prev.timestamp < 400

					if (shouldSkip) {
						return
					}

					progressState.set(taskFile.id, {
						percent: nextPercent,
						timestamp: now,
					})

					void store.getState().markFileStatus(taskId, taskFile.id, {
						status: 'uploading',
						progress: nextPercent,
						resultLabel: `上传中 ${nextPercent}%`,
					})
				},
			})

			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'uploaded',
				progress: 100,
				sourceUrl: uploadResult.url,
				tosKey: uploadResult.key,
				error: undefined,
				resultLabel: '上传完成',
			})
			uploadedTaskFiles.push({
				fileId: taskFile.id,
				name: file.name,
				sourceUrl: uploadResult.url,
				tosKey: uploadResult.key,
			})
		}
		catch (error) {
			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'failed',
				progress: 100,
				error: getErrorMessage(error),
				resultLabel: '处理失败',
			})
		}
	}

	if (uploadedTaskFiles.length === 0) {
		return
	}

	if (!autoSubmit) {
		return
	}

	await submitUploadedTaskFiles(store, taskId, uploadedTaskFiles)
}
