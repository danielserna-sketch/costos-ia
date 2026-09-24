import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { Provider } from '@/types/model'
import type { RankedModel } from '@/utils/recommend'
import { formatUsd } from '@/utils/cost'

interface CostQualityChartProps {
  eligible: RankedModel[]
  recommendedId: string
  /** Modelos que llevan etiqueta visible (el resto solo en el tooltip). */
  labeledIds: string[]
  categoryLabel: string
}

const providerColor: Record<Provider, string> = {
  Anthropic: '#f97316',
  OpenAI: '#10b981',
  Google: '#3b82f6',
}

interface Point {
  name: string
  provider: Provider
  cost: number
  rating: number
  recommended: boolean
  labeled: boolean
}

function Dot(props: { cx?: number; cy?: number; payload?: Point }) {
  const { cx, cy, payload } = props
  if (cx === undefined || cy === undefined || !payload) return null
  const color = providerColor[payload.provider]
  return (
    <g>
      {payload.recommended && (
        <circle cx={cx} cy={cy} r={11} fill="none" stroke={color} strokeWidth={2} />
      )}
      <circle cx={cx} cy={cy} r={6} fill={color} opacity={payload.labeled ? 1 : 0.55} />
      {payload.labeled && (
        <text x={cx + 10} y={cy - 8} fontSize={11} className="fill-slate-500 dark:fill-slate-400">
          {payload.name}
        </text>
      )}
    </g>
  )
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
      <p className="text-slate-500 dark:text-slate-400">
        {formatUsd(p.cost)}/mes · calidad {p.rating}
      </p>
    </div>
  )
}

export function CostQualityChart({
  eligible,
  recommendedId,
  labeledIds,
  categoryLabel,
}: CostQualityChartProps) {
  const data: Point[] = eligible
    .filter((e) => e.quality && e.totalCostPerMonth > 0)
    .map((e) => ({
      name: e.model.name,
      provider: e.model.provider,
      cost: e.totalCostPerMonth,
      rating: e.quality!.rating,
      recommended: e.model.id === recommendedId,
      labeled: labeledIds.includes(e.model.id),
    }))

  if (data.length < 2) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
        Costo vs. calidad de los modelos aptos
      </p>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Arriba y a la izquierda es mejor: más calidad en {categoryLabel} por
        menos dinero. El círculo marca la recomendación; pasa el cursor por los
        demás puntos para ver cada modelo. Costo en escala logarítmica.
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 110, bottom: 24, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              type="number"
              dataKey="cost"
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={(v) => formatUsd(Number(v))}
              tick={{ fontSize: 11 }}
              name="Costo mensual"
              label={{ value: 'Costo mensual', position: 'insideBottom', offset: -14, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="rating"
              domain={['dataMin - 10', 'dataMax + 10']}
              tick={{ fontSize: 11 }}
              width={48}
              name="Calidad"
            />
            <ZAxis range={[80, 80]} />
            <Tooltip content={<ChartTooltip />} />
            <Scatter data={data} shape={<Dot />} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
