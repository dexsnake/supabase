'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from 'ui'

export interface PlatformGridPaginationProps {
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
}

export function PlatformGridPagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
}: PlatformGridPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRows)

  return (
    <div className="sb-grid-footer flex items-center justify-between px-4 py-2 border-t text-xs text-foreground-light">
      <span>{totalRows > 0 ? `${from}-${to} of ${totalRows} rows` : 'No rows'}</span>
      <div className="flex items-center gap-1">
        <Button
          type="text"
          size="tiny"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft size={14} />}
        />
        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          type="text"
          size="tiny"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          icon={<ChevronRight size={14} />}
        />
      </div>
    </div>
  )
}
