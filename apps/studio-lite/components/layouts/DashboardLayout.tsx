'use client'

import { LayoutHeader } from '@/components/navigation'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-screen">
      <LayoutHeader />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
