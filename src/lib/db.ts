import Dexie, { type Table } from 'dexie'

import type { StoredTask } from '@/types/task'

const DATABASE_NAME = 'ghostcut-demo-db'
const TASKS_TABLE = 'tasks'

class GhostCutDatabase extends Dexie {
	tasks!: Table<StoredTask, string>

	constructor() {
		super(DATABASE_NAME)

		this.version(1).stores({
			[TASKS_TABLE]: 'id, status, createdAt, targetLanguage, sourceLanguage',
		})
	}
}

export const ghostCutDb = new GhostCutDatabase()

export async function getAllTasks() {
	return ghostCutDb.tasks.orderBy('createdAt').reverse().toArray()
}

export async function getTaskById(taskId: string) {
	return ghostCutDb.tasks.get(taskId)
}

export async function saveTask(task: StoredTask) {
	await ghostCutDb.tasks.put(task)
}

export async function updateTask(task: StoredTask) {
	await ghostCutDb.tasks.put(task)
}

export async function deleteTask(taskId: string) {
	await ghostCutDb.tasks.delete(taskId)
}

export async function clearTasks() {
	await ghostCutDb.tasks.clear()
}
