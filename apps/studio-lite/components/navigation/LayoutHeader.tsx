'use client'

import { Database, Home, SqlEditor, Storage, TableEditor } from 'icons'
import { Plug } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Button, cn } from 'ui'

import { UserMenu } from './UserMenu'

const ICON_SIZE = 16
const ICON_STROKE_WIDTH = 1.5

interface NavItem {
  href: string
  label: string
  icon: ReactNode
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Home', icon: <Home size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} /> },
  {
    href: '/sql',
    label: 'SQL Editor',
    icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    href: '/tables',
    label: 'Tables',
    icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    href: '/data',
    label: 'Data',
    icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    disabled: true,
  },
  {
    href: '/storage',
    label: 'Storage',
    icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    disabled: true,
  },
]

export function LayoutHeader() {
  const pathname = usePathname()

  return (
    <header className="flex-shrink-0 border-b">
      {/* Top row: logo, connect, user */}
      <div className="flex h-12 items-center px-4 justify-between border-b">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center flex-shrink-0">
            <img alt="Supabase" src="/img/supabase-logo.svg" className="h-[18px]" />
          </Link>
          <span className="text-foreground-light font-medium">supalite</span>
          <Button
            type="alternative"
            size="tiny"
            className="rounded-full ml-2"
            icon={<Plug size={14} className="rotate-90 text-foreground" />}
          >
            Connect
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>

      {/* Bottom row: navigation tabs */}
      <nav className="flex items-center gap-1 px-4 -translate-x-3">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.disabled && pathname === item.href

          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-foreground-muted cursor-not-allowed"
                title="Coming soon"
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm transition-colors relative',
                isActive ? 'text-foreground' : 'text-foreground-light hover:text-foreground'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-foreground rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
