'use client'

import { MoreHorizontalIcon } from 'lucide-react'

import type { AgentChatRowItem } from '../types'
import {
  Button_Shadcn_ as Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

export const ToolRow = ({
  rows,
  onActionSelect,
}: {
  rows: AgentChatRowItem[]
  onActionSelect?: (prompt: string) => void
}) => {
  if (rows.length === 0) return null

  return (
    <div className="mb-4 w-full space-y-px">
      {rows.map((row, index) => (
        <div
          key={`${row.primaryText}-${index}`}
          className="flex w-full items-start justify-between gap-3 bg-card px-3 py-3 text-sm first:rounded-t-lg last:rounded-b-lg"
        >
          <div className="space-y-1">
            <p className="font-medium leading-none">{row.primaryText}</p>
            {row.secondaryText ? (
              <p className="text-xs text-foreground-light">{row.secondaryText}</p>
            ) : null}
          </div>
          {row.actions?.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open row actions"
                  className="h-8 w-8 text-foreground-light"
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {row.actions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    className="cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault()
                      onActionSelect?.(action.prompt)
                    }}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ))}
    </div>
  )
}
