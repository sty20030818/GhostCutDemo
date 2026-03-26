import { describe, expect, it } from 'vitest'

import { buildGhostCutSign } from '@/lib/sign'

describe('ghostcut sign', () => {
	it('可以基于紧凑 JSON body 生成双重 MD5 签名', () => {
		const bodyString = '{"urls":["https://example.com/video.mp4"],"needChineseOcclude":11,"videoInpaintLang":"zh","lang":"en"}'

		expect(buildGhostCutSign(bodyString, 'demo-secret')).toBe('be20751ed99721d54ea169db9578ac27')
	})
})
