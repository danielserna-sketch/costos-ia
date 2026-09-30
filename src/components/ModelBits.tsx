import type { ModelPricing } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { MODALITY_LABELS, MODALITY_ORDER } from '@/utils/capabilities'

/** Precio entrada / salida con la unidad explícita. */
export function PriceTag({ model, size = 'md' }: { model: ModelPricing; size?: 'md' | 'lg' }) {
  const value = size === 'lg' ? 'text-lg' : 'text-sm'
  return (
    <div className="flex items-baseline gap-3 tabular-nums">
      <div className="flex flex-col">
        <span className={`${value} font-semibold text-slate-900 dark:text-slate-100`}>
          {formatUsd(model.inputPricePerMTokens)}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">entrada</span>
      </div>
      <span className="text-slate-300 dark:text-slate-600">/</span>
      <div className="flex flex-col">
        <span className={`${value} font-semibold text-slate-900 dark:text-slate-100`}>
          {formatUsd(model.outputPricePerMTokens)}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">salida · 1M tokens</span>
      </div>
    </div>
  )
}

/** Modalidades de entrada además de texto (el texto se da por hecho). */
export function ModalityList({ model }: { model: ModelPricing }) {
  const extra = MODALITY_ORDER.filter((m) => m !== 'text' && model.inputModalities?.includes(m))
  if (!model.inputModalities) return null
  if (extra.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">Solo texto</span>
  }
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Modalidades de entrada">
      {extra.map((m) => (
        <li
          key={m}
          className="rounded border border-slate-200 px-1.5 py-px text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          {MODALITY_LABELS[m]}
        </li>
      ))}
    </ul>
  )
}

/**
 * Barra de calidad relativa al rango del catálogo (el Elo crudo no dice nada
 * por sí solo); el valor exacto queda como texto secundario.
 */
export function QualityMeter({
  rating,
  min,
  max,
  label,
  rank,
}: {
  rating: number
  min: number
  max: number
  label: string
  rank?: { rank: number; total: number } | null
}) {
  const pct = max > min ? Math.min(100, Math.max(4, ((rating - min) / (max - min)) * 100)) : 100
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {rank ? `#${rank.rank} de ${rank.total} · ` : ''}
          {rating}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-slate-700 dark:bg-slate-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
