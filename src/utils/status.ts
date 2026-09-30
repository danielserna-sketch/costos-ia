import type { ModelPricing } from '@/types/model'

export type ModelStatus = 'Nuevo' | 'Actual' | 'Por retirarse'

/** Días durante los que un modelo recién aparecido se marca como "Nuevo". */
export const NEW_WINDOW_DAYS = 45

function daysSince(date: string, now: Date): number {
  return (now.getTime() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000
}

/**
 * Estado derivado de los datos automáticos: "Nuevo" = apareció en el catálogo
 * hace poco (LiteLLM no publica fechas de lanzamiento), "Por retirarse" = el
 * proveedor anunció fecha de retiro.
 */
export function modelStatus(model: ModelPricing, now = new Date()): ModelStatus {
  if (model.deprecationDate) return 'Por retirarse'
  if (model.firstSeenAt && daysSince(model.firstSeenAt, now) <= NEW_WINDOW_DAYS) return 'Nuevo'
  return 'Actual'
}

/** Número de versión aproximado a partir del nombre (ej. "GPT-6.1 Sol" -> 6.1). */
export function versionNumber(model: ModelPricing): number {
  const match = model.name.match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

/**
 * Orden "más recientes primero": primero por fecha de aparición (los que no
 * tienen fecha van al final) y después por versión dentro de cada proveedor.
 */
export function compareNewest(a: ModelPricing, b: ModelPricing): number {
  const fa = a.firstSeenAt ?? ''
  const fb = b.firstSeenAt ?? ''
  if (fa !== fb) return fb.localeCompare(fa)
  return versionNumber(b) - versionNumber(a)
}
