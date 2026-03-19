'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Input,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useV2DashboardStore } from '@/stores/v2-dashboard'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useTablesQuery } from 'data/tables/tables-query'

export function V2TablesList() {
  const { projectRef } = useV2Params()
  const addDetailTab = useV2DashboardStore((s) => s.addDetailTab)
  const [schema, setSchema] = useState('public')
  const [search, setSearch] = useState('')

  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { data: schemas } = useSchemasQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: Boolean(projectRef) }
  )
  const { data: tables, isPending, isError } = useTablesQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      schema,
      includeColumns: false,
    },
    { enabled: Boolean(projectRef) }
  )

  const filtered = useMemo(() => {
    if (!Array.isArray(tables)) return []
    if (!search.trim()) return tables
    const q = search.toLowerCase()
    return tables.filter((t) => t.name.toLowerCase().includes(q))
  }, [tables, search])

  const base = projectRef ? `/dashboard/v2/project/${projectRef}` : ''

  const handleRowClick = (tableId: string, tableName: string) => {
    const path = `${base}/data/tables/${tableId}`
    addDetailTab({ id: tableId, label: tableName, path })
  }

  if (isError) {
    return (
      <div className="p-4 text-destructive text-sm">Failed to load tables.</div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <Select_Shadcn_ value={schema} onValueChange={setSchema}>
          <SelectTrigger_Shadcn_ className="w-[140px] h-8 text-xs">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            {schemas?.map((s) => (
              <SelectItem_Shadcn_ key={s.name} value={s.name}>
                {s.name}
              </SelectItem_Shadcn_>
            ))}
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
        <Input
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-[200px] h-8 text-xs"
        />
        <span className="text-xs text-muted-foreground ml-auto">
          {Array.isArray(tables) ? tables.length : 0} tables
        </span>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {isPending ? (
          <ShimmeringLoader className="h-8 w-full rounded" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 font-medium">Schema</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((table) => (
                <tr
                  key={table.id}
                  className="border-b border-border/50 hover:bg-sidebar-accent/50"
                >
                  <td className="py-2 pr-4">
                    <Link
                      href={`${base}/data/tables/${table.id}`}
                      onClick={() => handleRowClick(String(table.id), table.name)}
                      className="text-foreground hover:underline"
                    >
                      {table.name}
                    </Link>
                  </td>
                  <td className="py-2 text-muted-foreground">{table.schema ?? schema}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
