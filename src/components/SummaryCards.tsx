import type { ModelCostResult } from '@/types/model'
import { formatUsd } from '@/utils/cost'

interface SummaryCardsProps {
  results: ModelCostResult[]
}

export function SummaryCards({ results }: SummaryCardsProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Selecciona al menos un proveedor para ver el resumen.
      </div>
    )
  }

  const sorted = [...results].sort(
    (a, b) => a.totalCostPerMonth - b.totalCostPerMonth,
  )
  const cheapest = sorted[0]
  const priciest = sorted[sorted.length - 1]
  const average =
    results.reduce((sum, r) => sum + r.totalCostPerMonth, 0) / results.length

  const cards = [
    {
      label: 'Más económico',
      model: cheapest.model.name,
      value: formatUsd(cheapest.totalCostPerMonth),
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Más costoso',
      model: priciest.model.name,
      value: formatUsd(priciest.totalCostPerMonth),
      accent: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Promedio mensual',
      model: `${results.length} modelos seleccionados`,
      value: formatUsd(average),
      accent: 'text-slate-900 dark:text-slate-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {card.label}
          </p>
          <p className={`mt-1.5 text-2xl font-semibold ${card.accent}`}>
            {card.value}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {card.model}
          </p>
        </div>
      ))}
    </div>
  )
}
