import { useDarkMode } from '@/hooks/useDarkMode'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  const { isDark, toggle } = useDarkMode()

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            IA
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
              Tablero de Costos IA
            </p>
            <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">
              Claude · OpenAI · Gemini
            </p>
          </div>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggle} />
      </div>
    </header>
  )
}
