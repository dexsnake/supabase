import { Key, Plus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import type { components } from 'api-types'
import { usePlatformAppCreateMutation } from 'data/platform-apps/platform-app-create-mutation'
import { PERMISSIONS } from './PrivateApps.constants'
import { usePrivateApps } from './PrivateAppsContext'

type CreatePlatformAppResponse = components['schemas']['CreatePlatformAppResponse']

interface CreateAppSheetProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: CreatePlatformAppResponse) => void
}

export function CreateAppSheet({ visible, onClose, onCreated }: CreateAppSheetProps) {
  const { slug } = usePrivateApps()
  const { mutate: createApp, isPending: isLoading } = usePlatformAppCreateMutation({
    onSuccess: (data) => {
      reset()
      onCreated(data)
    },
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearchOpen, setPermissionSearchOpen] = useState(false)

  function reset() {
    setName('')
    setDescription('')
    setSelectedPermissions([])
    setPermissionSearchOpen(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleCreate() {
    if (!slug) return
    createApp({
      slug,
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: selectedPermissions as components['schemas']['CreatePlatformAppBody']['permissions'],
    })
  }

  function toggle(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const canCreate = name.trim().length > 0 && selectedPermissions.length > 0

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        showClose={false}
        size="default"
        className="!min-w-[600px] flex flex-col h-full gap-0"
      >
        <SheetHeader>
          <SheetTitle>Create private app</SheetTitle>
          <SheetDescription className="sr-only">
            Create a private app to generate scoped access tokens for your organization.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
          <div className="flex flex-col gap-0">
            {/* Basic info */}
            <div className="px-5 sm:px-6 py-6 space-y-4">
              <FormLayout label="App name" id="app-name">
                <Input_Shadcn_
                  id="app-name"
                  placeholder="My integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormLayout>

              <FormLayout label="Description" id="app-description">
                <textarea
                  id="app-description"
                  placeholder="Optional description of what this app does"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-control bg-transparent px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-foreground-muted resize-none"
                />
              </FormLayout>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="px-5 sm:px-6 py-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Configure permissions</span>
                <div className="flex items-center gap-2">
                  {selectedPermissions.length > 0 && (
                    <Button
                      type="default"
                      size="tiny"
                      className="p-1"
                      icon={<RotateCcw size={16} />}
                      onClick={() => setSelectedPermissions([])}
                    />
                  )}
                  <Popover_Shadcn_
                    open={permissionSearchOpen}
                    onOpenChange={setPermissionSearchOpen}
                    modal
                  >
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button type="default" size="tiny" icon={<Plus size={14} />}>
                        Add permission
                      </Button>
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-[400px] p-0" align="end">
                      <Command_Shadcn_>
                        <CommandInput_Shadcn_ placeholder="Search permissions..." />
                        <CommandList_Shadcn_>
                          <CommandEmpty_Shadcn_>No permissions found.</CommandEmpty_Shadcn_>
                          <CommandGroup_Shadcn_ className="[&>div]:text-left">
                            <div className="max-h-[210px] overflow-y-auto">
                              {PERMISSIONS.map((perm) => (
                                <CommandItem_Shadcn_
                                  key={perm.id}
                                  value={`${perm.id} ${perm.label}`}
                                  onSelect={() => toggle(perm.id)}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <Checkbox_Shadcn_
                                      checked={selectedPermissions.includes(perm.id)}
                                      onCheckedChange={() => toggle(perm.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Key size={12} className="text-foreground-lighter" />
                                    <div className="flex flex-col text-left flex-1">
                                      <span className="font-medium text-foreground font-mono text-sm">
                                        {perm.label}
                                      </span>
                                      <span className="text-xs text-foreground-light">
                                        {perm.description}
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem_Shadcn_>
                              ))}
                            </div>
                          </CommandGroup_Shadcn_>
                        </CommandList_Shadcn_>
                      </Command_Shadcn_>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                </div>
              </div>

              {selectedPermissions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-foreground-light">No permissions configured yet.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg">
                  {selectedPermissions.map((id, index) => {
                    const perm = PERMISSIONS.find((p) => p.id === id)
                    return (
                      <div key={id}>
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex-1">
                            <p className="text-sm font-mono font-medium">{perm?.label}</p>
                            <p className="text-xs text-foreground-light">{perm?.description}</p>
                          </div>
                          <Button
                            type="text"
                            size="tiny"
                            className="p-1"
                            icon={<X size={16} />}
                            onClick={() =>
                              setSelectedPermissions((prev) => prev.filter((p) => p !== id))
                            }
                          />
                        </div>
                        {index < selectedPermissions.length - 1 && (
                          <div className="border-t border-border" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="w-full flex gap-x-2 items-center">
                <WarningIcon />
                <span className="text-xs text-foreground-lighter">
                  Once you've set these permissions, you cannot edit them.
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="!justify-end w-full mt-auto py-4 border-t">
          <div className="flex gap-2">
            <Button type="default" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="primary" disabled={!canCreate} loading={isLoading} onClick={handleCreate}>
              Create app
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
