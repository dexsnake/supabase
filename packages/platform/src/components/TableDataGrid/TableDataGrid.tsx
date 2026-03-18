'use client'

import { ArrowUpDown, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import DataGrid, {
  type Column,
  type RenderCellProps,
  type RenderEditCellProps,
} from 'react-data-grid'
import { Button, cn, Input_Shadcn_ } from 'ui'

import type { ColumnInfo } from '../../adapters/types'
import { useAdapter } from '../../context/AdapterContext'
import {
  useDeleteRow,
  useInsertRow,
  useTableColumns,
  useTableRowCount,
  useTableRows,
  useUpdateRow,
} from './hooks'
import { createGridState, useGridSnapshot } from './state'
import { TablePagination } from './TablePagination'

export interface TableDataGridProps {
  tableName: string
  pageSize?: number
}

type Row = Record<string, unknown> & { __idx: number }

export function TableDataGrid({ tableName, pageSize = 25 }: TableDataGridProps) {
  const adapter = useAdapter()
  const [gridState] = useState(() => createGridState())
  const snap = useGridSnapshot(gridState)

  const { data: columns = [], isLoading: columnsLoading } = useTableColumns(adapter, tableName)
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

  const pkColumn = useMemo(() => columns.find((c) => c.isPrimaryKey), [columns])

  const rows: Row[] = useMemo(() => {
    if (!rowResult?.rows) return []
    return rowResult.rows.map((row, idx) => ({ ...row, __idx: idx }))
  }, [rowResult])

  const handleRowsChange = useCallback(
    (newRows: Row[], { indexes }: { indexes: number[] }) => {
      if (!pkColumn) return
      for (const idx of indexes) {
        const newRow = newRows[idx]
        const oldRow = rows[idx]
        if (!newRow || !oldRow) continue

        // Find which column changed
        for (const col of columns) {
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
    [pkColumn, rows, columns, updateRow]
  )

  const handleAddRow = useCallback(() => {
    insertRow.mutate({})
  }, [insertRow])

  const handleDeleteRow = useCallback(
    (row: Row) => {
      if (!pkColumn) return
      deleteRow.mutate({ pkColumn: pkColumn.name, pkValue: row[pkColumn.name] })
    },
    [pkColumn, deleteRow]
  )

  const handleSort = useCallback(
    (columnKey: string) => {
      if (gridState.sortColumn === columnKey) {
        if (gridState.sortAscending) {
          gridState.sortAscending = false
        } else {
          gridState.sortColumn = null
          gridState.sortAscending = true
        }
      } else {
        gridState.sortColumn = columnKey
        gridState.sortAscending = true
      }
      gridState.page = 1
    },
    [gridState]
  )

  const gridColumns: Column<Row>[] = useMemo(() => {
    const cols: Column<Row>[] = columns.map((col) => ({
      key: col.name,
      name: col.name,
      width: col.isPrimaryKey ? 100 : undefined,
      minWidth: 80,
      resizable: true,
      sortable: true,
      editable: !!pkColumn,
      renderHeaderCell: (props) => (
        <SortableHeader
          column={col}
          sortColumn={snap.sortColumn}
          sortAscending={snap.sortAscending}
          onSort={handleSort}
        >
          {props.column.name}
        </SortableHeader>
      ),
      renderCell: (props: RenderCellProps<Row>) => <CellRenderer value={props.row[col.name]} />,
      renderEditCell: pkColumn
        ? (props: RenderEditCellProps<Row>) => (
            <CellEditor
              value={props.row[col.name]}
              dataType={col.dataType}
              onCommit={(val) => {
                props.onRowChange({ ...props.row, [col.name]: val }, true)
              }}
              onClose={() => props.onClose(false)}
            />
          )
        : undefined,
    }))

    // Action column (delete)
    if (pkColumn) {
      cols.push({
        key: '__actions',
        name: '',
        width: 44,
        minWidth: 44,
        resizable: false,
        sortable: false,
        renderCell: (props: RenderCellProps<Row>) => (
          <div className="flex items-center justify-center h-full">
            <button
              className="text-foreground-lighter hover:text-destructive-600 transition-colors p-1"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteRow(props.row)
              }}
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        ),
      })
    }

    return cols
  }, [columns, pkColumn, snap.sortColumn, snap.sortAscending, handleSort, handleDeleteRow])

  const isLoading = columnsLoading || rowsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-foreground-lighter">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="relative flex-1">
          <Search
            size={14}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-lighter"
          />
          <Input_Shadcn_
            className="h-[30px] pl-8 text-sm bg-transparent border-none shadow-none"
            placeholder="Filter by id, content... or ask AI"
          />
        </div>
        <Button type="text" size="tiny" icon={<ArrowUpDown size={14} strokeWidth={1.5} />}>
          Sort
        </Button>
        <Button
          type="primary"
          size="tiny"
          icon={<Plus size={14} strokeWidth={1.5} />}
          onClick={handleAddRow}
          disabled={!pkColumn}
        >
          Insert
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        <DataGrid
          columns={gridColumns}
          rows={rows}
          rowKeyGetter={(row) => row.__idx}
          onRowsChange={handleRowsChange}
          className="h-full rdg-light"
          style={{ blockSize: '100%' }}
        />
      </div>

      {/* Pagination */}
      <TablePagination
        page={snap.page}
        pageSize={pageSize}
        totalRows={totalRows}
        onPageChange={(p) => {
          gridState.page = p
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortableHeader({
  column,
  sortColumn,
  sortAscending,
  onSort,
  children,
}: {
  column: ColumnInfo
  sortColumn: string | null
  sortAscending: boolean
  onSort: (key: string) => void
  children: React.ReactNode
}) {
  const isSorted = sortColumn === column.name

  return (
    <button
      className="flex items-center gap-1 w-full h-full text-left font-medium"
      onClick={() => onSort(column.name)}
    >
      <span className="truncate">{children}</span>
      {column.isPrimaryKey && (
        <span className="text-xs text-foreground-lighter" title="Primary key">
          PK
        </span>
      )}
      {isSorted && <span className="text-xs">{sortAscending ? '↑' : '↓'}</span>}
    </button>
  )
}

function CellRenderer({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-foreground-lighter italic">NULL</span>
  }
  if (typeof value === 'object') {
    return <span className="font-mono text-xs">{JSON.stringify(value)}</span>
  }
  return <span>{String(value)}</span>
}

function CellEditor({
  value,
  dataType,
  onCommit,
  onClose,
}: {
  value: unknown
  dataType: string
  onCommit: (val: unknown) => void
  onClose: () => void
}) {
  const [editValue, setEditValue] = useState(value === null ? '' : String(value))

  const commit = () => {
    const upper = dataType.toUpperCase()
    let parsed: unknown = editValue

    if (editValue === '') {
      parsed = null
    } else if (upper === 'INTEGER' || upper === 'INT' || upper === 'BIGINT') {
      parsed = parseInt(editValue, 10)
      if (isNaN(parsed as number)) parsed = editValue
    } else if (upper === 'REAL' || upper === 'FLOAT' || upper === 'DOUBLE') {
      parsed = parseFloat(editValue)
      if (isNaN(parsed as number)) parsed = editValue
    }

    onCommit(parsed)
  }

  return (
    <input
      autoFocus
      className="w-full h-full px-2 bg-background border-0 outline-none text-sm"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onClose()
      }}
    />
  )
}
