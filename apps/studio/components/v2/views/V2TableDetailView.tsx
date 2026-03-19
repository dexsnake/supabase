'use client'

import { useParams } from 'next/navigation'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'

export function V2TableDetailView({ subTab }: { subTab: string }) {
  const params = useParams()
  const { projectRef } = useV2Params()
  const tableId = params?.tableId as string
  const id = tableId ? Number(tableId) : undefined

  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { data: table, isPending, isError } = useTableEditorQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      id,
    },
    { enabled: Boolean(projectRef) && typeof id === 'number' && !Number.isNaN(id) }
  )

  if (isError) {
    return (
      <div className="p-4 text-destructive text-sm">Failed to load table.</div>
    )
  }
  if (isPending || !table) {
    return <ShimmeringLoader className="m-4 h-8 rounded" />
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-medium text-foreground mb-2">
        {table.schema}.{table.name} — {subTab}
      </h2>
      <p className="text-sm text-muted-foreground">
        Content for {subTab} will use existing components (e.g. data grid, schema editor, policy editor).
      </p>
    </div>
  )
}
