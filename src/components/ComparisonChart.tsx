import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ModelCostResult } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { providerColor } from '@/theme/providers'
import { ProviderLegend } from '@/components/ProviderLegend'

interface ComparisonChartProps {
  results: ModelCostResult[]
}

// Barras horizontales: los nombres de modelo se leen sin rotar, también en
// móvil. El color identifica al proveedor (con leyenda), no al ranking.
export function ComparisonChart({ results }: ComparisonChartProps) {
  if (results.length === 0) return null

  const data = [...results]
    .sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)
    .map((r) => ({
      name: r.model.name,
      provider: r.model.provider,
      'Costo mensual': Number(r.totalCostPerMonth.toFixed(2)),
    }))

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Costo mensual estimado</p>
        <ProviderLegend providers={data.map((d) => d.provider)} />
      </div>
      <div style={{ height: 56 + data.length * 44 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis type="number" tickFormatter={(v) => formatUsd(Number(v))} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatUsd(Number(value))} cursor={{ fillOpacity: 0.06 }} />
            <Bar dataKey="Costo mensual" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={providerColor(entry.provider)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
