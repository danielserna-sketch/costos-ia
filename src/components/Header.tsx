import { NavLink, Link } from 'react-router'
import { useDarkMode } from '@/hooks/useDarkMode'
import { ThemeToggle } from '@/components/ThemeToggle'

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/recomendador', label: 'Recomendador', end: false },
  { to: '/comparador', label: 'Comparador', end: false },
  { to: '/mercado', label: 'Mercado', end: false },
  { to: '/metodologia', label: 'Metodología', end: false },
]

export function Header() {
  const { isDark, toggle } = useDarkMode()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            IA
          </span>
          <span className="hidden text-sm font-semibold text-slate-900 sm:inline dark:text-slate-100">
            Costos IA
          </span>
        </Link>

        <nav
          className="-mx-1 flex flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
          aria-label="Secciones"
        >
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
            </NavLink>
          ))}
        </nav>

        <ThemeToggle isDark={isDark} onToggle={toggle} />
      </div>
    </header>
  )
}
