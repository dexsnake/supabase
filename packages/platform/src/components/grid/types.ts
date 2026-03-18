import type { CalculatedColumn, RenderHeaderCellProps } from 'react-data-grid'

// ---------------------------------------------------------------------------
// Column & Table types — extracted from studio's grid/types/
// ---------------------------------------------------------------------------

export type ColumnType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'foreign_key'
  | 'json'
  | 'number'
  | 'primary_key'
  | 'text'
  | 'citext'
  | 'time'
  | 'binary'
  | 'unknown'

export interface GridForeignKey {
  targetTableSchema?: string | null
  targetTableName?: string | null
  targetColumnName?: string | null
  deletionAction?: string
  updateAction?: string
}

export interface ColumnHeaderProps<R> extends RenderHeaderCellProps<R> {
  columnType: ColumnType
  isPrimaryKey: boolean | undefined
  isEncrypted: boolean | undefined
  format: string
  foreignKey?: GridForeignKey
  comment?: string | null
}

export interface DragItem {
  index: number
  key: string
}

export interface SavedState {
  filters?: string[]
  sorts?: string[]
  gridColumns: CalculatedColumn<any, any>[]
}

// ---------------------------------------------------------------------------
// Table / Column / Row types
// ---------------------------------------------------------------------------

export interface SupaColumn {
  readonly dataType: string
  readonly format: string
  readonly name: string
  readonly comment?: string | null
  readonly defaultValue?: string | null
  readonly enum?: string[] | null
  readonly isPrimaryKey?: boolean
  readonly isIdentity?: boolean
  readonly isGeneratable?: boolean
  readonly isNullable?: boolean
  readonly isUpdatable?: boolean
  readonly isEncrypted?: boolean
  readonly foreignKey?: GridForeignKey
  position: number
}

export interface SupaTable {
  readonly id: number
  readonly columns: SupaColumn[]
  readonly name: string
  readonly schema?: string | null
  readonly comment?: string | null
  readonly estimateRowCount: number
  readonly primaryKey?: string[]
  readonly uniqueIndexes?: string[][]
}

export interface SupaRow {
  readonly idx: number
  [key: string]: any
}

// Row markers for queue operations
export type PendingAddRow = SupaRow & { __tempId: string }
export type PendingDeleteRow = SupaRow & { __isDeleted: true }

export function isPendingAddRow(row: SupaRow): row is PendingAddRow {
  return '__tempId' in row && typeof (row as PendingAddRow).__tempId === 'string'
}

export function isPendingDeleteRow(row: SupaRow): row is PendingDeleteRow {
  return '__isDeleted' in row && (row as PendingDeleteRow).__isDeleted === true
}

// ---------------------------------------------------------------------------
// Grid props
// ---------------------------------------------------------------------------

export interface GridProps {
  width?: string | number
  height?: string | number
  containerClass?: string
  gridClass?: string
  rowClass?: ((row: SupaRow, index: number) => string | undefined) | undefined
}
