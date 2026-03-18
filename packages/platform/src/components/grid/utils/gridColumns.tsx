// Adapted from apps/studio/components/grid/utils/gridColumns.tsx
// Removed: ForeignKeyFormatter, BinaryFormatter, complex editors (DateTimeEditor, etc.)
// Simplified editors to basic inline input for Phase 1

import type { CalculatedColumn, RenderCellProps } from 'react-data-grid'

import { BooleanFormatter } from '../components/BooleanFormatter'
import { DefaultFormatter } from '../components/DefaultFormatter'
import { DefaultValue } from '../components/DefaultValue'
import { JsonFormatter } from '../components/JsonFormatter'
import { NullValue } from '../components/NullValue'
import { ColumnHeader } from '../components/ColumnHeader'
import { SelectColumn } from '../components/SelectColumn'
import { COLUMN_MIN_WIDTH, ESTIMATED_CHARACTER_PIXEL_WIDTH } from '../constants'
import { isPendingAddRow, type ColumnType, type SupaColumn, type SupaRow, type SupaTable } from '../types'
import {
  isArrayColumn,
  isBinaryColumn,
  isBoolColumn,
  isCiTextColumn,
  isDateColumn,
  isDateTimeColumn,
  isEnumColumn,
  isForeignKeyColumn,
  isJsonColumn,
  isNumericalColumn,
  isTextColumn,
  isTimeColumn,
} from './columnTypes'

export function getGridColumns(
  table: SupaTable,
  options?: {
    editable?: boolean
    defaultWidth?: string | number
  }
): any[] {
  const columns = table.columns.map((x, idx) => {
    const columnType = getColumnType(x)
    const columnDefaultWidth = getColumnDefaultWidth(x)
    const columnWidthBasedOnName =
      (x.name.length + x.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
    const columnWidth = options?.defaultWidth
      ? options.defaultWidth
      : columnDefaultWidth < columnWidthBasedOnName
        ? columnWidthBasedOnName
        : columnDefaultWidth

    const columnDefinition: CalculatedColumn<SupaRow> = {
      key: x.name,
      name: x.name,
      idx: idx + 1,
      resizable: true,
      sortable: true,
      width: columnWidth,
      minWidth: COLUMN_MIN_WIDTH,
      frozen: false,
      renderHeaderCell: (props) => (
        <ColumnHeader
          {...props}
          columnType={columnType}
          isPrimaryKey={x.isPrimaryKey}
          isEncrypted={x.isEncrypted}
          format={x.format}
          foreignKey={x.foreignKey}
          comment={x.comment}
        />
      ),
      renderCell: getCellRenderer(x, columnType),
      // Editing is handled at the PlatformGrid level via onRowsChange
      renderEditCell: undefined,

      parent: undefined,
      level: 0,
      maxWidth: undefined,
      draggable: false,
    }

    return columnDefinition
  })

  return [SelectColumn, ...columns]
}

function withPendingAddPlaceholders(
  Formatter: React.ComponentType<RenderCellProps<SupaRow, unknown>>,
  columnDef: SupaColumn
) {
  return function PendingAwareFormatter(props: RenderCellProps<SupaRow, unknown>) {
    const value = props.row[props.column.key]

    if (isPendingAddRow(props.row) && (value === undefined || value === null || value === '')) {
      if (columnDef.defaultValue !== undefined && columnDef.defaultValue !== null) {
        return <DefaultValue />
      }
      if (columnDef.isIdentity || columnDef.isGeneratable) {
        return <DefaultValue />
      }
      if (columnDef.isNullable) {
        return <NullValue />
      }
    }

    return <Formatter {...props} />
  }
}

function getCellRenderer(columnDef: SupaColumn, columnType: ColumnType) {
  let formatter: React.ComponentType<RenderCellProps<SupaRow, unknown>>

  switch (columnType) {
    case 'boolean': {
      formatter = BooleanFormatter
      break
    }
    case 'json':
    case 'array': {
      formatter = JsonFormatter
      break
    }
    default: {
      formatter = DefaultFormatter
    }
  }

  return withPendingAddPlaceholders(formatter, columnDef)
}

export function getColumnType(columnDef: SupaColumn): ColumnType {
  if (isForeignKeyColumn(columnDef)) {
    return 'foreign_key'
  } else if (isNumericalColumn(columnDef.dataType)) {
    return 'number'
  } else if (isArrayColumn(columnDef.dataType)) {
    return 'array'
  } else if (isJsonColumn(columnDef.dataType)) {
    return 'json'
  } else if (isTextColumn(columnDef.dataType)) {
    return 'text'
  } else if (isCiTextColumn(columnDef.format)) {
    return 'citext'
  } else if (isDateColumn(columnDef.format)) {
    return 'date'
  } else if (isTimeColumn(columnDef.format)) {
    return 'time'
  } else if (isDateTimeColumn(columnDef.format)) {
    return 'datetime'
  } else if (isBoolColumn(columnDef.dataType)) {
    return 'boolean'
  } else if (isEnumColumn(columnDef.dataType)) {
    return 'enum'
  } else if (isBinaryColumn(columnDef.dataType)) {
    return 'binary'
  } else return 'unknown'
}

export function getColumnDefaultWidth(columnDef: SupaColumn): number {
  if (isNumericalColumn(columnDef.dataType)) {
    return 120
  } else if (
    isDateTimeColumn(columnDef.format) ||
    isDateColumn(columnDef.format) ||
    isTimeColumn(columnDef.format)
  ) {
    return 150
  } else if (isBoolColumn(columnDef.dataType)) {
    return 120
  } else if (isEnumColumn(columnDef.dataType)) {
    return 150
  } else return 250
}
