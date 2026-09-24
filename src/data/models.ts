import type { ModelPricing, Provider } from '@/types/model'
import { fallbackModels } from '@/data/models.fallback'
import generated from '@/data/models.generated.json'

const VALID_PROVIDERS: readonly Provider[] = ['Anthropic', 'OpenAI', 'Google']

function isModelPricing(value: unknown): value is ModelPricing {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.name === 'string' &&
    VALID_PROVIDERS.includes(m.provider as Provider) &&
    typeof m.inputPricePerMTokens === 'number' &&
    typeof m.outputPricePerMTokens === 'number' &&
    typeof m.contextWindow === 'number'
  )
}

function loadGeneratedModels(): { models: ModelPricing[]; generatedAt: string } | null {
  if (
    !generated ||
    typeof generated !== 'object' ||
    !Array.isArray((generated as { models?: unknown }).models) ||
    typeof (generated as { generatedAt?: unknown }).generatedAt !== 'string'
  ) {
    return null
  }

  const candidateModels = (generated as { models: unknown[] }).models
  const validModels = candidateModels.filter(isModelPricing)
  if (validModels.length === 0) return null

  return {
    models: validModels,
    generatedAt: (generated as { generatedAt: string }).generatedAt,
  }
}

const loaded = loadGeneratedModels()

/**
 * Precios de modelos (USD por 1M tokens). Se sincroniza automáticamente desde
 * el dataset de LiteLLM vía `npm run sync-pricing` / GitHub Actions
 * (scripts/sync-pricing.mjs -> src/data/models.generated.json). Si ese
 * archivo no existe o queda inválido, se usa src/data/models.fallback.ts.
 */
export const models: ModelPricing[] = loaded?.models ?? fallbackModels
export const generatedAt: string | null = loaded?.generatedAt ?? null

export const providers = VALID_PROVIDERS
