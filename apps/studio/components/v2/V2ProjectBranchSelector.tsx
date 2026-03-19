'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import {
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  Button,
  Badge,
} from 'ui'
import { ChevronsUpDown, GitBranch } from 'lucide-react'

import { IS_PLATFORM } from 'lib/constants'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useBranchesQuery } from 'data/branches/branches-query'

import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function V2ProjectBranchSelector() {
  const router = useRouter()
  const { orgSlug, projectRef } = useV2Params()
  const [open, setOpen] = useState(false)

  const { data: organizations, isPending: isOrgsPending } = useOrganizationsQuery()
  const selectedOrg = useMemo(
    () => organizations?.find((o) => o.slug === orgSlug),
    [organizations, orgSlug]
  )

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const parentRef = project?.parent_project_ref ?? projectRef
  const { data: branches, isPending: isBranchesPending } = useBranchesQuery(
    { projectRef: parentRef },
    { enabled: IS_PLATFORM && Boolean(parentRef) }
  )

  const { data: projectsData, isPending: isProjectsPending } = useOrgProjectsInfiniteQuery(
    { slug: orgSlug, limit: 50 },
    { enabled: open && Boolean(orgSlug) }
  )
  const projects = projectsData?.pages?.flatMap((p) => p.projects) ?? []

  const selectedBranch = branches?.find((b) => b.project_ref === projectRef)
  const branchName = selectedBranch?.name ?? 'main'
  const isDefaultBranch = selectedBranch?.is_default ?? true

  const handleSelectOrg = (slug: string) => {
    setOpen(false)
    router.push(`/dashboard/v2/org/${slug}`)
  }

  const handleSelectProject = (ref: string) => {
    setOpen(false)
    router.push(`/dashboard/v2/project/${ref}/data/tables`)
  }

  const handleSelectBranch = (ref: string) => {
    setOpen(false)
    router.push(`/dashboard/v2/project/${ref}/data/tables`)
  }

  const isTriggerLoading = Boolean(projectRef) && (isProjectPending || !project)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type="text"
          size="tiny"
          className="gap-1 text-foreground font-medium h-7 px-2"
        >
          <div className="min-w-0 flex items-center gap-1">
            <span className="text-muted-foreground text-xs truncate max-w-[120px]">
              {selectedOrg?.name ?? orgSlug ?? 'Org'}
            </span>

            <span className="text-foreground truncate max-w-[140px]">
              /
              <span className="ml-1">
                {isTriggerLoading ? <span className="inline-block w-16 h-2" /> : project?.name ?? projectRef ?? 'Project'}
              </span>
            </span>

            {IS_PLATFORM ? (
              <Badge
                variant={isDefaultBranch ? 'default' : 'secondary'}
                className="text-[10px] px-1 py-0 h-4"
              >
                {isDefaultBranch ? 'prod' : 'preview'}
              </Badge>
            ) : null}
          </div>

          <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger_Shadcn_>

      <PopoverContent_Shadcn_ className="w-[760px] p-0" align="start">
        <div className="flex divide-x h-[320px]">
          <div className="flex-1 p-2">
            {isOrgsPending ? (
              <div className="h-full flex items-center">
                <ShimmeringLoader className="h-6 w-24" />
              </div>
            ) : (
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Search organizations..." />
                <CommandList_Shadcn_>
                  <CommandGroup_Shadcn_ heading="Organizations">
                    {organizations?.map((org) => (
                      <CommandItem_Shadcn_
                        key={org.id}
                        value={`${org.name} ${org.slug}`}
                        onSelect={() => handleSelectOrg(org.slug)}
                      >
                        {org.name}
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            )}
          </div>

          <div className="flex-1 p-2">
            {isProjectsPending || !orgSlug ? (
              <div className="h-full flex items-center">
                {orgSlug ? <ShimmeringLoader className="h-6 w-24" /> : <span className="text-xs text-muted-foreground">Select an organization.</span>}
              </div>
            ) : (
              <Command_Shadcn_ shouldFilter={false}>
                <CommandInput_Shadcn_ placeholder="Search projects..." />
                <CommandList_Shadcn_>
                  <CommandGroup_Shadcn_ heading="Projects">
                    {projects.map((proj) => (
                      <CommandItem_Shadcn_
                        key={proj.ref}
                        value={`${proj.name} ${proj.ref}`}
                        onSelect={() => handleSelectProject(proj.ref)}
                      >
                        {proj.name}
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            )}
          </div>

          <div className="flex-1 p-2">
            {!IS_PLATFORM ? (
              <div className="h-full flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                main
              </div>
            ) : isBranchesPending ? (
              <div className="h-full flex items-center">
                <ShimmeringLoader className="h-6 w-24" />
              </div>
            ) : (
              <Command_Shadcn_ shouldFilter={false}>
                <CommandInput_Shadcn_ placeholder="Search branches..." />
                <CommandList_Shadcn_>
                  <CommandGroup_Shadcn_ heading="Branches">
                    {(branches ?? []).map((branch) => (
                      <CommandItem_Shadcn_
                        key={branch.id}
                        value={branch.name.replaceAll('"', '')}
                        onSelect={() => handleSelectBranch(branch.project_ref)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{branch.name}</span>
                          {branch.is_default ? (
                            <Badge variant="default" className="ml-auto text-[10px]">
                              prod
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-auto text-[10px]">
                              preview
                            </Badge>
                          )}
                        </div>
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                  <CommandGroup_Shadcn_ heading="">
                    <CommandItem_Shadcn_
                      onSelect={() => {
                        if (!projectRef) return
                        router.push(`/dashboard/v2/project/${projectRef}/settings/branches`)
                        setOpen(false)
                      }}
                    >
                      Manage branches
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            )}
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

