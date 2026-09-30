import type { ModelPricing } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { compareNewest } from '@/utils/status'

export type SortKey = 'name' | 'class' | 'input' | 'output' | 'context' | 'quality' | 'newest'

const CLASS_RANK: Record<CompetitiveClass, number> = {
  Económico: 0,
  Balanceado: 1,
  Flagship: 2,
  Razonamiento: 3,
}

/** Dirección natural al elegir una clave: precios de menor a mayor, el resto de mayor a menor. */
export function defaultAscending(key: SortKey): boolean {
  return key === 'name' || key === 'class' || key === 'input' || key === 'output'
}

export function sortModels(
  models: ModelPricing[],
  key: SortKey,
  ascending: boolean,
  classById: Map<string, CompetitiveClass>,
): ModelPricing[] {
  if (key === 'newest') {
    const sorted = [...models].sort(compareNewest)
    return ascending ? sorted.reverse() : sorted
  }
  const value = (m: ModelPricing): number | string => {
    switch (key) {
      case 'name':
        return m.name
      case 'class':
        return CLASS_RANK[classById.get(m.id) ?? 'Balanceado']
      case 'input':
        return m.inputPricePerMTokens
      case 'output':
        return m.outputPricePerMTokens
      case 'context':
        return m.contextWindow
      case 'quality':
        // Sin puntaje siempre al final, en cualquier dirección.
        return m.quality?.overall?.rating ?? (ascending ? Infinity : -Infinity)
    }
  }
  return [...models].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
    return ascending ? cmp : -cmp
  })
}
