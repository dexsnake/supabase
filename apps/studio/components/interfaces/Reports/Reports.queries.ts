import useDbQuery from 'hooks/analytics/useDbQuery'

import { PRESET_CONFIG } from './Reports.constants'
import { Presets } from './Reports.types'

export type QueryPerformanceSort = {
  column:
    | 'query'
    | 'rolname'
    | 'total_time'
    | 'prop_total_time'
    | 'calls'
    | 'avg_rows'
    | 'max_time'
    | 'mean_time'
    | 'min_time'
  order: 'asc' | 'desc'
}

export type QueryPerformanceQueryOpts = {
  preset:
    | 'mostFrequentlyInvoked'
    | 'mostTimeConsuming'
    | 'slowestExecutionTime'
    | 'queryHitRate'
    | 'unified'
    | 'slowQueriesCount'
    | 'queryMetrics'
  searchQuery?: string
  orderBy?: QueryPerformanceSort
  roles?: string[]
  runIndexAdvisor?: boolean
  minCalls?: number
  minTotalTime?: number
  filterIndexAdvisor?: boolean
  page?: number
  pageSize?: number
}

export function generateQueryPerformanceSql({
  preset,
  orderBy,
  searchQuery = '',
  roles = [],
  runIndexAdvisor = false,
  minCalls,
  minTotalTime,
  filterIndexAdvisor = false,
  page = 1,
  pageSize = 20,
}: QueryPerformanceQueryOpts) {
  const queryPerfQueries = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const baseSQL = queryPerfQueries.queries[preset]

  const whereConditions: string[] = []
  if (roles.length > 0) {
    whereConditions.push(`auth.rolname in (${roles.map((r) => `'${r}'`).join(', ')})`)
  }
  if (searchQuery.length > 0) {
    whereConditions.push(`statements.query ~* '${searchQuery}'`)
  }
  if (typeof minCalls === 'number' && minCalls > 0) {
    whereConditions.push(`statements.calls >= ${minCalls}`)
  }
  if (typeof minTotalTime === 'number' && minTotalTime > 0) {
    whereConditions.push(`(statements.total_exec_time + statements.total_plan_time) >= ${minTotalTime}`)
  }

  const whereSql = whereConditions.join(' AND ')
  const orderBySql = orderBy && `ORDER BY ${orderBy.column} ${orderBy.order}`
  const sql = baseSQL.sql(
    [],
    whereSql.length > 0 ? `WHERE ${whereSql}` : undefined,
    orderBySql,
    runIndexAdvisor,
    filterIndexAdvisor,
    page,
    pageSize
  )

  return { sql, whereSql, orderBySql }
}

export const useQueryPerformanceQuery = (opts: QueryPerformanceQueryOpts) => {
  const { sql, whereSql, orderBySql } = generateQueryPerformanceSql(opts)
  return useDbQuery({ sql, params: undefined, where: whereSql, orderBy: orderBySql })
}
