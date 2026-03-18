import { Checkbox_Shadcn_ } from 'ui'
import { getComputeSize } from 'data/projects/org-projects-infinite-query'
import type { OrgProject } from 'data/projects/org-projects-infinite-query'

type Props = {
  projects: OrgProject[]
  checkedProjects: Record<string, boolean>
  toggleProject: (ref: string) => void
}

export const DeleteOrganizationButtonListAck = ({
  projects,
  checkedProjects,
  toggleProject,
}: Props) => {
  return (
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
  )
}
