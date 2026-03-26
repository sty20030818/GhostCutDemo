/** 通过临时 <video> 元素读取本地视频文件的时长（秒） */
export function probeVideoDuration(file: File): Promise<number> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file)
		const video = document.createElement('video')
		video.preload = 'metadata'

		video.addEventListener('loadedmetadata', () => {
			const duration = video.duration
			URL.revokeObjectURL(url)
			resolve(Number.isFinite(duration) ? duration : 0)
		})

		video.addEventListener('error', () => {
			URL.revokeObjectURL(url)
			reject(new Error(`无法读取视频时长: ${file.name}`))
		})

		video.src = url
	})
}

/** 将秒数格式化为 mm:ss 或 hh:mm:ss */
export function formatDuration(seconds: number): string {
	const total = Math.round(seconds)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60

	const mm = String(m).padStart(2, '0')
	const ss = String(s).padStart(2, '0')

	return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}
