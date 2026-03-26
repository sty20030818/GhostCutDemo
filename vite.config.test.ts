import { describe, expect, it } from 'vitest'

import viteConfig from './vite.config'

describe('vite proxy config', () => {
	it('为 GhostCut 开发请求配置本地代理', () => {
		const proxyConfig = viteConfig.server?.proxy?.['/api/ghostcut']

		expect(proxyConfig).toBeDefined()
		expect(proxyConfig).toMatchObject({
			target: 'https://api.zhaoli.com',
			changeOrigin: true,
		})
		expect(proxyConfig?.rewrite?.('/api/ghostcut/v-w-c/gateway/ve/work/free')).toBe('/v-w-c/gateway/ve/work/free')
	})
})
