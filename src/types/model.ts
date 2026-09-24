export type Provider = 'Anthropic' | 'OpenAI' | 'Google'

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
