import dayjs from 'dayjs'
import { Copy, Download, MoreVertical, Plus, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import CopyButton from 'components/ui/CopyButton'
import type { components } from 'api-types'
import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { CreateAppSheet } from './CreateAppSheet'
import { DeleteAppModal } from './DeleteAppModal'
import { ViewAppSheet } from './ViewAppSheet'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

type CreatePlatformAppResponse = components['schemas']['CreatePlatformAppResponse']

interface NewAppKey {
  app: CreatePlatformAppResponse
  confirmed: boolean
}

export function AppsList() {
  const { apps, isLoading, slug } = usePrivateApps()
  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted app`)
      if (appToDelete?.id === vars.appId) setAppToDelete(null)
    },
  })

  const [showCreate, setShowCreate] = useState(false)
  const [newAppKey, setNewAppKey] = useState<NewAppKey | null>(null)
  const [viewApp, setViewApp] = useState<PrivateApp | null>(null)
  const [appToDelete, setAppToDelete] = useState<PrivateApp | null>(null)

  function handleCreated(app: CreatePlatformAppResponse) {
    setShowCreate(false)
    setNewAppKey({ app, confirmed: false })
  }

  function handleCopyKey() {
    if (!newAppKey) return
    navigator.clipboard.writeText(newAppKey.app.signing_key.private_key)
    toast.success('Private key copied to clipboard')
  }

  function handleDownloadKey() {
    if (!newAppKey) return
    const blob = new Blob([newAppKey.app.signing_key.private_key], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newAppKey.app.name.toLowerCase().replace(/\s+/g, '-')}-private-key.pem`
    a.click()
    URL.revokeObjectURL(url)
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

        {/* Private key banner — shown after creation, only dismissible once confirmed */}
        {newAppKey && (
          <Admonition
            type="tip"
            title="Save your private key now — you won't be able to see it again."
            className="relative"
            actions={
              newAppKey.confirmed ? (
                <Button
                  type="text"
                  icon={<X />}
                  className="w-7 h-7 absolute top-2.5 right-2.5"
                  onClick={() => setNewAppKey(null)}
                />
              ) : undefined
            }
          >
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground-light">App</span>
                  <span className="font-medium">{newAppKey.app.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-light">App ID</span>
                  <span className="font-mono text-xs">{newAppKey.app.id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-light">Private key</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Copy size={12} />}
                      onClick={handleCopyKey}
                    >
                      Copy
                    </Button>
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Download size={12} />}
                      onClick={handleDownloadKey}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={newAppKey.app.signing_key.private_key}
                  rows={8}
                  className="w-full rounded-md border border-control bg-surface-200 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox_Shadcn_
                  id="key-confirmed"
                  checked={newAppKey.confirmed}
                  onCheckedChange={(v) =>
                    setNewAppKey((prev) => (prev ? { ...prev, confirmed: Boolean(v) } : null))
                  }
                />
                <Label_Shadcn_ htmlFor="key-confirmed" className="cursor-pointer">
                  I have saved this private key
                </Label_Shadcn_>
              </label>
            </div>
          </Admonition>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-foreground-light">Loading apps...</div>
          </div>
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
