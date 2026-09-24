import type { ModelPricing, UsageEstimate } from '@/types/model'
import { CLASS_DESCRIPTIONS, CLASS_ORDER, classifyModels } from '@/utils/classify'
import { calculateModelCost, formatUsd } from '@/utils/cost'
import { ProviderBadge } from '@/components/ProviderBadge'

interface InsightsPanelProps {
  models: ModelPricing[]
  usage: UsageEstimate
}

export function InsightsPanel({ models, usage }: InsightsPanelProps) {
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
              {providersInClass < 2 && (
                <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Sin competencia directa todavía
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {costs.map(({ model, cost }, i) => (
                <div key={model.id} className="flex items-center gap-3">
                  <div className="flex w-44 shrink-0 items-center gap-2 sm:w-64">
                    <ProviderBadge provider={model.provider} />
                    <span
                      className="truncate text-sm font-medium text-slate-700 dark:text-slate-200"
                      title={model.name}
                    >
                      {model.name}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ width: `${(cost / maxCost) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`w-24 shrink-0 text-right text-sm font-semibold ${
                        i === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {formatUsd(cost)}
                    </span>
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
