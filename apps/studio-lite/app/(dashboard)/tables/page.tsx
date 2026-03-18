'use client'

import { useState, useCallback } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { PlatformGrid } from 'platform'
import { AdapterLoader } from '@/lib/AdapterLoader'
import { queryClient } from '@/lib/query-client'
import { TableList } from '@/components/table-editor/TableList'
import { CreateTableDialog } from '@/components/table-editor/CreateTableDialog'
import { GridToolbar } from '@/components/table-editor/GridToolbar'

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>('todos')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleTableCreated = useCallback((name: string) => {
    setSelectedTable(name)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AdapterLoader>
        <div className="flex h-full">
          <TableList
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
            onCreateTable={() => setCreateDialogOpen(true)}
          />
          <div className="flex-1 overflow-hidden">
            {selectedTable ? (
              <PlatformGrid
                tableName={selectedTable}
                pageSize={25}
                toolbar={(ctx) => <GridToolbar {...ctx} />}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-foreground-light">Select a table to browse its data</p>
              </div>
            )}
          </div>
          <CreateTableDialog
            visible={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onCreated={handleTableCreated}
          />
        </div>
      </AdapterLoader>
    </QueryClientProvider>
  )
}
