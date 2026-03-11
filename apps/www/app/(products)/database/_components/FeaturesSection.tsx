import { cn } from 'ui'

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn('rounded bg-foreground-muted/10', className)} />
}

const FEATURES = [
  {
    title: 'Just Postgres',
    description: 'Every Supabase project is a dedicated Postgres database.',
    detail: '100% portable. Bring your existing Postgres database, or migrate away at any time.',
    visual: PostgresSkeleton,
  },
  {
    title: 'Secure by default',
    description: "Leveraging Postgres's proven Row Level Security.",
    detail: 'Integrated with JWT authentication which controls exactly what your users can access.',
    visual: RLSSkeleton,
  },
  {
    title: 'Realtime enabled',
    description: 'Data-change listeners over websockets.',
    detail: 'Subscribe and react to database changes, milliseconds after they happen.',
    visual: RealtimeSkeleton,
  },
]

function PostgresSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 w-full">
      <SkeletonBar className="h-2.5 w-20 bg-brand/20" />
      <div className="flex flex-col gap-1.5 mt-2">
        <SkeletonBar className="h-2 w-full" />
        <SkeletonBar className="h-2 w-3/4" />
        <SkeletonBar className="h-2 w-5/6" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBar key={i} className="h-6 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

function RLSSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 w-full">
      <div className="flex items-center gap-2">
        <SkeletonBar className="h-3 w-3 rounded-sm bg-brand/20" />
        <SkeletonBar className="h-2 w-24" />
      </div>
      <div className="flex flex-col gap-1 mt-2 border border-foreground-muted/10 rounded p-2">
        <SkeletonBar className="h-2 w-full bg-muted/70" />
        <SkeletonBar className="h-2 w-2/3" />
      </div>
      <div className="flex flex-col gap-1 border border-foreground-muted/10 rounded p-2">
        <SkeletonBar className="h-2 w-5/6 bg-muted/70" />
        <SkeletonBar className="h-2 w-1/2" />
      </div>
    </div>
  )
}

function RealtimeSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 w-full">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-brand/40 animate-pulse" />
        <SkeletonBar className="h-2 w-16 bg-brand/15" />
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonBar className="h-1.5 w-1.5 rounded-full shrink-0" />
            <SkeletonBar className={cn('h-2', i % 2 === 0 ? 'w-full' : 'w-3/4')} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <div>
      {/* Header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border">
          <div className="pt-32 pb-8">
            <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
              Everything you need
              <br />
              <span className="text-foreground">from your database</span>
            </h3>
          </div>
        </div>
      </div>

      {/* 3-col grid */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] border-x border-border">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Visual = feature.visual
            return (
              <div
                key={feature.title}
                className="flex flex-col border-b md:border-b-0 md:border-r border-border last:border-r-0 last:border-b-0"
              >
                {/* Visual with overlaid title */}
                <div className="relative flex items-center justify-center h-[320px] border-b border-border">
                  <Visual />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded-full border border-border">
                      {feature.title}
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="px-6 py-6 flex flex-col gap-2">
                  <h4 className="text-foreground text-sm font-medium">{feature.description}</h4>
                  <p className="text-foreground-muted text-sm">{feature.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
