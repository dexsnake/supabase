import { useInfiniteQuery } from '@tanstack/react-query'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { executeSql } from 'data/sql/execute-sql-query'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

import { PRESET_CONFIG } from '../Reports/Reports.constants'
import { Presets } from '../Reports/Reports.types'
import { QueryPerformanceRow, QueryPerformanceSQLParams } from './QueryPerformance.types'

export function generateQueryPerformanceSql({
  preset,
  orderBy,
  searchQuery = '',
  roles = [],
  sources = [],
  minCalls = 0,
  minTotalTime = 0,
  runIndexAdvisor = false,
  filterIndexAdvisor = false,
  page = 1,
  pageSize = 20,
}: QueryPerformanceSQLParams) {
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(Math.max(1, pageSize), 100)

  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const orderBySql = orderBy && `ORDER BY ${orderBy.column} ${orderBy.order}`

  const whereConditions = []
  if (roles.length > 0) {
    whereConditions.push(`auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`)
  }
  if (searchQuery.length > 0) {
    whereConditions.push(`statements.query ~* '${searchQuery}'`)
  }
  if (sources.includes('dashboard') && !sources.includes('non-dashboard')) {
    whereConditions.push(`statements.query ~* 'source: dashboard'`)
  }
  if (sources.includes('non-dashboard') && !sources.includes('dashboard')) {
    whereConditions.push(`statements.query !~* 'source: dashboard'`)
  }
  if (minCalls > 0) {
    whereConditions.push(`statements.calls >= ${minCalls}`)
  }
  if (minTotalTime > 0) {
    whereConditions.push(
      `(statements.total_exec_time + statements.total_plan_time) >= ${minTotalTime}`
    )
  }

  const whereSql = whereConditions.join(' AND ')

  const sql = baseSQL.sql(
    [],
    whereSql.length > 0 ? `WHERE ${whereSql}` : undefined,
    orderBySql,
    runIndexAdvisor,
    filterIndexAdvisor,
    safePage,
    safePageSize
  )

  return { sql, whereSql, orderBySql }
}

export const useQueryPerformanceQuery = (props: QueryPerformanceSQLParams) => {
  const { sql, whereSql, orderBySql } = generateQueryPerformanceSql(props)
  return useDbQuery({ sql, params: undefined, where: whereSql, orderBy: orderBySql })
}

export interface QueryPerformanceInfiniteHook {
  data: QueryPerformanceRow[] | undefined
  isLoading: boolean
  isRefetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  error: unknown
  fetchNextPage: () => void
  refetch: () => void
  resolvedSql: string
}

export const useQueryPerformanceInfiniteQuery = (
  props: Omit<QueryPerformanceSQLParams, 'page'>
): QueryPerformanceInfiniteHook => {
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: project?.ref })
  const connectionString = (databases || []).find(
    (db) => db.identifier === state.selectedDatabaseId
  )?.connectionString

  const pageSize = props.pageSize ?? 20
  const { sql: page1Sql } = generateQueryPerformanceSql({ ...props, page: 1, pageSize })

  const {
    data,
    isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      'projects',
      project?.ref,
      'query-performance-infinite',
      { ...props, pageSize, identifier: state.selectedDatabaseId },
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const { sql } = generateQueryPerformanceSql({ ...props, page: pageParam, pageSize })
      return executeSql(
        {
          projectRef: project?.ref,
          connectionString: connectionString || project?.connectionString,
          sql,
        },
        signal
      ).then((res) => res.result as QueryPerformanceRow[])
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < pageSize ? undefined : allPages.length + 1
    },
    enabled: Boolean(project?.ref),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    data: data?.pages.flatMap((page) => page) ?? undefined,
    isLoading: isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    error,
    fetchNextPage,
    refetch,
    resolvedSql: page1Sql,
  }
}
