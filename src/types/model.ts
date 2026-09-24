export type Provider = 'Anthropic' | 'OpenAI' | 'Google'

/** Categorías del leaderboard de LMArena que usamos como señal de calidad. */
export type QualityCategory =
  | 'overall'
  | 'coding'
  | 'hard_prompts'
  | 'longer_query'
  | 'multi_turn'
  | 'instruction_following'

export interface QualityScore {
  /** Arena Score (escala Elo): 100 puntos de diferencia ≈ 64% de preferencia. */
  rating: number
  votes: number
  /** Nombre exacto en LMArena (puede incluir el nivel de esfuerzo, ej. "-high"). */
  variant: string
}

export interface QualityMeta {
  source: string
  publishedAt: string | null
}

export interface ModelPricing {
  id: string
  provider: Provider
  name: string
  /** USD per 1M input tokens */
  inputPricePerMTokens: number
  /** USD per 1M output tokens */
  outputPricePerMTokens: number
  /** USD per 1M cached/context input tokens, if the provider offers a discounted rate */
  cachedInputPricePerMTokens?: number
  contextWindow: number
  notes?: string
  /** Clave de línea de producto (ej. "opus", "flash-lite") usada para
   * detectar cambios de precio entre versiones. Solo la fija sync-pricing. */
  tier?: string
  quality?: Partial<Record<QualityCategory, QualityScore>>
}

export interface PricingChange {
  provider: Provider
  oldName: string
  newName: string
  oldInputPricePerMTokens: number
  newInputPricePerMTokens: number
  oldOutputPricePerMTokens: number
  newOutputPricePerMTokens: number
}

export interface UsageEstimate {
  inputTokens: number
  outputTokens: number
  requestsPerMonth: number
}

export interface ModelCostResult {
  model: ModelPricing
  inputCost: number
  outputCost: number
  totalCostPerRequest: number
  totalCostPerMonth: number
}
