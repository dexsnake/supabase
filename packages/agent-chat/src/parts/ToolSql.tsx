'use client'

import { useEffect, useMemo, useState } from 'react'

import type {
  AgentChatSql,
  AgentChatSqlEditorRender,
  AgentChatSqlPoint,
  AgentChatSqlRunners,
  AgentChatSqlRunResult,
} from '../types'
import {
  Button_Shadcn_ as Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  TextArea_Shadcn_ as TextArea,
} from 'ui'

type ToolSqlState =
  | { status: 'idle'; rows: AgentChatSqlPoint[]; error?: undefined }
  | { status: 'running'; rows: AgentChatSqlPoint[]; error?: undefined }
  | { status: 'success'; rows: AgentChatSqlPoint[]; error?: undefined }
  | { status: 'error'; rows: AgentChatSqlPoint[]; error: string }

const DEFAULT_STATE: ToolSqlState = { status: 'idle', rows: [] }

export const ToolSql = ({
  sql,
  sqlRunners,
  renderEditor,
}: {
  sql: AgentChatSql
  sqlRunners?: AgentChatSqlRunners
  renderEditor?: AgentChatSqlEditorRender
}) => {
  const [value, setValue] = useState(sql.defaultValue ?? '')
  const [state, setState] = useState<ToolSqlState>(DEFAULT_STATE)
  const runner = sql.source === 'logs' ? sqlRunners?.logs : sqlRunners?.database

  useEffect(() => {
    setValue(sql.defaultValue ?? '')
    setState(DEFAULT_STATE)
  }, [sql])

  const chartState = useMemo(() => getChartState(state.rows, sql.chartConfig), [
    state.rows,
    sql.chartConfig,
  ])

  const handleRun = async () => {
    if (!runner) return

    setState({ status: 'running', rows: [] })

    try {
      const result = await runner({ ...sql, sql: value })
      setState(normalizeRunResult(result))
    } catch (error) {
      setState({
        status: 'error',
        rows: [],
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      })
    }
  }

  const editor = renderEditor ? (
    renderEditor({
      payload: sql,
      value,
      disabled: state.status === 'running' || !runner,
      onChange: setValue,
      onRun: handleRun,
    })
  ) : (
    <TextArea
      className="min-h-[220px] resize-none border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0"
      disabled={state.status === 'running' || !runner}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault()
          void handleRun()
        }
      }}
      value={value}
    />
  )

  return (
    <Card className="w-full overflow-hidden">
      {sql.primaryText ? (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{sql.primaryText}</CardTitle>
          {sql.secondaryText ? (
            <p className="text-sm text-foreground-light">{sql.secondaryText}</p>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        <div className="flex items-center justify-end">
          <Button disabled={!runner || state.status === 'running'} onClick={() => void handleRun()}>
            {sql.runButtonLabel ?? 'Run'}
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border bg-background">{editor}</div>

        <div className="overflow-hidden rounded-lg border bg-background">
          {state.status === 'idle' && (
            <p className="px-4 py-4 text-sm text-foreground-light">
              {!runner
                ? 'SQL execution is unavailable in this client.'
                : 'Click Run to execute your query.'}
            </p>
          )}

          {state.status === 'running' && <p className="px-4 py-4 font-mono text-sm">Running...</p>}

          {state.status === 'error' && (
            <pre className="whitespace-pre-wrap px-4 py-4 font-mono text-sm">{state.error}</pre>
          )}

          {state.status === 'success' && state.rows.length === 0 && (
            <p className="px-4 py-4 font-mono text-sm">Success. No rows returned</p>
          )}

          {state.status === 'success' && state.rows.length > 0 && (sql.view ?? 'table') === 'table' && (
            <SqlResultsTable rows={state.rows} />
          )}

          {state.status === 'success' && state.rows.length > 0 && (sql.view ?? 'table') === 'chart' && (
            <SqlResultsChart state={chartState} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const SqlResultsTable = ({ rows }: { rows: AgentChatSqlPoint[] }) => {
  const columns = Object.keys(rows[0] ?? {})

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b last:border-b-0">
              {columns.map((column) => (
                <td key={column} className="max-w-[240px] px-4 py-3 align-top font-mono text-xs">
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SqlResultsChart = ({
  state,
}: {
  state:
    | { status: 'ready'; data: Array<Record<string, string | number>>; xKey: string; yKey: string }
    | { status: 'missing-config' | 'invalid-y-axis' }
}) => {
  if (state.status === 'missing-config') {
    return (
      <div className="flex h-[220px] items-center justify-center px-4 text-sm text-foreground-light">
        Add `xKey` and `yKey` to render the chart.
      </div>
    )
  }

  if (state.status === 'invalid-y-axis') {
    return (
      <div className="flex h-[220px] items-center justify-center px-4 text-sm text-foreground-light">
        Chart `yKey` values must be numeric.
      </div>
    )
  }

  if (state.status !== 'ready') {
    return null
  }

  const maxValue = Math.max(...state.data.map((point) => Number(point[state.yKey]) || 0), 0)

  return (
    <div className="flex h-[220px] items-end gap-2 px-4 py-4">
      {state.data.map((point, index) => {
        const value = Number(point[state.yKey]) || 0
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0

        return (
          <div key={index} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex flex-1 items-end justify-center self-stretch">
              <div
                className={cn('min-h-[4px] w-full rounded bg-foreground')}
                style={{ height: `${height}%` }}
              />
            </div>
            <div className="max-w-full truncate text-xs text-foreground-light">
              {String(point[state.xKey] ?? '')}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const normalizeRunResult = (result: AgentChatSqlRunResult): ToolSqlState => {
  if (result.error) {
    return { status: 'error', rows: result.rows ?? [], error: result.error }
  }

  return { status: 'success', rows: result.rows ?? [] }
}

const getChartState = (
  rows: AgentChatSqlPoint[],
  chartConfig?: AgentChatSql['chartConfig']
):
  | { status: 'ready'; data: AgentChatSqlChartRow[]; xKey: string; yKey: string }
  | { status: 'missing-config' | 'invalid-y-axis' } => {
  if (!chartConfig?.xKey || !chartConfig?.yKey) {
    return { status: 'missing-config' }
  }

  const data: AgentChatSqlChartRow[] = rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        key === chartConfig.yKey ? Number(value) : formatChartValue(value),
      ])
    )

    return normalized
  })

  if (data.some((row) => Number.isNaN(row[chartConfig.yKey]))) {
    return { status: 'invalid-y-axis' }
  }

  return {
    status: 'ready',
    data,
    xKey: chartConfig.xKey,
    yKey: chartConfig.yKey,
  }
}

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

type AgentChatSqlChartRow = Record<string, string | number>

const formatChartValue = (value: unknown): string | number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return JSON.stringify(value)
}
