import type { ModelCostResult, ModelPricing, UsageEstimate } from '@/types/model'

export function calculateModelCost(
  model: ModelPricing,
  usage: UsageEstimate,
): ModelCostResult {
  const inputCost = (usage.inputTokens / 1_000_000) * model.inputPricePerMTokens
  const outputCost = (usage.outputTokens / 1_000_000) * model.outputPricePerMTokens
  const totalCostPerRequest = inputCost + outputCost

  return {
    model,
    inputCost,
    outputCost,
    totalCostPerRequest,
    totalCostPerMonth: totalCostPerRequest * usage.requestsPerMonth,
  }
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}
