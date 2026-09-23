import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ModelCostResult } from '@/types/model'
import { formatUsd } from '@/utils/cost'

interface CostChartProps {
  results: ModelCostResult[]
}

const providerColor: Record<string, string> = {
  Anthropic: '#f97316',
  OpenAI: '#10b981',
  Google: '#3b82f6',
}

export function CostChart({ results }: CostChartProps) {
  const data = [...results]
    .sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)
    .map((r) => ({
      name: r.model.name,
      provider: r.model.provider,
      'Costo mensual': Number(r.totalCostPerMonth.toFixed(2)),
    }))

  return (
    <div className="h-96 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(v) => formatUsd(v)} width={90} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatUsd(Number(value))} />
          <Legend />
          <Bar dataKey="Costo mensual" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={providerColor[entry.provider]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
