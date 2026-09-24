import type { ModelCostResult, ModelPricing, QualityMeta } from '@/types/model'
import type { TaskPreset } from '@/data/tasks'
import {
  BALANCE_MARGIN,
  STRATEGY_LABELS,
  type Recommendation,
  type RankedModel,
  type Strategy,
} from '@/utils/recommend'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'
import { QUALITY_CATEGORY_LABELS, qualityFor, winProbability } from '@/utils/quality'
import { ProviderBadge } from '@/components/ProviderBadge'

interface RecommendationCardProps {
  task: TaskPreset
  strategy: Strategy
  onStrategyChange: (strategy: Strategy) => void
  recommendation: Recommendation | null
  baseline: ModelCostResult | null
  baselineClassAllowed: boolean
  qualityMeta: QualityMeta | null
  onCompare: (models: ModelPricing[]) => void
}

const HIGH_EFFORT = /-(high|xhigh|max)$|\(x?high\)/i

function timesCheaper(cheap: number, expensive: number): string | null {
  if (cheap <= 0) return null
  const ratio = expensive / cheap
  return ratio >= 1.5 ? `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}×` : null
}

function StrategyToggle({
  value,
  onChange,
}: {
  value: Strategy
  onChange: (s: Strategy) => void
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 p-0.5 dark:border-slate-700">
      {(Object.keys(STRATEGY_LABELS) as Strategy[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-pressed={value === s}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === s
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
          }`}
        >
          {STRATEGY_LABELS[s]}
        </button>
      ))}
    </div>
  )
}

function QualityValue({ model, topRating }: { model: RankedModel; topRating: number | null }) {
  if (!model.quality) {
    return <span className="text-slate-400 dark:text-slate-500">Sin puntaje aún</span>
  }
  const gap = topRating !== null ? topRating - model.quality.rating : 0
  return (
    <span title={`Variante evaluada: ${model.quality.variant} · ${model.quality.votes.toLocaleString('es-CO')} votos`}>
      {model.quality.rating}
      {gap > 0 && (
        <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">
          (−{gap} vs mejor)
        </span>
      )}
    </span>
  )
}

function reasonText(rec: Recommendation, task: TaskPreset): string {
  const { best, eligible, topRating, strategy } = rec
  const categoryLabel = QUALITY_CATEGORY_LABELS[task.qualityCategory]
  const scoredCount = eligible.filter((e) => e.quality).length

  if (strategy === 'barato' || !best.quality || topRating === null) {
    return `Es el más económico entre ${eligible.length} modelos aptos para esta tarea (categorías ${task.allowedClasses.join(', ')}, con contexto suficiente).`
  }
  if (strategy === 'calidad') {
    return `Tiene el mejor puntaje en ${categoryLabel} entre ${scoredCount} modelos aptos con puntaje.`
  }
  const winPct = Math.round(winProbability(best.quality.rating, topRating) * 100)
  return best.quality.rating >= topRating
    ? `Es a la vez el mejor en ${categoryLabel} y el más barato entre los de calidad comparable.`
    : `Es el más barato entre los modelos a menos de ${BALANCE_MARGIN} puntos del mejor en ${categoryLabel}: frente al mejor, sería preferido ~${winPct}% de las veces.`
}

function BaselineVerdict({
  best,
  baseline,
  baselineClassAllowed,
  task,
}: {
  best: RankedModel
  baseline: ModelCostResult
  baselineClassAllowed: boolean
  task: TaskPreset
}) {
  if (baseline.model.id === best.model.id) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
        Ya usas la opción recomendada para esta tarea.
      </p>
    )
  }

  const diff = baseline.totalCostPerMonth - best.totalCostPerMonth
  const baseQ = qualityFor(baseline.model, task.qualityCategory)
  const qualityNote =
    baseQ && best.quality
      ? best.quality.rating >= baseQ.rating
        ? ` con igual o mejor calidad (${best.quality.rating} vs ${baseQ.rating})`
        : ` con ${baseQ.rating - best.quality.rating} puntos menos de calidad (${best.quality.rating} vs ${baseQ.rating})`
      : ''

  if (diff <= 0) {
    const pctMore = baseline.totalCostPerMonth > 0 ? Math.round((-diff / baseline.totalCostPerMonth) * 100) : 0
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {diff === 0
          ? `Cuesta lo mismo que tu modelo actual (${baseline.model.name})`
          : `Cuesta ${formatUsd(-diff)}/mes más (${pctMore}%) que tu modelo actual (${baseline.model.name})`}
        {qualityNote}.
        {!baselineClassAllowed &&
          ' Tu modelo actual está en una categoría por debajo de la recomendada para esta tarea.'}
      </p>
    )
  }

  const pct = Math.round((diff / baseline.totalCostPerMonth) * 100)
  const times = timesCheaper(best.totalCostPerMonth, baseline.totalCostPerMonth)
  return (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
      Frente a tu modelo actual ({baseline.model.name}) ahorrarías{' '}
      <span className="font-semibold">{formatUsd(diff)}/mes</span> ({pct}% menos
      {times ? `, ${times} más barato` : ''}){qualityNote}.
      {!baselineClassAllowed &&
        ' Además, tu modelo actual está en una categoría por debajo de la recomendada para esta tarea.'}
    </p>
  )
}

export function RecommendationCard({
  task,
  strategy,
  onStrategyChange,
  recommendation,
  baseline,
  baselineClassAllowed,
  qualityMeta,
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

  const { best, alternatives, eligible, topRating } = recommendation
  const categoryLabel = QUALITY_CATEGORY_LABELS[task.qualityCategory]
  const unscored = eligible.filter((e) => !e.quality)

  const compareSet = [best.model, ...alternatives.map((a) => a.model)]
  if (baseline && !compareSet.some((m) => m.id === baseline.model.id)) {
    compareSet.push(baseline.model)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Recomendado para: {task.name}
        </p>
        <StrategyToggle value={strategy} onChange={onStrategyChange} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <div className="flex flex-1 flex-col gap-3">
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
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Calidad ({categoryLabel})
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                <QualityValue model={best} topRating={topRating} />
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
            {reasonText(recommendation, task)}
          </p>
          {baseline && (
            <BaselineVerdict
              best={best}
              baseline={baseline}
              baselineClassAllowed={baselineClassAllowed}
              task={task}
            />
          )}
        </div>

        {alternatives.length > 0 && (
          <div className="flex flex-col gap-3 lg:w-80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Alternativas de otros proveedores
            </p>
            {alternatives.map((alt) => {
              const pct = Math.round((alt.totalCostPerMonth / best.totalCostPerMonth - 1) * 100)
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Calidad: <QualityValue model={alt} topRating={topRating} />
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {formatUsd(alt.totalCostPerMonth)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {pct === 0 ? 'mismo costo' : `${pct > 0 ? '+' : ''}${pct}% vs recomendado`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex max-w-2xl flex-col gap-1 text-xs text-slate-400 dark:text-slate-500">
          <p>
            Calidad = Arena Score de{' '}
            <a
              href="https://lmarena.ai/leaderboard"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-slate-600 dark:hover:text-slate-300"
            >
              LMArena
            </a>{' '}
            en la categoría "{categoryLabel}" (preferencias de usuarios, CC BY 4.0
            {qualityMeta?.publishedAt ? `, publicado ${qualityMeta.publishedAt}` : ''}).
            Mide preferencia en respuestas, no exactitud en tu caso particular.
          </p>
          {best.quality && HIGH_EFFORT.test(best.quality.variant) && (
            <p>
              El puntaje de {best.model.name} se midió en su configuración de
              razonamiento alto ({best.quality.variant}); así genera más tokens de
              salida que los estimados, por lo que el costo real puede ser mayor.
            </p>
          )}
          {unscored.length > 0 && strategy !== 'barato' && (
            <p>
              Sin puntaje aún (no considerados en esta estrategia):{' '}
              {unscored.map((u) => u.model.name).join(', ')}.
            </p>
          )}
        </div>
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
