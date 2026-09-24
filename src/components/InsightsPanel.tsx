import type { ModelPricing, UsageEstimate } from '@/types/model'
import {
  CLASS_DESCRIPTIONS,
  CLASS_ORDER,
  classifyModels,
  representativePerProvider,
} from '@/utils/classify'
import { calculateModelCost, formatUsd } from '@/utils/cost'
import { ProviderBadge } from '@/components/ProviderBadge'

interface InsightsPanelProps {
  models: ModelPricing[]
  usage: UsageEstimate
  onCompare: (models: ModelPricing[]) => void
}

export function InsightsPanel({ models, usage, onCompare }: InsightsPanelProps) {
  const classes = classifyModels(models)
  const nonEmptyClasses = CLASS_ORDER.filter((cls) => classes[cls].length > 0)

  if (nonEmptyClasses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Selecciona al menos un proveedor para ver los insights.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {nonEmptyClasses.map((cls) => {
        const classModels = classes[cls]
        const costs = classModels.map((model) => ({
          model,
          cost: calculateModelCost(model, usage).totalCostPerMonth,
        }))
        const maxCost = Math.max(...costs.map((c) => c.cost), 0.0001)
        const providersInClass = new Set(classModels.map((m) => m.provider)).size

        return (
          <div
            key={cls}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {cls}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {CLASS_DESCRIPTIONS[cls]}
                </p>
              </div>
              {providersInClass < 2 ? (
                <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Sin competencia directa todavía
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onCompare(representativePerProvider(classModels))}
                  className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Comparar estos →
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {costs.map(({ model, cost }, i) => (
                // Móvil: nombre y costo en una línea, barra debajo a todo el ancho.
                // Desde sm: nombre | barra | costo en una sola fila.
                <div
                  key={model.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[16rem_minmax(0,1fr)_6rem]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <ProviderBadge provider={model.provider} />
                    <span
                      className="truncate text-sm font-medium text-slate-700 dark:text-slate-200"
                      title={model.name}
                    >
                      {model.name}
                    </span>
                  </div>
                  <span
                    className={`text-right text-sm font-semibold sm:order-3 ${
                      i === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {formatUsd(cost)}
                  </span>
                  <div className="col-span-2 h-2.5 overflow-hidden rounded-full bg-slate-100 sm:order-2 sm:col-span-1 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${(cost / maxCost) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
