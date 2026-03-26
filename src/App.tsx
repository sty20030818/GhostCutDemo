import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
} from '@/components/ui/select'

const languageItems = [
	{ label: '请选择语言', value: null },
	{ label: '中文', value: 'zh' },
	{ label: 'English', value: 'en' },
	{ label: '日本語', value: 'ja' },
	{ label: '한국어', value: 'ko' },
]

export default function App() {
	return (
		<div className='flex min-h-svh items-center justify-center bg-background p-6'>
			<Card className='w-full max-w-md'>
				<CardHeader>
					<CardTitle>GhostCut Demo</CardTitle>
					<CardDescription>项目初始化验证 — Tailwind v4 + shadcn/ui (base)</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-col gap-4'>
						<Select items={languageItems}>
							<SelectTrigger className='w-full'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent
								alignItemWithTrigger={false}
								side='bottom'>
								<SelectGroup>
									<SelectLabel>目标语言</SelectLabel>
									{languageItems
										.filter((item) => item.value !== null)
										.map((item) => (
											<SelectItem
												key={item.value}
												value={item.value}>
												{item.label}
											</SelectItem>
										))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<div className='flex gap-2'>
							<Button>创建任务</Button>
							<Button variant='outline'>取消</Button>
							<Button variant='secondary'>查看结果</Button>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<p className='text-xs text-muted-foreground'>
						按 <kbd className='rounded border px-1'>d</kbd> 切换深色模式
					</p>
				</CardFooter>
			</Card>
		</div>
	)
}
