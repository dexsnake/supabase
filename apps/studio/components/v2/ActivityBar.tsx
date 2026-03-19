'use client'

import { useProjectLintsQuery } from 'data/lint/lint-query'
import { Database, LayoutDashboard, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export type ActivityId = 'data' | 'obs' | 'settings'

interface ActivityBarProps {
  side: 'left' | 'right'
  activeId: string | null
  onSelect?: (id: string) => void
  items: Array<{
    id: string
    icon: React.ReactNode
    label: string
    badge?: boolean
    href?: string
  }>
  /** For right bar, tooltips show on the left of the icon */
  tooltipSide?: 'left' | 'right'
  bottomContent?: React.ReactNode
}

export function ActivityBar({
  side,
  activeId,
  onSelect,
  items,
  tooltipSide = 'right',
  bottomContent,
}: ActivityBarProps) {
  return (
    <aside
      className={cn(
        'w-11 flex flex-col shrink-0 border-border bg-background',
        side === 'left' && 'border-r',
        side === 'right' && 'border-l'
      )}
    >
      <div className="flex flex-col flex-1 gap-1 p-1.5">
        {items.map((item) => {
          const isActive = activeId === item.id
          const content = (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center justify-center w-full aspect-square rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-accent text-foreground',
                      side === 'left' && isActive && 'border-1 border-foreground',
                      side === 'right' && isActive && 'border-1 border-foreground'
                    )}
                  >
                    <span className="relative">
                      {item.icon}
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      'relative flex items-center justify-center w-full aspect-square rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-accent text-foreground',
                      side === 'left' && isActive && 'border-l-2 border-l-foreground',
                      side === 'right' && isActive && 'border-r-2 border-r-foreground'
                    )}
                  >
                    <span className="relative">
                      {item.icon}
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent side={tooltipSide} className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
          return content
        })}
      </div>
      {bottomContent && <div className="mt-auto">{bottomContent}</div>}
    </aside>
  )
}

export function LeftActivityBar() {
  const pathname = usePathname()
  const { projectRef } = useV2Params()
  const activeId: ActivityId | null = pathname?.includes('/data/')
    ? 'data'
    : pathname?.includes('/obs/')
      ? 'obs'
      : pathname?.includes('/settings/')
        ? 'settings'
        : null

  const { data: lints } = useProjectLintsQuery({ projectRef })
  const hasAdvisorWarnings = (lints?.length ?? 0) > 0

  const base = projectRef ? `/dashboard/v2/project/${projectRef}` : '#'

  return (
    <ActivityBar
      side="left"
      activeId={activeId}
      items={[
        {
          id: 'data',
          icon: <Database className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Data',
          href: `${base}/data/tables`,
        },
        {
          id: 'obs',
          icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Observability',
          badge: hasAdvisorWarnings,
          href: `${base}/obs/logs`,
        },
        {
          id: 'settings',
          icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
          label: 'Settings',
          href: `${base}/settings/general`,
        },
      ]}
      tooltipSide="right"
    />
  )
}
