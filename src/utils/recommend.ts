import type { ModelCostResult, ModelPricing, Provider, UsageEstimate } from '@/types/model'
import type { TaskPreset } from '@/data/tasks'
import { classifyModelsById } from '@/utils/classify'
import { calculateModelCost } from '@/utils/cost'
import { qualityFor, type TaskQuality } from '@/utils/quality'

export type Strategy = 'barato' | 'balance' | 'calidad'

export const STRATEGY_LABELS: Record<Strategy, string> = {
  barato: 'Más barato',
  balance: 'Mejor balance',
  calidad: 'Máxima calidad',
}

/**
 * Margen de "calidad suficiente" en puntos de Arena: un modelo a 40 puntos
 * del mejor es preferido frente a él ~44% de las veces (casi paridad).
 */
export const BALANCE_MARGIN = 40

export interface RankedModel extends ModelCostResult {
  quality: TaskQuality | null
}

export interface Recommendation {
  strategy: Strategy
  best: RankedModel
  /** La opción que la misma estrategia elegiría en cada otro proveedor (máx. 2). */
  alternatives: RankedModel[]
  /** Todos los modelos aptos, ordenados por costo ascendente. */
  eligible: RankedModel[]
  /** Mejor puntaje de calidad entre los aptos (null si ninguno tiene puntaje). */
  topRating: number | null
}

export function isEligible(
  model: ModelPricing,
  task: TaskPreset,
  usage: UsageEstimate,
  classById: Map<string, string>,
): boolean {
  const cls = classById.get(model.id)
  return (
    cls !== undefined &&
    task.allowedClasses.some((c) => c === cls) &&
    model.contextWindow >= usage.inputTokens
  )
}

function pick(
  candidates: RankedModel[],
  strategy: Strategy,
  topRating: number | null,
): RankedModel | null {
  if (candidates.length === 0) return null
  const cheapest = candidates[0]
  const scored = candidates.filter((c) => c.quality)
  if (strategy === 'barato' || topRating === null || scored.length === 0) return cheapest

  if (strategy === 'calidad') {
    return scored.reduce((best, c) =>
      c.quality!.rating > best.quality!.rating ||
      (c.quality!.rating === best.quality!.rating && c.totalCostPerMonth < best.totalCostPerMonth)
        ? c
        : best,
    )
  }

  // Balance: el más barato con calidad suficiente; si ninguno de estos
  // candidatos llega al margen, el de mejor calidad entre ellos.
  const goodEnough = scored.filter((c) => c.quality!.rating >= topRating - BALANCE_MARGIN)
  return goodEnough[0] ?? pick(candidates, 'calidad', topRating)
}

export function recommend(
  models: ModelPricing[],
  task: TaskPreset,
  usage: UsageEstimate,
  strategy: Strategy,
): Recommendation | null {
  const classById = classifyModelsById(models)
  const eligible: RankedModel[] = models
    .filter((m) => isEligible(m, task, usage, classById))
    .map((m) => ({ ...calculateModelCost(m, usage), quality: qualityFor(m, task.qualityCategory) }))
    .sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)

  if (eligible.length === 0) return null

  const ratings = eligible.flatMap((e) => (e.quality ? [e.quality.rating] : []))
  const topRating = ratings.length > 0 ? Math.max(...ratings) : null

  const best = pick(eligible, strategy, topRating)!

  const alternatives: RankedModel[] = []
  const providers = [...new Set(eligible.map((e) => e.model.provider))].filter(
    (p): p is Provider => p !== best.model.provider,
  )
  // Para cada otro proveedor se aplica la estrategia contra SU propio mejor
  // puntaje: si ninguno de sus modelos llega al margen del mejor global, la
  // alternativa útil es su mejor relación costo/calidad, no su modelo más caro.
  for (const provider of providers) {
    const providerEligible = eligible.filter((e) => e.model.provider === provider)
    const providerRatings = providerEligible.flatMap((e) => (e.quality ? [e.quality.rating] : []))
    const providerTop = providerRatings.length > 0 ? Math.max(...providerRatings) : null
    const alt = pick(providerEligible, strategy, providerTop)
    if (alt) alternatives.push(alt)
  }
  alternatives.sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)

  return { strategy, best, alternatives: alternatives.slice(0, 2), eligible, topRating }
}
