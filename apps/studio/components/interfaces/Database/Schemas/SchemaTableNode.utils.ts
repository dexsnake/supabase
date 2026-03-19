import { TableNodeColumnData } from "./SchemaTableNode.types"

export const getOrderedColumns = (tableColumns: Array<TableNodeColumnData>, persistedColumnIdsOrder: Array<string> | undefined) => {
  if (!persistedColumnIdsOrder) {
    return tableColumns
  }

  const columnsById: Record<string, TableNodeColumnData> = {}
  tableColumns.forEach((column) => {
    columnsById[column.id] = column
  })

  // The original table may have been modified (columns added or removed)
  // Make sure to remove columns that don't exist anymore from the persisted ones
  const cleanColumns = persistedColumnIdsOrder.filter((columnId) =>
    tableColumns.some((column) => column.id === columnId)
  )

  // Make sure we add the new columns at the end of the persisted ones if needed
  const missingColumns = tableColumns.filter((column) => !cleanColumns.includes(column.id))
  const orderedColumns = cleanColumns
    .map((columnId) => columnsById[columnId])
    .concat(missingColumns)

  return orderedColumns
}
