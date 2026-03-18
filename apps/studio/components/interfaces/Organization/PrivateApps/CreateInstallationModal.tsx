import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Label_Shadcn_,
  RadioGroupItem_Shadcn_,
  RadioGroup_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { usePlatformAppInstallationCreateMutation } from 'data/platform-apps/platform-app-installation-create-mutation'
import { usePrivateApps } from './PrivateAppsContext'

interface CreateInstallationModalProps {
  visible: boolean
  onClose: () => void
}

export function CreateInstallationModal({ visible, onClose }: CreateInstallationModalProps) {
  const { slug, apps, addInstallation } = usePrivateApps()
  const { data: projectsData } = useOrgProjectsInfiniteQuery({ slug })
  const projects = projectsData?.pages.flatMap((p) => p.projects) ?? []

  const { mutate: installApp, isPending: isInstalling } = usePlatformAppInstallationCreateMutation({
    onSuccess: (data) => {
      if (data) {
        const scope: 'all' | string[] = scopeType === 'all' ? 'all' : Array.from(selectedProjects)
        addInstallation(data, scope)
      }
      reset()
      onClose()
    },
  })

  const [selectedAppId, setSelectedAppId] = useState('')
  const [scopeType, setScopeType] = useState<'all' | 'selected'>('all')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())

  function reset() {
    setSelectedAppId('')
    setScopeType('all')
    setSelectedProjects(new Set())
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleInstall() {
    if (!slug || !selectedAppId) return
    installApp({ slug, app_id: selectedAppId })
  }

  function toggleProject(ref: string) {
    setSelectedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(ref)) next.delete(ref)
      else next.add(ref)
      return next
    })
  }

  const canInstall = selectedAppId !== '' && (scopeType === 'all' || selectedProjects.size > 0)

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Install app</DialogTitle>
          <DialogDescription>
            Install a private app to grant it access to projects in your organization.
          </DialogDescription>
        </DialogHeader>

        <DialogSection className="space-y-5">
          <div className="space-y-2">
            <Label_Shadcn_>Select app</Label_Shadcn_>
            {apps.length === 0 ? (
              <p className="text-sm text-foreground-light">
                No private apps available. Create an app first.
              </p>
            ) : (
              <Select_Shadcn_ value={selectedAppId} onValueChange={setSelectedAppId}>
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Choose an app..." />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {apps.map((app) => (
                    <SelectItem_Shadcn_ key={app.id} value={app.id}>
                      {app.name}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            )}
          </div>

          <div className="space-y-3">
            <Label_Shadcn_>Project scope</Label_Shadcn_>
            <RadioGroup_Shadcn_
              value={scopeType}
              onValueChange={(v) => setScopeType(v as 'all' | 'selected')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem_Shadcn_ value="all" id="scope-all" />
                <Label_Shadcn_ htmlFor="scope-all" className="cursor-pointer font-normal">
                  All projects in organization
                </Label_Shadcn_>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem_Shadcn_ value="selected" id="scope-selected" />
                <Label_Shadcn_ htmlFor="scope-selected" className="cursor-pointer font-normal">
                  Selected projects
                </Label_Shadcn_>
              </div>
            </RadioGroup_Shadcn_>

            {scopeType === 'selected' && (
              <div className="ml-6 space-y-2 rounded-md border border-control p-3 max-h-48 overflow-y-auto">
                {projects.length === 0 ? (
                  <p className="text-sm text-foreground-light">No projects found.</p>
                ) : (
                  projects.map((project) => (
                    <label key={project.ref} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox_Shadcn_
                        id={project.ref}
                        checked={selectedProjects.has(project.ref)}
                        onCheckedChange={() => toggleProject(project.ref)}
                      />
                      <Label_Shadcn_ htmlFor={project.ref} className="cursor-pointer font-normal">
                        {project.name}
                      </Label_Shadcn_>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose} disabled={isInstalling}>
            Cancel
          </Button>
          <Button
            type="primary"
            disabled={!canInstall}
            loading={isInstalling}
            onClick={handleInstall}
          >
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
