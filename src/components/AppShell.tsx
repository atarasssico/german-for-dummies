import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, Dumbbell, PenLine, Settings2 } from 'lucide-react'
import { GENDER_VAR } from '@/lib/gender'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const NAV = [
  { to: '/', label: 'Üben', icon: Dumbbell },
  { to: '/paradigma', label: 'Schreiben', icon: PenLine },
  { to: '/tabellen', label: 'Tabellen', icon: BookOpen },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings2 },
]

/** Wordmark: the three gender hues as a rule under the word. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex flex-col gap-1', className)}>
      <span className="de text-[20px] leading-none tracking-tight">Deutsch</span>
      <span aria-hidden className="flex h-[3px] w-full min-w-[64px]">
        <span className="flex-1" style={{ background: GENDER_VAR.m }} />
        <span className="flex-1" style={{ background: GENDER_VAR.f }} />
        <span className="flex-1" style={{ background: GENDER_VAR.n }} />
      </span>
    </span>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  // A drill session owns the whole screen; chrome would only compete with it.
  const bare = pathname.startsWith('/ueben/') || pathname.startsWith('/paradigma/')

  return (
    <div className="min-h-dvh bg-background" translate="no">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-rule-strong focus:bg-background focus:px-3 focus:py-2 focus:text-[15px]"
      >
        Zum Inhalt springen
      </a>
      {!bare && (
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-3xl items-end justify-between gap-6 px-5 pb-3 pt-5">
            <NavLink to="/" aria-label="Deutsch, Startseite">
              <Wordmark />
            </NavLink>
            <nav className="hidden gap-6 sm:flex" aria-label="Sections">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'pb-0.5 text-[15px] tracking-wide transition-colors',
                      isActive
                        ? 'border-b-[1.5px] border-rule-strong font-medium text-foreground'
                        : 'border-b-[1.5px] border-transparent text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main id="inhalt" className={cn('mx-auto w-full max-w-3xl px-5', bare ? 'pb-0' : 'pb-28 pt-6 sm:pb-16')}>
        {children}
      </main>

      {!bare && (
        <nav
          className="fixed inset-x-0 bottom-0 border-t border-rule bg-background/95 backdrop-blur sm:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Sections"
        >
          <div className="mx-auto flex max-w-3xl">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 text-center text-[12px] leading-tight tracking-wide',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="size-[18px]" strokeWidth={isActive ? 2 : 1.5} aria-hidden />
                      <span className={isActive ? 'font-medium' : undefined}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
