import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { generateOtherRoutes } from './NavigationBar.utils'
import { PROJECT_STATUS } from 'lib/constants'

const mockProject = {
  status: PROJECT_STATUS.ACTIVE_HEALTHY,
}

describe('generateOtherRoutes', () => {
  describe('observability route', () => {
    beforeEach(() => {
      vi.resetModules()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('includes observability when IS_PLATFORM is true and reports are enabled', async () => {
      vi.doMock('lib/constants', async () => {
        const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
        return {
          ...actual,
          IS_PLATFORM: true,
        }
      })

      const { generateOtherRoutes: mockedGenerateOtherRoutes } = await import(
        './NavigationBar.utils'
      )
      const routes = mockedGenerateOtherRoutes('test-ref', mockProject as any, { showReports: true })
      const hasObservability = routes.some((route) => route.key === 'observability')

      expect(hasObservability).toBe(true)
    })

    it('excludes observability when IS_PLATFORM is false', async () => {
      vi.doMock('lib/constants', async () => {
        const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
        return {
          ...actual,
          IS_PLATFORM: false,
        }
      })

      const { generateOtherRoutes: mockedGenerateOtherRoutes } = await import(
        './NavigationBar.utils'
      )
      const routes = mockedGenerateOtherRoutes('test-ref', mockProject as any, { showReports: true })
      const hasObservability = routes.some((route) => route.key === 'observability')

      expect(hasObservability).toBe(false)
    })

    it('excludes observability when IS_PLATFORM is false even if showReports defaults to true', async () => {
      vi.doMock('lib/constants', async () => {
        const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
        return {
          ...actual,
          IS_PLATFORM: false,
        }
      })

      const { generateOtherRoutes: mockedGenerateOtherRoutes } = await import(
        './NavigationBar.utils'
      )
      // Not passing showReports - it should default to true, but IS_PLATFORM being false should still hide observability
      const routes = mockedGenerateOtherRoutes('test-ref', mockProject as any, {})
      const hasObservability = routes.some((route) => route.key === 'observability')

      expect(hasObservability).toBe(false)
    })

    it('excludes observability when reports are disabled', async () => {
      vi.doMock('lib/constants', async () => {
        const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
        return {
          ...actual,
          IS_PLATFORM: true,
        }
      })

      const { generateOtherRoutes: mockedGenerateOtherRoutes } = await import(
        './NavigationBar.utils'
      )
      const routes = mockedGenerateOtherRoutes('test-ref', mockProject as any, {
        showReports: false,
      })
      const hasObservability = routes.some((route) => route.key === 'observability')

      expect(hasObservability).toBe(false)
    })

    it('always includes advisors, logs, and integrations routes regardless of IS_PLATFORM', async () => {
      vi.doMock('lib/constants', async () => {
        const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
        return {
          ...actual,
          IS_PLATFORM: false,
        }
      })

      const { generateOtherRoutes: mockedGenerateOtherRoutes } = await import(
        './NavigationBar.utils'
      )
      const routes = mockedGenerateOtherRoutes('test-ref', mockProject as any, {})

      expect(routes.some((route) => route.key === 'advisors')).toBe(true)
      expect(routes.some((route) => route.key === 'logs')).toBe(true)
      expect(routes.some((route) => route.key === 'integrations')).toBe(true)
    })
  })
})
