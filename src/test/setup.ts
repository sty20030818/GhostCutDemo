import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
	vi.stubEnv('VITE_TOS_UPLOAD_MODE', 'mock')
	vi.stubEnv('VITE_MOCK_TOS_DELAY_MS', '0')
})

afterEach(() => {
	vi.unstubAllEnvs()
})
