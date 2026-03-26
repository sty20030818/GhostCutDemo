import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { clearTasks } from '@/lib/db'
import { taskStore } from '@/store/task-store'

describe('TaskDashboardPage', () => {
	beforeEach(() => {
		taskStore.setState({
			tasks: [],
			selectedTaskId: null,
			isPolling: false,
		})
	})

	afterEach(async () => {
		taskStore.setState({
			tasks: [],
			selectedTaskId: null,
			isPolling: false,
		})
		await clearTasks()
	})

	it('渲染三栏工作台的核心区块', () => {
		render(<App />)

		expect(screen.getByRole('heading', { name: '创建任务' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '任务列表' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '结果区' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '创建任务' })).toBeInTheDocument()
	})

	it('点击创建任务后会把新的本地任务渲染到列表中', async () => {
		render(<App />)

		fireEvent.click(screen.getByRole('button', { name: '创建任务' }))

		await waitFor(() => {
			expect(screen.getByText('新的本地任务')).toBeInTheDocument()
		})
	})
})
