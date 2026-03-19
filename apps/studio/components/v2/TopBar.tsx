'use client'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Button, cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { V2BranchSelector } from './V2BranchSelector'
import { V2OrgProjectSelector } from './V2OrgProjectSelector'
import { useV2Params } from '@/app/v2/V2ParamsContext'

export function TopBar() {
  const { orgSlug, projectRef } = useV2Params()
  const { data: org } = useOrganizationsQuery({
    enabled: true,
    select: (data) => data.find((o) => o.slug === orgSlug),
  })
  const { data: project, isPending: loadingProject } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  return (
    <header
      className={cn(
        'h-11 md:h-12 flex items-center justify-between px-2 border-b border-border bg-dash-sidebar shrink-0'
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <V2OrgProjectSelector />
        {loadingProject || !project ? (
          <ShimmeringLoader className="h-5 w-24" />
        ) : (
          <V2BranchSelector />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="default"
          size="tiny"
          className="text-muted-foreground border border-border rounded px-2 py-1 text-xs"
        >
          Search ⌘K
        </Button>
      </div>
    </header>
  )
}
