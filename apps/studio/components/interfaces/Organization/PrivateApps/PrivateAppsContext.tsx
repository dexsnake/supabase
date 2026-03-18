import { createContext, PropsWithChildren, useContext, useState } from 'react'

import type { components } from 'api-types'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { usePlatformAppsQuery } from 'data/platform-apps/platform-apps-query'

export type PrivateApp = components['schemas']['ListPlatformAppsResponse']['apps'][number]

export interface Installation {
  id: string
  appId: string
  appName: string
  projectScope: 'all' | string[]
  status: 'active' | 'suspended'
  installedAt: Date
}

interface PrivateAppsContextValue {
  slug: string | undefined
  apps: PrivateApp[]
  isLoading: boolean
  installations: Installation[]
  createInstallation: (data: { appId: string; projectScope: 'all' | string[] }) => Installation
  updateInstallationScope: (id: string, projectScope: 'all' | string[]) => void
  toggleInstallationStatus: (id: string) => void
  deleteInstallation: (id: string) => void
}

const PrivateAppsContext = createContext<PrivateAppsContextValue | null>(null)

export function PrivateAppsProvider({ children }: PropsWithChildren) {
  const { data: org } = useSelectedOrganizationQuery()
  const slug = org?.slug

  const { data, isLoading } = usePlatformAppsQuery({ slug })

  const [installations, setInstallations] = useState<Installation[]>([])

  function createInstallation(data: { appId: string; projectScope: 'all' | string[] }) {
    const app = (data as any).apps?.find((a: PrivateApp) => a.id === data.appId)
    const installation: Installation = {
      id: crypto.randomUUID(),
      appId: data.appId,
      appName: app?.name ?? '',
      projectScope: data.projectScope,
      status: 'active',
      installedAt: new Date(),
    }
    setInstallations((prev) => [...prev, installation])
    return installation
  }

  function updateInstallationScope(id: string, projectScope: 'all' | string[]) {
    setInstallations((prev) =>
      prev.map((inst) => (inst.id === id ? { ...inst, projectScope } : inst))
    )
  }

  function toggleInstallationStatus(id: string) {
    setInstallations((prev) =>
      prev.map((inst) =>
        inst.id === id
          ? { ...inst, status: inst.status === 'active' ? 'suspended' : 'active' }
          : inst
      )
    )
  }

  function deleteInstallation(id: string) {
    setInstallations((prev) => prev.filter((inst) => inst.id !== id))
  }

  return (
    <PrivateAppsContext.Provider
      value={{
        slug,
        apps: data?.apps ?? [],
        isLoading,
        installations,
        createInstallation,
        updateInstallationScope,
        toggleInstallationStatus,
        deleteInstallation,
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
