import type { PricingChange } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { ProviderBadge } from '@/components/ProviderBadge'

interface PricingChangesProps {
  changes: PricingChange[]
}

function reductionPct(change: PricingChange): number {
  const oldTotal =
    change.oldInputPricePerMTokens + change.oldOutputPricePerMTokens
  const newTotal =
    change.newInputPricePerMTokens + change.newOutputPricePerMTokens
  if (oldTotal === 0) return 0
  return Math.round((1 - newTotal / oldTotal) * 100)
}

function PriceCell({ oldValue, newValue }: { oldValue: number; newValue: number }) {
  if (oldValue === newValue) {
    return <span className="text-slate-600 dark:text-slate-300">{formatUsd(newValue)}</span>
  }
  return (
    <span className="text-slate-500 dark:text-slate-400">
      {formatUsd(oldValue)}
      <span className="mx-1.5">→</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">
        {formatUsd(newValue)}
      </span>
    </span>
  )
}

export function PricingChanges({ changes }: PricingChangesProps) {
  if (changes.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Modelo</th>
            <th className="px-4 py-3 font-medium">Entrada</th>
            <th className="px-4 py-3 font-medium">Salida</th>
            <th className="px-4 py-3 font-medium">Cambio de precio</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change) => {
            const pct = reductionPct(change)
            const cheaper = pct > 0
            return (
              <tr
                key={`${change.provider}-${change.newName}`}
                className="border-b border-slate-100 last:border-0 dark:border-slate-800"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProviderBadge provider={change.provider} />
                    <span className="text-slate-500 dark:text-slate-400">
                      {change.oldName}
                      <span className="mx-1.5">→</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {change.newName}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PriceCell
                    oldValue={change.oldInputPricePerMTokens}
                    newValue={change.newInputPricePerMTokens}
                  />
                </td>
                <td className="px-4 py-3">
                  <PriceCell
                    oldValue={change.oldOutputPricePerMTokens}
                    newValue={change.newOutputPricePerMTokens}
                  />
                </td>
                <td className="px-4 py-3">
                  {pct !== 0 && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        cheaper
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                      }`}
                    >
                      {Math.abs(pct)}% {cheaper ? 'más barato' : 'más caro'}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
