import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrganizationDeleteMutation } from 'data/organizations/organization-delete-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import {
  useOrgProjectsInfiniteQuery,
  getComputeSize,
} from 'data/projects/org-projects-infinite-query'

import { Checkbox_Shadcn_ } from 'ui'

export const DeleteOrganizationButton = () => {
  const router = useRouter()

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { slug: orgSlug, name: orgName } = selectedOrganization ?? {}

  const { data: projectsData, isLoading, isError } = useOrgProjectsInfiniteQuery({ slug: orgSlug })

  const projects = projectsData?.pages.flatMap((page) => page.projects ?? []) ?? []

  const MAX_PROJECT_ACKNOWLEDGEMENTS = 10

  const shouldRenderChecklist =
    projects.length > 0 && projects.length <= MAX_PROJECT_ACKNOWLEDGEMENTS

  const exceedsLimit = projects.length > MAX_PROJECT_ACKNOWLEDGEMENTS

  const [checkedProjects, setCheckedProjects] = useState<Record<string, boolean>>({})
  const [acknowledgedAll, setAcknowledgedAll] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCheckedProjects({})
      setAcknowledgedAll(false)
    }
  }, [isOpen, orgSlug])

  const toggleProject = (ref: string) => {
    setCheckedProjects((prev) => ({
      ...prev,
      [ref]: !prev[ref],
    }))
  }

  const allChecked =
    projects.length === 0 ||
    (shouldRenderChecklist && projects.every((p) => checkedProjects[p.ref])) ||
    (exceedsLimit && acknowledgedAll)

  const [_, setLastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { can: canDeleteOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const { mutate: deleteOrganization, isPending: isDeleting } = useOrganizationDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${orgName}`)
      setLastVisitedOrganization('')
      router.push('/organizations')
    },
  })

  const onConfirmDelete = () => {
    if (!canDeleteOrganization) {
      toast.error('You do not have permission to delete this organization')
      return
    }

    if (!orgSlug) {
      console.error('Org slug is required')
      return
    }

    if (isLoading) {
      toast.error('Projects are still loading, please wait')
      return
    }

    if (isError) {
      toast.error('Failed to load projects')
      return
    }

    if (!allChecked) {
      toast.error('Please acknowledge all projects before deleting the organization')
      return
    }

    deleteOrganization({ slug: orgSlug })
  }

  return (
    <>
      <div className="mt-2">
        <ButtonTooltip
          type="danger"
          disabled={!canDeleteOrganization || !orgSlug}
          loading={!orgSlug}
          onClick={() => setIsOpen(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canDeleteOrganization
                ? 'You need additional permissions to delete this organization'
                : undefined,
            },
          }}
        >
          Delete organization
        </ButtonTooltip>
      </div>

      <TextConfirmModal
        visible={isOpen}
        size="small"
        variant="destructive"
        title="Delete organization"
        loading={isDeleting}
        confirmString={orgSlug ?? ''}
        confirmPlaceholder="Enter the string above"
        confirmLabel="I understand, delete this organization"
        onConfirm={onConfirmDelete}
        onCancel={() => setIsOpen(false)}
      >
        {/* Small org → checklist */}
        {shouldRenderChecklist && (
          <>
            <p className="mb-2 text-sm text-foreground-lighter">
              Acknowledge each project that will be deleted:
            </p>

            <div className="mt-4 overflow-hidden rounded-md border border-default">
              {projects.map((project, i) => (
                <label
                  key={project.ref}
                  className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-surface-200 ${
                    i !== projects.length - 1 ? 'border-b border-default' : ''
                  }`}
                >
                  <Checkbox_Shadcn_
                    className="mt-[2px]"
                    checked={!!checkedProjects[project.ref]}
                    onCheckedChange={() => toggleProject(project.ref)}
                  />

                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-foreground">{project.name}</span>
                    <span className="text-xs text-foreground-lighter">
                      {getComputeSize(project) ?? 'Unknown'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Large org → single acknowledgement */}
        {exceedsLimit && (
          <div className="mt-4 rounded-md border border-warning bg-warning/5 px-3 py-3">
            <p className="text-sm text-foreground">
              This organization contains more than {MAX_PROJECT_ACKNOWLEDGEMENTS} projects.
            </p>

            <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
              <Checkbox_Shadcn_
                checked={acknowledgedAll}
                onCheckedChange={() => setAcknowledgedAll((prev) => !prev)}
              />
              I understand that all projects will be permanently deleted.
            </label>
          </div>
        )}

        {/* Final warning */}
        <p className={`text-sm text-foreground-lighter ${projects.length > 0 ? 'mt-4' : ''}`}>
          This action <span className="text-foreground">cannot</span> be undone. This will
          permanently delete the <span className="text-foreground">{orgName}</span> organization and
          remove all of its projects.
        </p>
      </TextConfirmModal>
    </>
  )
}
