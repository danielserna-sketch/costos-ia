import type { ModelPricing, Provider } from '@/types/model'

interface BaselineSelectProps {
  models: ModelPricing[]
  providers: readonly Provider[]
  value: string | null
  onChange: (id: string | null) => void
}

export function BaselineSelect({ models, providers, value, onChange }: BaselineSelectProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 sm:flex-row sm:items-center sm:gap-3 dark:text-slate-300">
      Mi modelo actual
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">Ninguno / aún no uso IA</option>
        {providers.map((provider) => (
          <optgroup key={provider} label={provider}>
            {models
              .filter((m) => m.provider === provider)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
