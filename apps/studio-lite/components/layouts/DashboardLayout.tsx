'use client'

import { QueryClientProvider } from '@tanstack/react-query'

import { LayoutHeader } from '@/components/navigation'
import { AdapterLoader } from '@/lib/AdapterLoader'
import { queryClient } from '@/lib/query-client'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdapterLoader>
        <div className="flex flex-col h-screen w-screen">
          <LayoutHeader />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </AdapterLoader>
    </QueryClientProvider>
  )
}
