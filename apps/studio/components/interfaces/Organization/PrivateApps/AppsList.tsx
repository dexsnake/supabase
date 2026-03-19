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
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-sm text-foreground-light">
            Generate scoped access tokens for your organization using private apps.
          </p>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Create app
          </Button>
        </div>

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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No private apps yet</p>
              <p className="text-sm text-foreground-light mt-1 max-w-sm">
                Create a private app to generate scoped access tokens for your organization
              </p>
            </div>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Create your first app
            </Button>
          </div>
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
