'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DatabaseAdapter } from '../adapters/types'

const AdapterContext = createContext<DatabaseAdapter | null>(null)

export function AdapterProvider({
  adapter,
  children,
}: {
  adapter: DatabaseAdapter
  children: ReactNode
}) {
  return <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>
}

export function useAdapter(): DatabaseAdapter {
  const adapter = useContext(AdapterContext)
  if (!adapter) {
    throw new Error('useAdapter must be used within an <AdapterProvider>')
  }
  return adapter
}
