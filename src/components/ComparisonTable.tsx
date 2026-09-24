import type { ModelCostResult, QualityCategory } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'
import { QUALITY_CATEGORY_LABELS, qualityFor } from '@/utils/quality'
import { ProviderBadge } from '@/components/ProviderBadge'

interface ComparisonTableProps {
  results: ModelCostResult[]
  onRemove: (id: string) => void
  baseline: ModelCostResult | null
  qualityCategory: QualityCategory
}

function BaselineDelta({ result, baseline }: { result: ModelCostResult; baseline: ModelCostResult }) {
  if (result.model.id === baseline.model.id) {
    return <span className="text-slate-400 dark:text-slate-500">Tu modelo</span>
  }
  const diff = result.totalCostPerMonth - baseline.totalCostPerMonth
  if (diff === 0) return <span className="text-slate-500 dark:text-slate-400">Igual</span>
  const cheaper = diff < 0
  return (
    <span
      className={
        cheaper ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }
    >
      {cheaper ? '−' : '+'}
      {formatUsd(Math.abs(diff))}/mes
    </span>
  )
}

interface Row {
  label: string
  value: (result: ModelCostResult) => number
  format: (n: number) => string
  higherIsBetter?: boolean
}

const baseRows: Row[] = [
  { label: 'Entrada / 1M tokens', value: (r) => r.model.inputPricePerMTokens, format: formatUsd },
  { label: 'Salida / 1M tokens', value: (r) => r.model.outputPricePerMTokens, format: formatUsd },
  {
    label: 'Ventana de contexto',
    value: (r) => r.model.contextWindow,
    format: formatContextWindow,
    higherIsBetter: true,
  },
  { label: 'Costo por request', value: (r) => r.totalCostPerRequest, format: formatUsd },
  { label: 'Costo mensual estimado', value: (r) => r.totalCostPerMonth, format: formatUsd },
]

const cacheRow: Row = {
  label: 'Entrada en caché / 1M',
  value: (r) => r.model.cachedInputPricePerMTokens ?? Infinity,
  format: (n) => (n === Infinity ? '—' : formatUsd(n)),
}

function SavingsBanner({ results }: { results: ModelCostResult[] }) {
  if (results.length < 2) return null
  const sorted = [...results].sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)
  const cheapest = sorted[0]
  const priciest = sorted[sorted.length - 1]
  if (cheapest.totalCostPerMonth === priciest.totalCostPerMonth) return null

  const pct = Math.round((1 - cheapest.totalCostPerMonth / priciest.totalCostPerMonth) * 100)

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
      <span className="font-semibold">{cheapest.model.name}</span> te cuesta{' '}
      <span className="font-semibold">{pct}% menos</span> al mes que{' '}
      <span className="font-semibold">{priciest.model.name}</span> con este
      volumen de uso ({formatUsd(cheapest.totalCostPerMonth)} vs{' '}
      {formatUsd(priciest.totalCostPerMonth)}).
    </div>
  )
}

export function ComparisonTable({
  results,
  onRemove,
  baseline,
  qualityCategory,
}: ComparisonTableProps) {
  if (results.length === 0) return null

  const hasCachePricing = results.some(
    (r) => r.model.cachedInputPricePerMTokens !== undefined,
  )
  const qualityRow: Row = {
    label: `Calidad (${QUALITY_CATEGORY_LABELS[qualityCategory]})`,
    value: (r) => qualityFor(r.model, qualityCategory)?.rating ?? -Infinity,
    format: (n) => (n === -Infinity ? 'Sin puntaje' : String(n)),
    higherIsBetter: true,
  }
  const rows = [
    qualityRow,
    ...baseRows.slice(0, 2),
    ...(hasCachePricing ? [cacheRow] : []),
    ...baseRows.slice(2),
  ]

  return (
    <div className="flex flex-col gap-3">
      <SavingsBanner results={results} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3"></th>
            {results.map((r) => (
              <th key={r.model.id} className="min-w-[170px] px-4 py-3 align-top">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ProviderBadge provider={r.model.provider} />
                      {baseline?.model.id === r.model.id && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                          Tu modelo
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {r.model.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(r.model.id)}
                    aria-label={`Quitar ${r.model.name} de la comparación`}
                    className="mt-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const raw = results.map((r) => row.value(r))
            const best = row.higherIsBetter ? Math.max(...raw) : Math.min(...raw)
            const allTied = raw.every((v) => v === raw[0])
            return (
              <tr
                key={row.label}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                  {row.label}
                </td>
                {results.map((r, i) => {
                  const value = raw[i]
                  const isBest = !allTied && results.length > 1 && value === best
                  return (
                    <td
                      key={r.model.id}
                      className={`px-4 py-3 font-medium ${
                        isBest
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {row.format(value)}
                      {isBest && ' ✓'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {baseline && (
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                Vs. tu modelo actual
              </td>
              {results.map((r) => (
                <td key={r.model.id} className="px-4 py-3 font-medium">
                  <BaselineDelta result={r} baseline={baseline} />
                </td>
              ))}
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  )
}
