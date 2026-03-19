import { usePlatformAppInstallationDeleteMutation } from 'data/platform-apps/platform-app-installation-delete-mutation'
import dayjs from 'dayjs'
import { LayoutGrid, MoreVertical, Plus, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'

type InstallationsSort = 'created_at:asc' | 'created_at:desc'

const handleSortChange = (
  currentSort: InstallationsSort,
  column: string,
  setSort: (s: InstallationsSort) => void
) => {
  const [currentCol, currentOrder] = currentSort.split(':')
  if (currentCol === column) {
    setSort(`${column}:${currentOrder === 'asc' ? 'desc' : 'asc'}` as InstallationsSort)
  } else {
    setSort(`${column}:asc` as InstallationsSort)
  }
}
import { EmptyStatePresentational } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { CreateInstallationModal } from './CreateInstallationModal'
import { Installation, usePrivateApps } from './PrivateAppsContext'

export function InstallationsList() {
  const { installations, apps, slug, isLoadingInstallations, removeInstallation } = usePrivateApps()
  const { mutate: deleteInstallation, isPending: isDeleting } =
    usePlatformAppInstallationDeleteMutation({
      onSuccess: (_, vars) => {
        removeInstallation(vars.installationId)
        toast.success(`App uninstalled`)
        setInstallationToDelete(null)
      },
    })

  const [sort, setSort] = useState<InstallationsSort>('created_at:desc')
  const onSortChange = (column: string) => handleSortChange(sort, column, setSort)
  const [showCreate, setShowCreate] = useState(false)
  const [installationToDelete, setInstallationToDelete] = useState<Installation | null>(null)

  const sortedInstallations = useMemo(() => {
    const [, order] = sort.split(':')
    return [...installations].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return order === 'asc' ? diff : -diff
    })
  }, [installations, sort])

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
        {isLoadingInstallations ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App name</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="h-4 w-32 bg-surface-300 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-surface-300 rounded animate-pulse" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : installations.length === 0 ? (
          <EmptyStatePresentational
            icon={LayoutGrid}
            title="No app installations yet"
            description="Install a private app to start generating scoped access tokens for your projects."
          >
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Install app
            </Button>
          </EmptyStatePresentational>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-xs">Installed App</TableHead>
                  <TableHead className="w-48">
                    <TableHeadSort column="created_at" currentSort={sort} onSortChange={onSortChange}>
                      Installed
                    </TableHeadSort>
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstallations.map((inst) => {
                  return (
                    <TableRow key={inst.id}>
                      <TableCell className="max-w-xs">
                        <span className="font-medium block max-w-[48ch] truncate">{getAppName(inst.app_id)}</span>
                      </TableCell>
                      <TableCell>
                        <TimestampInfo
                          utcTimestamp={inst.created_at}
                          label={dayjs(inst.created_at).fromNow()}
                          className="text-sm text-foreground-light whitespace-nowrap"
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
