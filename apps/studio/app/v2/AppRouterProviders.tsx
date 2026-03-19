'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'common'
import { useRootQueryClient } from 'data/query-client'
import { customFont, sourceCodePro } from 'fonts'
import { AuthProvider } from 'lib/auth'
import { ReactNode } from 'react'
import { TooltipProvider } from 'ui'

export function AppRouterProviders({ children }: { children: ReactNode }) {
  const queryClient = useRootQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
          }}
        />
        <TooltipProvider delayDuration={0}>
          <ThemeProvider
            defaultTheme="system"
            themes={['dark', 'light', 'classic-dark']}
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
