import { buildOcrTranslatePayload, createOcrTranslateTasks } from '@/lib/ghostcut'
import { uploadToTos } from '@/lib/tos'
import type { TaskStoreApi } from '@/store/task-store'

type RunTaskBatchInput = {
	store: TaskStoreApi
	taskId: string
	files: File[]
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

type UploadedTaskFile = {
	fileId: string
	name: string
	sourceUrl: string
	tosKey: string
}

export async function runTaskBatch({ store, taskId, files }: RunTaskBatchInput) {
	const uploadedTaskFiles: UploadedTaskFile[] = []
	const taskLanguages = getTaskLanguages(store, taskId)

	if (!taskLanguages) {
		return
	}

	for (const [index, file] of files.entries()) {
		const taskFile = getTaskFileByIndex(store, taskId, index)

		if (!taskFile) {
			continue
		}

		try {
			await store.getState().markFileStatus(taskId, taskFile.id, {
				status: 'uploading',
				progress: 12,
				error: undefined,
				resultLabel: '上传中',
			})

			const uploadResult = await uploadToTos(file)

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

	for (const uploadedTaskFile of uploadedTaskFiles) {
		await store.getState().markFileStatus(taskId, uploadedTaskFile.fileId, {
			status: 'submitting',
			progress: 100,
			resultLabel: '提交任务中',
		})
	}

	try {
		const payload = buildOcrTranslatePayload({
			sourceUrls: uploadedTaskFiles.map((file) => file.sourceUrl),
			names: uploadedTaskFiles.map((file) => file.name),
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
