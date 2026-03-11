import Image from 'next/image'
import Link from 'next/link'

export function QuoteSection() {
  return (
    <div>
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 border-x border-border bg-surface-200">
        <div className="flex flex-col items-center text-center gap-8 md:gap-12 py-16 md:py-24">
          <q className="text-2xl xl:text-4xl max-w-screen-lg text-foreground-lighter text-balance">
            You can have a really great product, but you need to want to work with the people behind
            it. <span className="text-brand">With Supabase, we always felt very aligned.</span>
          </q>

          <Link href="/customers/next-door-lending" className="hover:opacity-90 transition-opacity">
            <div className="flex flex-row items-center gap-3">
              <Image
                draggable={false}
                src="/images/blog/avatars/howard-haynes.webp"
                alt="Howard Haynes, CPO at Next Door Lending"
                className="w-12 h-12 rounded-full overflow-hidden object-cover"
                width={48}
                height={48}
              />

              <div className="flex flex-col items-start gap-0.5">
                <span className="text-foreground text-sm">Howard Haynes</span>
                <span className="text-foreground-lighter text-xs">CPO at Next Door Lending</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
