'use client'

import { Database, SqlEditor, Storage, TableEditor } from 'icons'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'

const ICON_SIZE = 20
const ICON_STROKE_WIDTH = 1.5

interface NavItem {
  href: string
  label: string
  key: string
  icon: ReactNode
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/sql',
    label: 'SQL Editor',
    key: 'sql',
    icon: <SqlEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    href: '/tables',
    label: 'Tables',
    key: 'tables',
    icon: <TableEditor size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
  },
  {
    href: '/auth',
    label: 'Auth',
    key: 'auth',
    icon: <Database size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    disabled: true,
  },
  {
    href: '/storage',
    label: 'Storage',
    key: 'storage',
    icon: <Storage size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
    disabled: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup className="gap-0.5">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild={!item.disabled}
                  disabled={item.disabled}
                  isActive={!item.disabled && pathname === item.href}
                  tooltip={item.disabled ? `${item.label} (coming soon)` : item.label}
                  size="default"
                  className="text-sm"
                >
                  {item.disabled ? (
                    <span className="opacity-50">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup className="p-0">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" size="default" className="text-sm">
              <Link href="/settings">
                <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
