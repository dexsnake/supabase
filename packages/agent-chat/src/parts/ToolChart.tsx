'use client'

import type { AgentChatChart } from '../types'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'ui'

export const ToolChart = ({
  primaryText,
  secondaryText,
  tertiaryText,
  data,
  xAxis,
  yAxis,
}: AgentChatChart) => {
  const validData =
    data && xAxis && yAxis
      ? data.filter(
          (point) =>
            Object.prototype.hasOwnProperty.call(point, xAxis) &&
            Object.prototype.hasOwnProperty.call(point, yAxis)
        )
      : []

  const maxValue =
    validData.length > 0 && yAxis
      ? Math.max(...validData.map((point) => Number(point[yAxis]) || 0))
      : 0

  return (
    <Card className="w-full">
      {(primaryText || secondaryText) && (
        <CardHeader>
          {primaryText ? <CardTitle>{primaryText}</CardTitle> : null}
          {secondaryText ? <CardDescription>{secondaryText}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent>
        {validData.length > 0 && xAxis && yAxis ? (
          <div className="flex h-[200px] w-full items-end gap-2">
            {validData.map((point, index) => {
              const value = Number(point[yAxis]) || 0
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0
              const label = String(point[xAxis] ?? '').slice(0, 3)

              return (
                <div key={index} className="flex h-full flex-1 flex-col items-center gap-2">
                  <div className="flex flex-1 items-end justify-center self-stretch">
                    <div
                      className="min-h-[4px] w-full rounded-lg bg-foreground"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-center text-xs text-foreground-light">{label}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-foreground-light">
            Loading chart data...
          </div>
        )}
      </CardContent>
      {tertiaryText ? (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="text-foreground-light">{tertiaryText}</div>
        </CardFooter>
      ) : null}
    </Card>
  )
}
