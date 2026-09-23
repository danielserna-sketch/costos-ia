import type { ModelCostResult } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { ProviderBadge } from '@/components/ProviderBadge'

interface CostTableProps {
  results: ModelCostResult[]
}

export function CostTable({ results }: CostTableProps) {
  const sorted = [...results].sort(
    (a, b) => a.totalCostPerMonth - b.totalCostPerMonth,
  )

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Modelo</th>
            <th className="px-4 py-3 font-medium">Proveedor</th>
            <th className="px-4 py-3 font-medium">$/1M entrada</th>
            <th className="px-4 py-3 font-medium">$/1M salida</th>
            <th className="px-4 py-3 font-medium">Costo / request</th>
            <th className="px-4 py-3 font-medium">Costo / mes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ model, totalCostPerRequest, totalCostPerMonth }) => (
            <tr
              key={model.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800"
            >
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {model.name}
              </td>
              <td className="px-4 py-3">
                <ProviderBadge provider={model.provider} />
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {formatUsd(model.inputPricePerMTokens)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {formatUsd(model.outputPricePerMTokens)}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {formatUsd(totalCostPerRequest)}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                {formatUsd(totalCostPerMonth)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
