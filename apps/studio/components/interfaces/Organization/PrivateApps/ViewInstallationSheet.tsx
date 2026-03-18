import dayjs from 'dayjs'
import { Edit, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, ScrollArea, Sheet, SheetContent, SheetHeader, cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import CopyButton from 'components/ui/CopyButton'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { usePlatformAppInstallationDeleteMutation } from 'data/platform-apps/platform-app-installation-delete-mutation'
import { EditScopeModal } from './EditScopeModal'
import { Installation, usePrivateApps } from './PrivateAppsContext'

interface ViewInstallationSheetProps {
  installation: Installation | null
  visible: boolean
  onClose: () => void
}

export function ViewInstallationSheet({
  installation,
  visible,
  onClose,
}: ViewInstallationSheetProps) {
  const { slug, apps, removeInstallation } = usePrivateApps()
  const [showEditScope, setShowEditScope] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const allProjects = projectsData?.pages.flatMap((p) => p.projects) ?? []

  const { mutate: deleteInstallation, isPending: isDeleting } =
    usePlatformAppInstallationDeleteMutation({
      onSuccess: (_, vars) => {
        removeInstallation(vars.installationId)
        toast.success('App uninstalled')
        setShowUninstallModal(false)
        onClose()
      },
    })

  const app = apps.find((a) => a.id === installation?.app_id)
  const appName = app?.name ?? installation?.app_id ?? ''
  const projectScope = installation?.projectScope ?? 'all'
  const scopeProjects =
    projectScope !== 'all'
      ? allProjects.filter((p) => (projectScope as string[]).includes(p.ref))
      : []

  function handleUninstall() {
    if (!installation || !slug) return
    deleteInstallation({ slug, installationId: installation.id })
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader
            className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate font-medium">{appName}</p>
            <Button type="text" icon={<X size={16} />} className="px-1" onClick={onClose} />
          </SheetHeader>

          <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
            {installation && (
              <div className="space-y-8 px-5 sm:px-6 py-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Installation Details</h3>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">App</span>
                      <span className="text-sm font-medium">{appName}</span>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">App ID</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono text-sm truncate">{installation.app_id}</span>
                        <CopyButton
                          type="default"
                          iconOnly
                          text={installation.app_id}
                          className="px-1 shrink-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Installed</span>
                      <TimestampInfo
                        utcTimestamp={installation.created_at}
                        label={dayjs(installation.created_at).fromNow()}
                        className="text-sm text-foreground-light"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Project Scope</h3>
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Edit size={12} />}
                      onClick={() => setShowEditScope(true)}
                    >
                      Edit scope
                    </Button>
                  </div>
                  <div className="border border-border rounded-lg p-4">
                    {projectScope === 'all' ? (
                      <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs font-medium">
                        All projects
                      </span>
                    ) : scopeProjects.length > 0 ? (
                      <div className="space-y-2">
                        {scopeProjects.map((p) => (
                          <div key={p.ref} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
                            <span className="text-sm">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground-muted italic">No projects selected</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <div className="border border-destructive/30 rounded-lg">
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
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <EditScopeModal
        installation={installation}
        visible={showEditScope}
        onClose={() => setShowEditScope(false)}
      />

      <ConfirmationModal
        variant="destructive"
        visible={showUninstallModal}
        title={`Uninstall "${appName}"`}
        confirmLabel="Uninstall"
        confirmLabelLoading="Uninstalling..."
        onCancel={() => setShowUninstallModal(false)}
        onConfirm={handleUninstall}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall <strong>{appName}</strong>? Any tokens generated
          through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
