import type { ModelCostResult, ModelPricing } from '@/types/model'
import type { TaskPreset } from '@/data/tasks'
import type { Recommendation } from '@/utils/recommend'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'
import { ProviderBadge } from '@/components/ProviderBadge'

interface RecommendationCardProps {
  task: TaskPreset
  recommendation: Recommendation | null
  baseline: ModelCostResult | null
  baselineClassAllowed: boolean
  onCompare: (models: ModelPricing[]) => void
}

function timesCheaper(cheap: number, expensive: number): string | null {
  if (cheap <= 0) return null
  const ratio = expensive / cheap
  return ratio >= 1.5 ? `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×` : null
}

function BaselineVerdict({
  best,
  baseline,
  baselineClassAllowed,
}: {
  best: ModelCostResult
  baseline: ModelCostResult
  baselineClassAllowed: boolean
}) {
  if (baseline.model.id === best.model.id) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
        Ya usas la opción más económica para esta tarea.
      </p>
    )
  }

  const diff = baseline.totalCostPerMonth - best.totalCostPerMonth
  if (diff <= 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {baseline.model.name} cuesta menos, pero{' '}
        {baselineClassAllowed
          ? 'no tiene contexto suficiente para este volumen de entrada'
          : 'está en una categoría por debajo de lo recomendado para esta tarea'}
        .
      </p>
    )
  }

  const pct = Math.round((diff / baseline.totalCostPerMonth) * 100)
  const times = timesCheaper(best.totalCostPerMonth, baseline.totalCostPerMonth)
  return (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
      Frente a tu modelo actual ({baseline.model.name}) ahorrarías{' '}
      <span className="font-semibold">{formatUsd(diff)}/mes</span> ({pct}% menos
      {times ? `, ${times} más barato` : ''}).
      {!baselineClassAllowed &&
        ' Además, tu modelo actual está en una categoría por debajo de la recomendada para esta tarea.'}
    </p>
  )
}

export function RecommendationCard({
  task,
  recommendation,
  baseline,
  baselineClassAllowed,
  onCompare,
}: RecommendationCardProps) {
  if (!recommendation) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        Ningún modelo de los proveedores seleccionados cumple con esta tarea
        (categoría o ventana de contexto). Prueba activar más proveedores o
        bajar los tokens de entrada.
      </div>
    )
  }

  const { best, alternatives, eligibleCount } = recommendation

  const compareSet = [best.model, ...alternatives.map((a) => a.model)]
  if (baseline && !compareSet.some((m) => m.id === baseline.model.id)) {
    compareSet.push(baseline.model)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Recomendado para: {task.name}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ProviderBadge provider={best.model.provider} />
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {best.model.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Costo mensual</p>
              <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                {formatUsd(best.totalCostPerMonth)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Por request</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {formatUsd(best.totalCostPerRequest)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Contexto</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {formatContextWindow(best.model.contextWindow)}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Es el más económico entre {eligibleCount} modelos aptos para esta
            tarea (categorías {task.allowedClasses.join(', ')}, con contexto
            suficiente para tu volumen de entrada).
          </p>
          {baseline && (
            <BaselineVerdict
              best={best}
              baseline={baseline}
              baselineClassAllowed={baselineClassAllowed}
            />
          )}
        </div>

        {alternatives.length > 0 && (
          <div className="flex flex-col gap-3 lg:w-80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Alternativas de otros proveedores
            </p>
            {alternatives.map((alt) => {
              const pct = Math.round(
                (alt.totalCostPerMonth / best.totalCostPerMonth - 1) * 100,
              )
              return (
                <div
                  key={alt.model.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-800"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <ProviderBadge provider={alt.model.provider} />
                    <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {alt.model.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatUsd(alt.totalCostPerMonth)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      +{pct}% vs recomendado
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Basado en costo y categoría de precio. Aún no incluye medición de
          calidad (benchmarks).
        </p>
        <button
          type="button"
          onClick={() => onCompare(compareSet)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          Comparar en detalle →
        </button>
      </div>
    </div>
  )
}
