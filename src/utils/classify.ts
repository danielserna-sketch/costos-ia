import type { ModelPricing, Provider } from '@/types/model'

export type CompetitiveClass = 'Flagship' | 'Balanceado' | 'Económico' | 'Razonamiento'

export const CLASS_ORDER: CompetitiveClass[] = [
  'Flagship',
  'Balanceado',
  'Económico',
  'Razonamiento',
]

export const CLASS_DESCRIPTIONS: Record<CompetitiveClass, string> = {
  Flagship: 'El modelo más capaz de cada proveedor, sin importar el costo.',
  Balanceado: 'El punto medio entre costo y capacidad — la opción de uso diario.',
  Económico: 'La opción más barata de cada proveedor para tareas simples o de alto volumen.',
  Razonamiento: 'Modelos especializados en razonamiento paso a paso (sin equivalente directo en todos los proveedores todavía).',
}

// Tiers "ancla" que definen la posición de cada proveedor en su propia
// escalera de precios. El resto de tiers (variantes, codenames) se clasifican
// por cercanía de precio a estas anclas.
const ANCHOR_WORDS: Record<Provider, { Flagship: string; Balanceado: string; Económico: string }> = {
  Anthropic: { Flagship: 'opus', Balanceado: 'sonnet', Económico: 'haiku' },
  OpenAI: { Flagship: 'gpt', Balanceado: 'gpt-mini', Económico: 'gpt-nano' },
  Google: { Flagship: 'pro', Balanceado: 'flash', Económico: 'flash-lite' },
}

function priceScore(model: ModelPricing): number {
  return model.inputPricePerMTokens + model.outputPricePerMTokens
}

function tierWord(model: ModelPricing): string | null {
  if (!model.tier) return null
  const idx = model.tier.indexOf(':')
  return idx === -1 ? model.tier : model.tier.slice(idx + 1)
}

function isReasoningTier(word: string): boolean {
  return word === 'o' || word.startsWith('o-')
}

function classifyProviderModels(
  provider: Provider,
  providerModels: ModelPricing[],
): Map<ModelPricing, CompetitiveClass> {
  const result = new Map<ModelPricing, CompetitiveClass>()
  const anchors = ANCHOR_WORDS[provider]
  const withTiers = providerModels.every((m) => tierWord(m) !== null)

  if (!withTiers) {
    // Sin info de tier (ej. datos de respaldo): se aproxima por percentil de
    // precio dentro del propio proveedor.
    const sorted = [...providerModels].sort((a, b) => priceScore(a) - priceScore(b))
    sorted.forEach((model, i) => {
      const ratio = i / Math.max(sorted.length - 1, 1)
      result.set(model, ratio < 1 / 3 ? 'Económico' : ratio < 2 / 3 ? 'Balanceado' : 'Flagship')
    })
    return result
  }

  const anchorScores: Partial<Record<CompetitiveClass, number>> = {}
  for (const [cls, word] of Object.entries(anchors) as [CompetitiveClass, string][]) {
    const anchorModel = providerModels.find((m) => tierWord(m) === word)
    if (anchorModel) anchorScores[cls] = priceScore(anchorModel)
  }

  for (const model of providerModels) {
    const word = tierWord(model)!
    if (isReasoningTier(word)) {
      result.set(model, 'Razonamiento')
      continue
    }

    const directClass = (Object.entries(anchors) as [CompetitiveClass, string][]).find(
      ([, w]) => w === word,
    )?.[0]
    if (directClass) {
      result.set(model, directClass)
      continue
    }

    // Variante sin ancla conocida: se asigna a la clase cuyo precio ancla
    // esté más cerca (ej. un codename muy caro cae junto al flagship).
    const score = priceScore(model)
    let closest: CompetitiveClass = 'Balanceado'
    let closestDistance = Infinity
    for (const [cls, anchorScore] of Object.entries(anchorScores) as [CompetitiveClass, number][]) {
      const distance = Math.abs(score - anchorScore)
      if (distance < closestDistance) {
        closestDistance = distance
        closest = cls
      }
    }
    result.set(model, closest)
  }

  return result
}

export function classifyModels(
  models: ModelPricing[],
): Record<CompetitiveClass, ModelPricing[]> {
  const byProvider = new Map<Provider, ModelPricing[]>()
  for (const model of models) {
    const list = byProvider.get(model.provider) ?? []
    list.push(model)
    byProvider.set(model.provider, list)
  }

  const classes: Record<CompetitiveClass, ModelPricing[]> = {
    Flagship: [],
    Balanceado: [],
    Económico: [],
    Razonamiento: [],
  }

  for (const [provider, providerModels] of byProvider) {
    const assignment = classifyProviderModels(provider, providerModels)
    for (const [model, cls] of assignment) {
      classes[cls].push(model)
    }
  }

  for (const cls of CLASS_ORDER) {
    classes[cls].sort((a, b) => priceScore(a) - priceScore(b))
  }

  return classes
}

/** Mapa id -> clase, útil para mostrar la categoría junto a cada modelo. */
export function classifyModelsById(
  models: ModelPricing[],
): Map<string, CompetitiveClass> {
  const classes = classifyModels(models)
  const byId = new Map<string, CompetitiveClass>()
  for (const cls of CLASS_ORDER) {
    for (const model of classes[cls]) byId.set(model.id, cls)
  }
  return byId
}

/**
 * El más barato de cada proveedor dentro de una clase (asume que `classModels`
 * ya viene ordenado por precio ascendente, como lo entrega classifyModels).
 * Sirve para armar un "vs" representativo con un clic desde los insights.
 */
export function representativePerProvider(classModels: ModelPricing[]): ModelPricing[] {
  const seen = new Set<Provider>()
  const result: ModelPricing[] = []
  for (const model of classModels) {
    if (seen.has(model.provider)) continue
    seen.add(model.provider)
    result.push(model)
  }
  return result
}
