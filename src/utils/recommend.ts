import type { ModelCostResult, ModelPricing, UsageEstimate } from '@/types/model'
import type { TaskPreset } from '@/data/tasks'
import { classifyModelsById } from '@/utils/classify'
import { calculateModelCost } from '@/utils/cost'

export interface Recommendation {
  best: ModelCostResult
  /** Siguiente opción más barata de cada otro proveedor (máx. 2). */
  alternatives: ModelCostResult[]
  eligibleCount: number
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

export function recommend(
  models: ModelPricing[],
  task: TaskPreset,
  usage: UsageEstimate,
): Recommendation | null {
  const classById = classifyModelsById(models)
  const ranked = models
    .filter((m) => isEligible(m, task, usage, classById))
    .map((m) => calculateModelCost(m, usage))
    .sort((a, b) => a.totalCostPerMonth - b.totalCostPerMonth)

  if (ranked.length === 0) return null

  const [best, ...rest] = ranked
  const seen = new Set([best.model.provider])
  const alternatives: ModelCostResult[] = []
  for (const result of rest) {
    if (seen.has(result.model.provider)) continue
    seen.add(result.model.provider)
    alternatives.push(result)
    if (alternatives.length === 2) break
  }

  return { best, alternatives, eligibleCount: ranked.length }
}
