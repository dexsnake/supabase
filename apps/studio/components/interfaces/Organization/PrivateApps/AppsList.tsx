import dayjs from 'dayjs'
import { AppWindow, MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
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
  TableRow,
} from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import CopyButton from 'components/ui/CopyButton'
import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { CreateAppSheet } from './CreateAppSheet'
import { DeleteAppModal } from './DeleteAppModal'
import { ViewAppSheet } from './ViewAppSheet'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

export function AppsList() {
  const { apps, isLoading, slug } = usePrivateApps()
  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted app`)
      if (appToDelete?.id === vars.appId) setAppToDelete(null)
    },
  })

  const [showCreate, setShowCreate] = useState(false)
  const [viewApp, setViewApp] = useState<PrivateApp | null>(null)
  const [appToDelete, setAppToDelete] = useState<PrivateApp | null>(null)

  function handleCreated() {
    setShowCreate(false)
  }

  function handleDelete() {
    if (!appToDelete || !slug) return
    deleteApp({ slug, appId: appToDelete.id })
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        {!isLoading && apps.length > 0 && (
          <div className="flex justify-end">
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Create app
            </Button>
          </div>
        )}

        {isLoading ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>App ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-32 bg-surface-300 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-48 bg-surface-300 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-4 w-24 bg-surface-300 rounded animate-pulse" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : apps.length === 0 ? (
          <EmptyStatePresentational
            icon={AppWindow}
            title="No private apps yet"
            description="Create a private app to generate scoped access tokens for your organization."
          >
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Create app
            </Button>
          </EmptyStatePresentational>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>App ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <button
                        className="font-medium hover:underline text-left"
                        onClick={() => setViewApp(app)}
                      >
                        {app.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-x-2">
                        <span className="font-mono text-xs truncate max-w-[200px]">{app.id}</span>
                        <CopyButton type="default" iconOnly text={app.id} className="px-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <TimestampInfo
                        utcTimestamp={app.created_at}
                        label={dayjs(app.created_at).fromNow()}
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
                        <DropdownMenuContent align="end" side="bottom" className="w-32">
                          <DropdownMenuItem onClick={() => setViewApp(app)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="!text-destructive gap-x-2"
                            onClick={() => setAppToDelete(app)}
                          >
                            <Trash size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <CreateAppSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      <ViewAppSheet
        app={viewApp}
        visible={viewApp !== null}
        onClose={() => setViewApp(null)}
        onDeleted={() => setViewApp(null)}
      />

      <DeleteAppModal
        app={appToDelete}
        visible={appToDelete !== null}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
