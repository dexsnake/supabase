'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

const SUB_TABS = [
  { slug: 'data', label: 'Data' },
  { slug: 'schema', label: 'Schema' },
  { slug: 'policies', label: 'Policies' },
  { slug: 'indexes', label: 'Indexes' },
  { slug: 'settings', label: 'Settings' },
]

export default function TableDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const { projectRef } = useV2Params()
  const tableId = params?.tableId as string

  const base = projectRef ? `/dashboard/v2/project/${projectRef}/data/tables/${tableId}` : ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border shrink-0">
        {SUB_TABS.map((tab) => {
          const href = `${base}/${tab.slug}`
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                'px-3 py-1.5 text-xs rounded',
                isActive
                  ? 'bg-sidebar-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  )
}
