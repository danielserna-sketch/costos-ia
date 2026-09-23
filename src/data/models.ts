import type { ModelPricing } from '@/types/model'

/**
 * Precios de referencia (USD por 1M tokens), tomados de las páginas públicas
 * de precios de cada proveedor. Deben revisarse periódicamente ya que cambian
 * con frecuencia.
 */
export const models: ModelPricing[] = [
  {
    id: 'claude-opus-5-5',
    provider: 'Anthropic',
    name: 'Claude Opus 5.5',
    inputPricePerMTokens: 15,
    outputPricePerMTokens: 75,
    cachedInputPricePerMTokens: 1.5,
    contextWindow: 200_000,
  },
  {
    id: 'claude-sonnet-5',
    provider: 'Anthropic',
    name: 'Claude Sonnet 5',
    inputPricePerMTokens: 3,
    outputPricePerMTokens: 15,
    cachedInputPricePerMTokens: 0.3,
    contextWindow: 200_000,
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'Anthropic',
    name: 'Claude Haiku 4.5',
    inputPricePerMTokens: 0.8,
    outputPricePerMTokens: 4,
    cachedInputPricePerMTokens: 0.08,
    contextWindow: 200_000,
  },
  {
    id: 'gpt-5',
    provider: 'OpenAI',
    name: 'GPT-5',
    inputPricePerMTokens: 5,
    outputPricePerMTokens: 15,
    cachedInputPricePerMTokens: 2.5,
    contextWindow: 128_000,
  },
  {
    id: 'gpt-5-mini',
    provider: 'OpenAI',
    name: 'GPT-5 mini',
    inputPricePerMTokens: 0.6,
    outputPricePerMTokens: 2.4,
    cachedInputPricePerMTokens: 0.3,
    contextWindow: 128_000,
  },
  {
    id: 'gpt-5-nano',
    provider: 'OpenAI',
    name: 'GPT-5 nano',
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.4,
    cachedInputPricePerMTokens: 0.05,
    contextWindow: 128_000,
  },
  {
    id: 'gemini-2-5-pro',
    provider: 'Google',
    name: 'Gemini 2.5 Pro',
    inputPricePerMTokens: 1.25,
    outputPricePerMTokens: 10,
    contextWindow: 1_000_000,
    notes: 'Precio para prompts <= 200K tokens; sube a 2.5/15 por encima.',
  },
  {
    id: 'gemini-2-5-flash',
    provider: 'Google',
    name: 'Gemini 2.5 Flash',
    inputPricePerMTokens: 0.3,
    outputPricePerMTokens: 2.5,
    contextWindow: 1_000_000,
  },
  {
    id: 'gemini-2-5-flash-lite',
    provider: 'Google',
    name: 'Gemini 2.5 Flash-Lite',
    inputPricePerMTokens: 0.1,
    outputPricePerMTokens: 0.4,
    contextWindow: 1_000_000,
  },
]

export const providers = ['Anthropic', 'OpenAI', 'Google'] as const
