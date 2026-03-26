import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ResultPanel } from '@/components/result/result-panel'
import type { TranslateTask } from '@/types/task'

describe('ResultPanel', () => {
	it('会按任务分组展示所有已完成文件结果', () => {
		const tasks: TranslateTask[] = [
			{
				id: 'task-1',
				name: '批次任务 A',
				createdAt: '03-26 18:00',
				sourceLanguage: 'zh',
				targetLanguage: 'en',
				status: 'completed',
				files: [
					{
						id: 'file-1',
						name: 'episode-1.mp4',
						duration: '--:--',
						size: '12 MB',
						status: 'completed',
						progress: 100,
						resultUrl: 'https://example.com/result-1.mp4',
						sourceVideoUrl: 'https://example.com/source-1.mp4',
						srcSrtUrl: 'https://example.com/source-1.srt',
						tgtSrtUrl: 'https://example.com/target-1.srt',
						ocrTranslateTaskId: 'ocr-1',
					},
					{
						id: 'file-2',
						name: 'episode-2.mp4',
						duration: '--:--',
						size: '18 MB',
						status: 'failed',
						progress: 100,
						error: '处理失败',
					},
				],
			},
			{
				id: 'task-2',
				name: '批次任务 B',
				createdAt: '03-26 18:05',
				sourceLanguage: 'zh',
				targetLanguage: 'ja',
				status: 'processing',
				files: [
					{
						id: 'file-3',
						name: 'episode-3.mp4',
						duration: '--:--',
						size: '22 MB',
						status: 'processing',
						progress: 80,
					},
				],
			},
		]

		render(<ResultPanel tasks={tasks} />)

		expect(screen.getByText('任务 #task1')).toBeInTheDocument()
		expect(screen.getByText('episode-1.mp4')).toBeInTheDocument()
		expect(screen.queryByText('任务 #task2')).not.toBeInTheDocument()
		expect(screen.queryByText('episode-2.mp4')).not.toBeInTheDocument()
		expect(screen.getByText('1 / 2 已完成')).toBeInTheDocument()
		expect(screen.getByText(/中文.*→.*英文/)).toBeInTheDocument()
	})

	it('会根据真实结果字段渲染对应链接操作', () => {
		const tasks: TranslateTask[] = [
			{
				id: 'task-1',
				name: '批次任务 A',
				createdAt: '03-26 18:00',
				sourceLanguage: 'zh',
				targetLanguage: 'en',
				status: 'completed',
				files: [
					{
						id: 'file-1',
						name: 'episode-1.mp4',
						duration: '--:--',
						size: '12 MB',
						status: 'completed',
						progress: 100,
						resultUrl: 'https://example.com/result-1.mp4',
						sourceVideoUrl: 'https://example.com/source-1.mp4',
						tgtSrtUrl: 'https://example.com/target-1.srt',
					},
				],
			},
		]

		render(<ResultPanel tasks={tasks} />)

		expect(screen.getByRole('link', { name: '下载成片' })).toHaveAttribute('href', 'https://example.com/result-1.mp4')
		expect(screen.getByRole('link', { name: '查看原视频' })).toHaveAttribute('href', 'https://example.com/source-1.mp4')
		expect(screen.getByRole('link', { name: '下载目标字幕' })).toHaveAttribute('href', 'https://example.com/target-1.srt')
		expect(screen.queryByRole('link', { name: '下载源字幕' })).not.toBeInTheDocument()
	})
})
