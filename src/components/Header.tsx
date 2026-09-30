import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router'
import { useDarkMode } from '@/hooks/useDarkMode'
import { usePortalState } from '@/state/PortalState'
import { ThemeToggle } from '@/components/ThemeToggle'

const ICON_PROPS = {
  'aria-hidden': true,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-5 w-5',
} as const

const ICONS: Record<string, ReactNode> = {
  '/': (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  ),
  '/modelos': (
    <svg {...ICON_PROPS}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  ),
  '/comparador': (
    <svg {...ICON_PROPS}>
      <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />
    </svg>
  ),
  '/recomendador': (
    <svg {...ICON_PROPS}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  '/mercado': (
    <svg {...ICON_PROPS}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
}

// Metodología vive en el footer y en enlaces contextuales, no en la navegación.
const NAV_ITEMS = [
  { to: '/', label: 'Explorar', end: true },
  { to: '/modelos', label: 'Modelos', end: false },
  { to: '/comparador', label: 'Comparar', end: false },
  { to: '/recomendador', label: 'Casos de uso', end: false },
  { to: '/mercado', label: 'Mercado', end: false },
]

export function Header() {
  const { isDark, toggle } = useDarkMode()
  const { userSelectedIds } = usePortalState()

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
              IA
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Costos IA</span>
          </Link>

          <nav className="hidden flex-1 gap-1 sm:flex" aria-label="Secciones">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                {item.label}
                {item.to === '/comparador' && userSelectedIds.length > 0 && (
                  <span className="ml-1.5 tabular-nums opacity-70">({userSelectedIds.length})</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            <ThemeToggle isDark={isDark} onToggle={toggle} />
          </div>
        </div>
      </header>

      {/* En móvil la navegación va abajo, al alcance del pulgar. */}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                    isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                  }`
                }
              >
                {ICONS[item.to]}
                {item.label}
                {item.to === '/comparador' && userSelectedIds.length > 0 && (
                  <span className="absolute right-[22%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] tabular-nums text-white dark:bg-slate-100 dark:text-slate-900">
                    {userSelectedIds.length}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
