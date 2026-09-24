import type { ModelPricing, PricingChange, Provider, QualityMeta } from '@/types/model'
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

function isPricingChange(value: unknown): value is PricingChange {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  return (
    VALID_PROVIDERS.includes(c.provider as Provider) &&
    typeof c.oldName === 'string' &&
    typeof c.newName === 'string' &&
    typeof c.oldInputPricePerMTokens === 'number' &&
    typeof c.newInputPricePerMTokens === 'number' &&
    typeof c.oldOutputPricePerMTokens === 'number' &&
    typeof c.newOutputPricePerMTokens === 'number'
  )
}

interface LoadedGenerated {
  models: ModelPricing[]
  generatedAt: string
  changes: PricingChange[]
}

function loadGeneratedModels(): LoadedGenerated | null {
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

  const candidateChanges = (generated as { changes?: unknown[] }).changes
  const validChanges = Array.isArray(candidateChanges)
    ? candidateChanges.filter(isPricingChange)
    : []

  return {
    models: validModels,
    generatedAt: (generated as { generatedAt: string }).generatedAt,
    changes: validChanges,
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
export const pricingChanges: PricingChange[] = loaded?.changes ?? []

function loadQualityMeta(): QualityMeta | null {
  const q = (generated as { quality?: unknown }).quality
  if (!q || typeof q !== 'object') return null
  const { source, publishedAt } = q as Record<string, unknown>
  if (typeof source !== 'string') return null
  return { source, publishedAt: typeof publishedAt === 'string' ? publishedAt : null }
}

export const qualityMeta: QualityMeta | null = loaded ? loadQualityMeta() : null

export const providers = VALID_PROVIDERS
