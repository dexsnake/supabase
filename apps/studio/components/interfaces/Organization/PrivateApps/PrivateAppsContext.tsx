import { createContext, PropsWithChildren, useContext, useState } from 'react'

import type { components } from 'api-types'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { usePlatformAppsQuery } from 'data/platform-apps/platform-apps-query'

export type PrivateApp = components['schemas']['ListPlatformAppsResponse']['apps'][number]
export type Installation = components['schemas']['InstallPlatformAppResponse'] & {
  // Project scope is not yet in the API — tracked locally for the UI
  projectScope: 'all' | string[]
}

interface PrivateAppsContextValue {
  slug: string | undefined
  apps: PrivateApp[]
  isLoading: boolean
  installations: Installation[]
  addInstallation: (data: components['schemas']['InstallPlatformAppResponse'], projectScope: 'all' | string[]) => void
  removeInstallation: (id: string) => void
  setProjectScope: (installationId: string, scope: 'all' | string[]) => void
}

const PrivateAppsContext = createContext<PrivateAppsContextValue | null>(null)

export function PrivateAppsProvider({ children }: PropsWithChildren) {
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const { data: appsData, isLoading } = usePlatformAppsQuery({ slug })
  const [installations, setInstallations] = useState<Installation[]>([])

  function addInstallation(
    data: components['schemas']['InstallPlatformAppResponse'],
    projectScope: 'all' | string[]
  ) {
    setInstallations((prev) => [...prev, { ...data, projectScope }])
  }

  function removeInstallation(id: string) {
    setInstallations((prev) => prev.filter((i) => i.id !== id))
  }

  function setProjectScope(installationId: string, scope: 'all' | string[]) {
    setInstallations((prev) =>
      prev.map((i) => (i.id === installationId ? { ...i, projectScope: scope } : i))
    )
  }

  return (
    <PrivateAppsContext.Provider
      value={{
        slug,
        apps: appsData?.apps ?? [],
        isLoading,
        installations,
        addInstallation,
        removeInstallation,
        setProjectScope,
      }}
    >
      {children}
    </PrivateAppsContext.Provider>
  )
}

export function usePrivateApps() {
  const ctx = useContext(PrivateAppsContext)
  if (!ctx) throw new Error('usePrivateApps must be used within PrivateAppsProvider')
  return ctx
}
