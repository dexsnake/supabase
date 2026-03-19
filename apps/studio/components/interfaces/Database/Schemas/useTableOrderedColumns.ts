import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useMemo } from 'react'
import { useUpdateNodeInternals } from 'reactflow'

import { TableNodeColumnData, TableNodeData } from './SchemaTableNode.types'
import { getOrderedColumns } from './SchemaTableNode.utils'

type SetColumnsFunction = (columns: Array<TableNodeColumnData>) => void

export const useTableOrderedColumns = ({
  nodeId,
  projectRef,
  table,
}: {
  nodeId: string
  projectRef: string | undefined
  table: TableNodeData
}): [Array<TableNodeColumnData>, SetColumnsFunction] => {
  const updateNodeInternals = useUpdateNodeInternals()
  const [columns, setColumns] = useLocalStorage<string[] | undefined>(
    LOCAL_STORAGE_KEYS.SCHEMA_VISUALIZER_TABLE_COLUMNS(projectRef as string, table.id),
    undefined
  )

  return useMemo(() => {
    const persistColumns = (columns: Array<TableNodeColumnData>) => {
      setColumns(columns.map((column) => column.id))
      // Ask reactflow to update the node handles (links between nodes)
      updateNodeInternals(nodeId)
    }

    const orderedColumns = getOrderedColumns(table.columns, columns)


    return [orderedColumns, persistColumns]
  }, [columns, nodeId, updateNodeInternals, setColumns, table.columns])
}
