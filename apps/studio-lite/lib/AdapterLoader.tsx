'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AdapterProvider, type DatabaseAdapter } from 'platform'
import { getAdapter } from './adapter'

export function AdapterLoader({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<DatabaseAdapter | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getAdapter()
      .then((a) => {
        if (!cancelled) setAdapter(a)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-destructive-600">
        Failed to initialize SQLite: {error}
      </div>
    )
  }

  if (!adapter) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-foreground-lighter">
        Loading SQLite engine...
      </div>
    )
  }

  return <AdapterProvider adapter={adapter}>{children}</AdapterProvider>
}
