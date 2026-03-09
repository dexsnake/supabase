'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from 'ui'

type Framework = {
  name: string
  icon: string
  darkHtml: string
  lightHtml: string
}

export function FrameworksSectionClient({ frameworks }: { frameworks: Framework[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = frameworks[activeIdx]

  return (
    <div className="border-b border-border">
      <div className="dark mx-auto max-w-[var(--container-max-w,75rem)] pl-6 border-x border-border bg-background text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: title */}
          <div className="flex items-center py-16 lg:py-24 pr-6">
            <div className="text-2xl md:text-4xl text-foreground-lighter">
              Use Supabase with{' '}
              <span className="block">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={active.name}
                    initial={{ filter: 'blur(2px)', opacity: 0 }}
                    animate={{ filter: 'blur(0px)', opacity: 1, transition: { duration: 0.25 } }}
                    exit={{ filter: 'blur(2px)', opacity: 0, transition: { duration: 0.1 } }}
                    className="inline-block text-foreground"
                  >
                    {active.name}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>

          {/* Right: icon tabs + code */}
          <div className="border-l border-border flex flex-col">
            {/* 6-col icon row */}
            <div className="grid grid-cols-6 border-b border-border">
              {frameworks.map((framework, index) => (
                <button
                  key={framework.name}
                  onClick={() => setActiveIdx(index)}
                  className={cn(
                    'flex items-center justify-center py-4 border-r border-border last:border-r-0 transition-colors',
                    index === activeIdx
                      ? 'bg-surface-75 text-foreground'
                      : 'text-foreground-muted hover:text-foreground-light hover:bg-surface-75/50'
                  )}
                >
                  <svg
                    width={28}
                    height={28}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    viewBox="0 0 61 61"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={framework.icon} fill="currentColor" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Code area */}
            <div className="h-[440px] overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15, delay: 0.05 } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: active.darkHtml }}
                    className="[&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-6"
                    style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.7 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
