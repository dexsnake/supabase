'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DatabaseAdapter, ColumnInfo } from '../../adapters/types'

export function useTableColumns(adapter: DatabaseAdapter, tableName: string) {
  return useQuery({
    queryKey: ['columns', tableName],
    queryFn: () => adapter.getColumns(tableName),
    enabled: !!tableName,
  })
}

export function useTableRows(
  adapter: DatabaseAdapter,
  tableName: string,
  options: {
    page: number
    pageSize: number
    sortColumn: string | null
    sortAscending: boolean
  }
) {
  const { page, pageSize, sortColumn, sortAscending } = options
  const offset = (page - 1) * pageSize

  return useQuery({
    queryKey: ['rows', tableName, page, pageSize, sortColumn, sortAscending],
    queryFn: async () => {
      let q = adapter.from(tableName).select()
      if (sortColumn) {
        q = q.order(sortColumn, { ascending: sortAscending })
      }
      q = q.range(offset, offset + pageSize - 1)
      return q.execute()
    },
    enabled: !!tableName,
  })
}

export function useTableRowCount(adapter: DatabaseAdapter, tableName: string) {
  return useQuery({
    queryKey: ['row-count', tableName],
    queryFn: async () => {
      const tables = await adapter.getTables()
      const table = tables.find((t) => t.name === tableName)
      return table?.rowCount ?? 0
    },
    enabled: !!tableName,
  })
}

export function useUpdateRow(adapter: DatabaseAdapter, tableName: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pkColumn,
      pkValue,
      column,
      value,
    }: {
      pkColumn: string
      pkValue: unknown
      column: string
      value: unknown
    }) => {
      return adapter.from(tableName).update({ [column]: value }).eq(pkColumn, pkValue).execute()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', tableName] })
      queryClient.invalidateQueries({ queryKey: ['row-count', tableName] })
    },
  })
}

export function useInsertRow(adapter: DatabaseAdapter, tableName: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      return adapter.from(tableName).insert(values).execute()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', tableName] })
      queryClient.invalidateQueries({ queryKey: ['row-count', tableName] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}

export function useDeleteRow(adapter: DatabaseAdapter, tableName: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pkColumn, pkValue }: { pkColumn: string; pkValue: unknown }) => {
      return adapter.from(tableName).delete().eq(pkColumn, pkValue).execute()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rows', tableName] })
      queryClient.invalidateQueries({ queryKey: ['row-count', tableName] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
