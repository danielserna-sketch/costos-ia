import { useState } from 'react'
import type { ModelPricing, Provider } from '@/types/model'

export const MAX_SELECTION = 4

function defaultSelection(models: ModelPricing[]): string[] {
  const seen = new Set<Provider>()
  const ids: string[] = []
  const cheapestFirst = [...models].sort(
    (a, b) => a.inputPricePerMTokens - b.inputPricePerMTokens,
  )
  for (const model of cheapestFirst) {
    if (seen.has(model.provider)) continue
    seen.add(model.provider)
    ids.push(model.id)
    if (ids.length === Math.min(3, MAX_SELECTION)) break
  }
  return ids
}

export function useModelSelection(models: ModelPricing[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    defaultSelection(models),
  )
  // false mientras siga la selección por defecto: la bandeja de comparación
  // solo aparece cuando el usuario eligió algo.
  const [touched, setTouched] = useState(false)

  const toggle = (id: string) => {
    setTouched(true)
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTION) return prev
      return [...prev, id]
    })
  }

  // Desde fuera del comparador, el primer clic parte de cero en vez de sumar
  // a la selección por defecto (que el usuario nunca vio).
  const toggleFresh = (id: string) => {
    if (touched) toggle(id)
    else select([id])
  }

  const select = (ids: string[]) => {
    setTouched(true)
    setSelectedIds(ids.slice(0, MAX_SELECTION))
  }

  return {
    selectedIds,
    toggle,
    toggleFresh,
    select,
    isFull: touched && selectedIds.length >= MAX_SELECTION,
    touched,
  }
}

export function pickModels(models: ModelPricing[], ids: string[]): ModelPricing[] {
  const byId = new Map(models.map((m) => [m.id, m]))
  return ids
    .map((id) => byId.get(id))
    .filter((m): m is ModelPricing => Boolean(m))
}
