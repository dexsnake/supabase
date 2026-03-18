// Simplified from apps/studio/components/grid/components/grid/ColumnHeader.tsx
// Removed: DnD, index advisor, FK cascade tooltips, column menu, encrypted icon

import { Key } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { ColumnHeaderProps, ColumnType } from '../types'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  format,
  comment,
}: ColumnHeaderProps<R>) {
  const columnFormat = getColumnFormat(columnType, format)

  return (
    <div className="w-full">
      <div className="sb-grid-column-header">
        <div className="sb-grid-column-header__inner">
          {isPrimaryKey && (
            <Tooltip>
              <TooltipTrigger>
                <div className="sb-grid-column-header__inner__primary-key">
                  <Key size={14} strokeWidth={2} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Primary key
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger>
              <span className="sb-grid-column-header__inner__name">{column.name}</span>
            </TooltipTrigger>
            {!!comment && (
              <TooltipContent side="bottom" className="max-w-xs text-center">
                {comment}
              </TooltipContent>
            )}
          </Tooltip>

          <span className="sb-grid-column-header__inner__format">{columnFormat}</span>
        </div>
      </div>
    </div>
  )
}

function getColumnFormat(type: ColumnType, format: string) {
  if (type == 'array') {
    return `${format.replace('_', '')}[]`
  } else return format
}
