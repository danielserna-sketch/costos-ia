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

// Decimales adaptativos: 2 para montos ≥ 1 y, por debajo, los necesarios
// para mostrar hasta tres cifras significativas ($0,20 · $0,125 · $0,0012) en vez
// de un "0,2000" fijo que agrega ruido.
export function formatUsd(value: number): string {
  const abs = Math.abs(value)
  const significant = abs >= 1 || abs === 0 ? 2 : Math.ceil(-Math.log10(abs)) + 2
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.max(2, Math.min(significant, 6)),
  }).format(value)
}
