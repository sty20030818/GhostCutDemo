import { render, screen } from '@testing-library/react'

import App from '@/App'

describe('TaskDashboardPage', () => {
	it('渲染三栏工作台的核心区块', () => {
		render(<App />)

		expect(screen.getByRole('heading', { name: '创建任务' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '任务列表' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: '结果区' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '创建任务' })).toBeInTheDocument()
	})
})
