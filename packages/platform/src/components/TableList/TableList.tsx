'use client'

import { useQuery } from '@tanstack/react-query'
import { Plus, Table2 } from 'lucide-react'
import { Button, cn } from 'ui'

import { useAdapter } from '../../context/AdapterContext'

export interface TableListProps {
  selectedTable?: string | null
  onSelectTable: (tableName: string) => void
  onCreateTable?: () => void
}

export function TableList({ selectedTable, onSelectTable, onCreateTable }: TableListProps) {
  const adapter = useAdapter()

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => adapter.getTables(),
  })

  return (
    <div className="w-64 border-r flex flex-col bg-dash-sidebar flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-xs font-medium text-foreground-light uppercase tracking-wider">
          Tables
        </span>
        {onCreateTable && (
          <Button
            type="text"
            size="tiny"
            icon={<Plus size={14} strokeWidth={1.5} />}
            onClick={onCreateTable}
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-3 text-sm text-foreground-lighter">Loading...</div>
        ) : tables.length === 0 ? (
          <div className="px-4 py-3 text-sm text-foreground-lighter">No tables yet</div>
        ) : (
          <nav className="flex flex-col py-1">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors',
                  selectedTable === table.name
                    ? 'bg-selection text-foreground'
                    : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
                )}
              >
                <Table2 size={14} strokeWidth={1.5} className="flex-shrink-0 translate-y-px" />
                <span className="truncate">{table.name}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
