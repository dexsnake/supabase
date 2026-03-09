import { describe, expect, it } from 'vitest'

import type { AuthorizedApp } from 'data/oauth/authorized-apps-query'
import {
  getAuthorizedAppNames,
  getConnectedAppsTitle,
  isProjectRoute,
} from './ProjectOAuthIntegrationsBanner.utils'

const createAuthorizedApp = (overrides: Partial<AuthorizedApp>): AuthorizedApp => ({
  id: 'auth-app-id',
  app_id: 'oauth-app-id',
  icon: null,
  name: 'Lovable',
  website: 'https://example.com',
  created_by: 'user-1',
  authorized_at: new Date().toISOString(),
  ...overrides,
})

describe('ProjectOAuthIntegrationsBanner utils', () => {
  describe('isProjectRoute', () => {
    it('returns true for project route template pathnames', () => {
      expect(isProjectRoute({ pathname: '/project/[ref]/database/tables' })).toBe(true)
    })

    it('returns true for project URLs from asPath', () => {
      expect(isProjectRoute({ pathname: '/unknown', asPath: '/project/default/functions' })).toBe(
        true
      )
    })

    it('returns false for non-project routes', () => {
      expect(isProjectRoute({ pathname: '/org/[slug]/apps', asPath: '/org/default/apps' })).toBe(
        false
      )
    })
  })

  describe('getAuthorizedAppNames', () => {
    it('returns unique display-safe app names', () => {
      const appNames = getAuthorizedAppNames([
        createAuthorizedApp({ name: '  Lovable  ' }),
        createAuthorizedApp({ name: 'lovable' }),
        createAuthorizedApp({ name: 'Bolt.new' }),
        createAuthorizedApp({ name: ' ' }),
      ])

      expect(appNames).toEqual(['Lovable', 'Bolt.new'])
    })
  })

  describe('getConnectedAppsTitle', () => {
    it('renders title for a single app', () => {
      expect(getConnectedAppsTitle(['Lovable'])).toBe('Connected to Lovable')
    })

    it('renders a condensed title for multiple apps', () => {
      expect(getConnectedAppsTitle(['Lovable', 'Bolt', 'Replit'])).toBe(
        'Connected to Lovable, Bolt, and 1 other'
      )
    })
  })
})
