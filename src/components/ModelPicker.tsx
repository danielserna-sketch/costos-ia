import type { ModelPricing, Provider } from '@/types/model'
import { ProviderBadge } from '@/components/ProviderBadge'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'

interface ModelPickerProps {
  models: ModelPricing[]
  providers: readonly Provider[]
  selectedIds: string[]
  onToggle: (id: string) => void
  isFull: boolean
}

export function ModelPicker({
  models,
  providers,
  selectedIds,
  onToggle,
  isFull,
}: ModelPickerProps) {
  const grouped = providers
    .map((provider) => ({
      provider,
      models: models.filter((m) => m.provider === provider),
    }))
    .filter((group) => group.models.length > 0)

  if (grouped.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Selecciona al menos un proveedor para ver sus modelos.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ provider, models: providerModels }) => (
        <div key={provider} className="flex flex-col gap-3">
          <ProviderBadge provider={provider} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {providerModels.map((model) => {
              const selected = selectedIds.includes(model.id)
              const disabled = !selected && isFull
              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(model.id)}
                  aria-pressed={selected}
                  className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {model.name}
                    </span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatUsd(model.inputPricePerMTokens)} entrada</span>
                    <span>{formatUsd(model.outputPricePerMTokens)} salida</span>
                    <span>{formatContextWindow(model.contextWindow)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
