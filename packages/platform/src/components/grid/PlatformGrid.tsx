'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import DataGrid from 'react-data-grid'
import { cn, TooltipProvider } from 'ui'

import { useAdapter } from '../../context/AdapterContext'
import type { ColumnInfo } from '../../adapters/types'
import {
  useDeleteRow,
  useInsertRow,
  useTableColumns,
  useTableRowCount,
  useTableRows,
  useUpdateRow,
} from './hooks'
import { PlatformGridPagination } from './PlatformGridPagination'
import { createGridState, useGridSnapshot } from './state'
import type { SupaColumn, SupaRow, SupaTable } from './types'
import { getGridColumns } from './utils/gridColumns'

export interface PlatformGridContext {
  tableName: string
  columns: ColumnInfo[]
  rows: SupaRow[]
  selectedRows: ReadonlySet<number>
  totalRows: number
  pkColumn: ColumnInfo | undefined
  onAddRow: () => void
  onDeleteSelected: () => void
}

export interface PlatformGridProps {
  tableName: string
  pageSize?: number
  toolbar?: (ctx: PlatformGridContext) => ReactNode
}

export function PlatformGrid({ tableName, pageSize = 100, toolbar }: PlatformGridProps) {
  const adapter = useAdapter()
  const [gridState] = useState(() => createGridState())
  const snap = useGridSnapshot(gridState)
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<number>>(new Set())

  const { data: adapterColumns = [], isLoading: columnsLoading } = useTableColumns(
    adapter,
    tableName
  )
  const { data: rowResult, isLoading: rowsLoading } = useTableRows(adapter, tableName, {
    page: snap.page,
    pageSize,
    sortColumn: snap.sortColumn,
    sortAscending: snap.sortAscending,
  })
  const { data: totalRows = 0 } = useTableRowCount(adapter, tableName)

  const updateRow = useUpdateRow(adapter, tableName)
  const insertRow = useInsertRow(adapter, tableName)
  const deleteRow = useDeleteRow(adapter, tableName)

  // Build SupaTable from adapter columns
  const supaTable: SupaTable | null = useMemo(() => {
    if (adapterColumns.length === 0) return null
    const columns: SupaColumn[] = adapterColumns.map((col, idx) => ({
      dataType: col.dataType,
      format: col.dataType,
      name: col.name,
      comment: col.comment,
      defaultValue: col.defaultValue,
      isPrimaryKey: col.isPrimaryKey,
      isNullable: col.isNullable,
      isUpdatable: true,
      position: idx,
    }))
    return {
      id: 0,
      columns,
      name: tableName,
      schema: 'main',
      estimateRowCount: totalRows,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
    }
  }, [adapterColumns, tableName, totalRows])

  // Build rows with idx
  const rows: SupaRow[] = useMemo(() => {
    if (!rowResult?.rows) return []
    return rowResult.rows.map((row, idx) => ({ ...row, idx }))
  }, [rowResult])

  // Build react-data-grid columns from SupaTable
  const gridColumns = useMemo(() => {
    if (!supaTable) return []
    return getGridColumns(supaTable, { editable: true })
  }, [supaTable])

  const pkColumn = useMemo(() => adapterColumns.find((c) => c.isPrimaryKey), [adapterColumns])

  const handleRowsChange = useCallback(
    (newRows: SupaRow[], { indexes }: { indexes: number[] }) => {
      if (!pkColumn) return
      for (const idx of indexes) {
        const newRow = newRows[idx]
        const oldRow = rows[idx]
        if (!newRow || !oldRow) continue

        for (const col of adapterColumns) {
          if (newRow[col.name] !== oldRow[col.name]) {
            updateRow.mutate({
              pkColumn: pkColumn.name,
              pkValue: oldRow[pkColumn.name],
              column: col.name,
              value: newRow[col.name],
            })
            break
          }
        }
      }
    },
    [pkColumn, rows, adapterColumns, updateRow]
  )

  const handleAddRow = useCallback(() => {
    insertRow.mutate({})
  }, [insertRow])

  const handleDeleteSelected = useCallback(() => {
    if (!pkColumn) return
    for (const idx of selectedRows) {
      const row = rows[idx]
      if (row) {
        deleteRow.mutate({ pkColumn: pkColumn.name, pkValue: row[pkColumn.name] })
      }
    }
    setSelectedRows(new Set())
  }, [pkColumn, selectedRows, rows, deleteRow])

  const rowKeyGetter = useCallback((row: SupaRow) => row.idx, [])

  const isLoading = columnsLoading || rowsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-foreground-lighter">
        Loading...
      </div>
    )
  }

  const gridContext: PlatformGridContext = {
    tableName,
    columns: adapterColumns,
    rows,
    selectedRows,
    totalRows,
    pkColumn,
    onAddRow: handleAddRow,
    onDeleteSelected: handleDeleteSelected,
  }

  return (
    <TooltipProvider>
      <div className="sb-grid flex flex-col h-full">
        {/* Toolbar — provided by the consuming app */}
        {toolbar && toolbar(gridContext)}

        {/* Grid */}
        <div className="flex-1 overflow-hidden">
          <DataGrid
            columns={gridColumns}
            rows={rows}
            rowKeyGetter={rowKeyGetter}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
            onRowsChange={handleRowsChange}
            className="h-full"
            style={{ blockSize: '100%' }}
            rowClass={(row) =>
              cn(
                'rdg-row',
                '__isDeleted' in row && 'rdg-row--deleted',
                '__tempId' in row && 'rdg-row--added'
              )
            }
          />
        </div>

        {/* Pagination */}
        <PlatformGridPagination
          page={snap.page}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={(p) => {
            gridState.page = p
          }}
        />
      </div>
    </TooltipProvider>
  )
}
