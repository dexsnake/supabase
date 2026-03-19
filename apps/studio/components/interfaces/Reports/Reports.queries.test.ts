import { describe, expect, it } from 'vitest'

import { generateQueryPerformanceSql } from './Reports.queries'

describe('generateQueryPerformanceSql', () => {
  it('generates sql with no filters', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified' })
    expect(result.sql).toBeDefined()
    expect(result.whereSql).toBe('')
    expect(result.orderBySql).toBeUndefined()
  })

  it('generates ORDER BY clause', () => {
    const result = generateQueryPerformanceSql({
      preset: 'unified',
      orderBy: { column: 'calls', order: 'desc' },
    })
    expect(result.orderBySql).toBe('ORDER BY calls desc')
  })

  it('filters by roles', () => {
    const result = generateQueryPerformanceSql({
      preset: 'unified',
      roles: ['postgres', 'anon'],
    })
    expect(result.whereSql).toContain("auth.rolname in ('postgres', 'anon')")
  })

  it('filters by search query', () => {
    const result = generateQueryPerformanceSql({
      preset: 'unified',
      searchQuery: 'SELECT',
    })
    expect(result.whereSql).toContain("statements.query ~* 'SELECT'")
  })

  it('filters by minCalls', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', minCalls: 10 })
    expect(result.whereSql).toContain('statements.calls >= 10')
  })

  it('does not add minCalls filter when minCalls is 0', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', minCalls: 0 })
    expect(result.whereSql).not.toContain('calls')
  })

  it('filters by minTotalTime', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', minTotalTime: 5000 })
    expect(result.whereSql).toContain(
      '(statements.total_exec_time + statements.total_plan_time) >= 5000'
    )
  })

  it('applies LIMIT and OFFSET for page 1', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 1, pageSize: 20 })
    expect(result.sql).toContain('limit 20 offset 0')
  })

  it('applies correct OFFSET for page 2', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 2, pageSize: 20 })
    expect(result.sql).toContain('limit 20 offset 20')
  })

  it('applies correct OFFSET for page 3 with custom pageSize', () => {
    const result = generateQueryPerformanceSql({ preset: 'unified', page: 3, pageSize: 50 })
    expect(result.sql).toContain('limit 50 offset 100')
  })

  it('combines multiple filters with AND', () => {
    const result = generateQueryPerformanceSql({
      preset: 'unified',
      roles: ['postgres'],
      searchQuery: 'SELECT',
      minCalls: 5,
    })
    expect(result.whereSql).toContain(' AND ')
    expect(result.whereSql).toContain("auth.rolname in ('postgres')")
    expect(result.whereSql).toContain("statements.query ~* 'SELECT'")
    expect(result.whereSql).toContain('statements.calls >= 5')
  })
})
