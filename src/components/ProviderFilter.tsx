import type { Provider } from '@/types/model'
import { providers } from '@/data/models'

interface ProviderFilterProps {
  selected: Provider[]
  onChange: (selected: Provider[]) => void
}

export function ProviderFilter({ selected, onChange }: ProviderFilterProps) {
  const toggle = (provider: Provider) => {
    if (selected.includes(provider)) {
      onChange(selected.filter((p) => p !== provider))
    } else {
      onChange([...selected, provider])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {providers.map((provider) => {
        const active = selected.includes(provider)
        return (
          <button
            key={provider}
            type="button"
            onClick={() => toggle(provider)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 bg-transparent text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {provider}
          </button>
        )
      })}
    </div>
  )
}
