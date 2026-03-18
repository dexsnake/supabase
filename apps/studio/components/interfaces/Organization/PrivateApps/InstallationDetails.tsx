import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import CopyButton from 'components/ui/CopyButton'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { EditScopeModal } from './EditScopeModal'
import { Installation, usePrivateApps } from './PrivateAppsContext'

interface InstallationDetailsProps {
  installation: Installation
}

export function InstallationDetails({ installation }: InstallationDetailsProps) {
  const router = useRouter()
  const { slug: routerSlug } = router.query as { slug: string }
  const { slug, apps, toggleInstallationStatus, deleteInstallation } = usePrivateApps()
  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const allProjects = projectsData?.pages.flatMap((p) => p.projects) ?? []

  const [showEditScope, setShowEditScope] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const app = apps.find((a) => a.id === installation.appId)

  function handleUninstall() {
    deleteInstallation(installation.id)
    toast.success(`Uninstalled "${installation.appName}"`)
    router.push(`/org/${routerSlug}/installations`)
  }

  function handleToggleStatus() {
    toggleInstallationStatus(installation.id)
    toast.success(
      `Installation ${installation.status === 'active' ? 'suspended' : 'activated'}`
    )
  }

  const scopeProjects =
    installation.projectScope !== 'all'
      ? allProjects.filter((p) => (installation.projectScope as string[]).includes(p.ref))
      : []

  const orgPermissions: { id: string; label: string; description: string }[] = []
  const projectPermissions: { id: string; label: string; description: string }[] = []

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-8">
          {/* App reference */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">App</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">App name</span>
                {app ? (
                  <Link
                    href={`/org/${routerSlug}/private-apps/${app.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {installation.appName}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{installation.appName}</span>
                )}
              </div>
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Client ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{installation.appId}</span>
                  <CopyButton type="default" iconOnly text={installation.appId} className="px-1" />
                </div>
              </div>
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Installed</span>
                <span className="text-sm">
                  {formatDistanceToNow(installation.installedAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Project scope */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Project Scope</h3>
              <Button
                type="default"
                size="tiny"
                icon={<Edit size={12} />}
                onClick={() => setShowEditScope(true)}
              >
                Edit scope
              </Button>
            </div>
            <div className="border border-default rounded-lg p-4">
              {installation.projectScope === 'all' ? (
                <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs font-medium">
                  All projects
                </span>
              ) : (
                <div className="space-y-2">
                  {scopeProjects.length > 0 ? (
                    scopeProjects.map((p) => (
                      <div key={p.ref} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
                        <span className="text-sm">{p.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-foreground-muted italic">No projects selected</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Granted permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Granted Permissions</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              {orgPermissions.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Organization permissions
                  </p>
                  <div className="space-y-2">
                    {orgPermissions.map((p) => (
                      <div key={p!.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-mono">{p!.label}</p>
                          <p className="text-xs text-foreground-light">{p!.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {projectPermissions.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Project permissions
                  </p>
                  <div className="space-y-2">
                    {projectPermissions.map((p) => (
                      <div key={p!.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-mono">{p!.label}</p>
                          <p className="text-xs text-foreground-light">{p!.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {orgPermissions.length === 0 && projectPermissions.length === 0 && (
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground-muted italic">
                    No permissions information available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status & danger */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <div className="border border-destructive/30 rounded-lg divide-y divide-default">
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {installation.status === 'active' ? 'Suspend installation' : 'Activate installation'}
                  </p>
                  <p className="text-xs text-foreground-light">
                    {installation.status === 'active'
                      ? 'Temporarily disable token generation for this installation'
                      : 'Re-enable token generation for this installation'}
                  </p>
                </div>
                <Button
                  type={installation.status === 'active' ? 'warning' : 'default'}
                  onClick={handleToggleStatus}
                >
                  {installation.status === 'active' ? 'Suspend' : 'Activate'}
                </Button>
              </div>
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Uninstall app</p>
                  <p className="text-xs text-foreground-light">
                    Remove this installation and invalidate any tokens it generated
                  </p>
                </div>
                <Button
                  type="danger"
                  icon={<Trash size={14} />}
                  onClick={() => setShowUninstallModal(true)}
                >
                  Uninstall
                </Button>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <EditScopeModal
        installation={installation}
        visible={showEditScope}
        onClose={() => setShowEditScope(false)}
      />

      <ConfirmationModal
        variant="destructive"
        visible={showUninstallModal}
        title={`Uninstall "${installation.appName}"`}
        confirmLabel="Uninstall"
        onCancel={() => setShowUninstallModal(false)}
        onConfirm={handleUninstall}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall <strong>{installation.appName}</strong>? Any tokens
          generated through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
