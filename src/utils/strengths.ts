import type { ModelPricing, QualityCategory } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { formatTokensShort } from '@/utils/format'

export interface Strength {
  id: string
  label: string
  /** Por qué: el dato concreto que respalda la etiqueta. */
  reason: string
}

// Categorías de LMArena que se traducen en una fortaleza visible.
const QUALITY_STRENGTHS: { category: QualityCategory; label: string; what: string }[] = [
  { category: 'coding', label: 'Código', what: 'código' },
  { category: 'hard_prompts', label: 'Problemas difíciles', what: 'prompts difíciles' },
  { category: 'longer_query', label: 'Textos largos', what: 'consultas largas' },
  { category: 'instruction_following', label: 'Sigue instrucciones', what: 'seguir instrucciones' },
  { category: 'multi_turn', label: 'Conversación', what: 'conversación' },
]

/** Cuántos puestos del ranking de una categoría cuentan como fortaleza. */
const TOP_N = 3

/** Posición (1 = mejor) del modelo en una categoría de LMArena, o null. */
export function qualityRank(
  model: ModelPricing,
  models: ModelPricing[],
  category: QualityCategory,
): { rank: number; total: number } | null {
  const own = model.quality?.[category]
  if (!own) return null
  const scored = models.filter((m) => m.quality?.[category])
  const rank = 1 + scored.filter((m) => m.quality![category]!.rating > own.rating).length
  return { rank, total: scored.length }
}

function blendedPrice(m: ModelPricing): number {
  // Mezcla típica 3:1 entrada/salida, suficiente para comparar "barato".
  return (3 * m.inputPricePerMTokens + m.outputPricePerMTokens) / 4
}

/**
 * Fortalezas derivadas solo de datos (ranking LMArena, contexto, precio,
 * modalidades). Son señales, no una recomendación absoluta: cada una lleva el
 * dato que la justifica para que el usuario juzgue.
 */
export function strengths(model: ModelPricing, models: ModelPricing[]): Strength[] {
  const result: Strength[] = []

  const ranked = QUALITY_STRENGTHS.map((q) => ({ q, r: qualityRank(model, models, q.category) }))
    .filter((x): x is { q: (typeof QUALITY_STRENGTHS)[number]; r: { rank: number; total: number } } =>
      Boolean(x.r && x.r.rank <= TOP_N),
    )
    .sort((a, b) => a.r.rank - b.r.rank)
  for (const { q, r } of ranked) {
    result.push({
      id: `quality:${q.category}`,
      label: q.label,
      reason: `#${r.rank} de ${r.total} en ${q.what} (LMArena)`,
    })
  }

  if (model.contextWindow >= 1_000_000) {
    result.push({
      id: 'long-context',
      label: 'Documentos largos',
      reason: `${formatTokensShort(model.contextWindow)} tokens de contexto`,
    })
  }

  const prices = models.map(blendedPrice).sort((a, b) => a - b)
  const quartile = prices[Math.floor((prices.length - 1) / 4)]
  if (blendedPrice(model) <= quartile) {
    result.push({
      id: 'cheap',
      label: 'Alto volumen',
      reason: `Entre el 25% más barato: ${formatUsd(model.inputPricePerMTokens)} / 1M de entrada`,
    })
  }

  const modalities = model.inputModalities ?? []
  if (modalities.includes('audio') || modalities.includes('video')) {
    result.push({
      id: 'multimodal',
      label: 'Multimodal',
      reason: 'Acepta audio y/o video además de texto e imágenes',
    })
  }

  return result
}
