import type { ModelPricing, QualityCategory, QualityScore } from '@/types/model'

export const QUALITY_CATEGORY_LABELS: Record<QualityCategory, string> = {
  overall: 'general',
  coding: 'código',
  hard_prompts: 'prompts difíciles',
  longer_query: 'textos largos',
  multi_turn: 'conversación',
  instruction_following: 'seguir instrucciones',
}

export interface TaskQuality extends QualityScore {
  category: QualityCategory
}

/** Puntaje en la categoría pedida, o el general si el modelo no la tiene. */
export function qualityFor(model: ModelPricing, category: QualityCategory): TaskQuality | null {
  const specific = model.quality?.[category]
  if (specific) return { ...specific, category }
  const overall = model.quality?.overall
  return overall ? { ...overall, category: 'overall' } : null
}

/** Probabilidad esperada (Elo) de que A sea preferido frente a B. */
export function winProbability(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400))
}
