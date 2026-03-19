import dayjs from 'dayjs'
import { MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { usePlatformAppInstallationDeleteMutation } from 'data/platform-apps/platform-app-installation-delete-mutation'
import { CreateInstallationModal } from './CreateInstallationModal'
import { Installation, usePrivateApps } from './PrivateAppsContext'

export function InstallationsList() {
  const { installations, apps, slug, removeInstallation } = usePrivateApps()
  const allAppsInstalled =
    apps.length > 0 && installations.length >= apps.length
  const { mutate: deleteInstallation, isPending: isDeleting } =
    usePlatformAppInstallationDeleteMutation({
      onSuccess: (_, vars) => {
        removeInstallation(vars.installationId)
        toast.success(`App uninstalled`)
        setInstallationToDelete(null)
      },
    })

  const [showCreate, setShowCreate] = useState(false)
  const [installationToDelete, setInstallationToDelete] = useState<Installation | null>(null)

  function getAppName(appId: string) {
    return apps.find((a) => a.id === appId)?.name ?? appId
  }

  function handleDelete() {
    if (!installationToDelete || !slug) return
    deleteInstallation({ slug, installationId: installationToDelete.id })
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-sm text-foreground-light">
            Manage where private apps are installed across your organization.
          </p>
          <Button
            type="primary"
            icon={<Plus size={14} />}
            disabled={allAppsInstalled}
            onClick={() => setShowCreate(true)}
          >
            Install app
          </Button>
        </div>

        {installations.length === 0 ? (
          <div className="bg-surface-100 border rounded-lg p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-300 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-foreground-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No app installations yet</p>
              <p className="text-sm text-foreground-light mt-1 max-w-sm">
                Install a private app to start generating scoped access tokens for your projects
              </p>
            </div>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Install your first app
            </Button>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {installations.map((inst) => {
                  const scope = inst.projectScope
                  const scopeLabel =
                    scope === 'all'
                      ? 'All projects'
                      : scope.length === 1
                        ? '1 project'
                        : `${scope.length} projects`
                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="font-medium">{getAppName(inst.app_id)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs">
                          {scopeLabel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TimestampInfo
                          utcTimestamp={inst.created_at}
                          label={dayjs(inst.created_at).fromNow()}
                          className="text-sm text-foreground-light"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="default"
                              icon={<MoreVertical size={14} />}
                              className="px-1"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="bottom" className="w-40">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="!text-destructive gap-x-2"
                              onClick={() => setInstallationToDelete(inst)}
                            >
                              <Trash size={14} />
                              Uninstall
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <CreateInstallationModal visible={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmationModal
        variant="destructive"
        visible={installationToDelete !== null}
        title={`Uninstall "${getAppName(installationToDelete?.app_id ?? '')}"`}
        confirmLabel="Uninstall"
        confirmLabelLoading="Uninstalling..."
        onCancel={() => setInstallationToDelete(null)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall{' '}
          <strong>{getAppName(installationToDelete?.app_id ?? '')}</strong>? Any tokens generated
          through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
