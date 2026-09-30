import type { ReactNode } from 'react'
import type { ModelStatus } from '@/utils/status'

export type BadgeTone = 'neutral' | 'new' | 'warning' | 'positive'

// "Nuevo" usa tinta sólida (no un matiz) para no chocar con los colores de
// proveedor ni con los semánticos de ahorro/aviso.
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  new: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  positive: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

/** Badge de estado; "Actual" no se muestra para no agregar ruido. */
export function StatusBadge({ status }: { status: ModelStatus }) {
  if (status === 'Nuevo') return <Badge tone="new">✦ Nuevo</Badge>
  if (status === 'Por retirarse') return <Badge tone="warning">⚠ Por retirarse</Badge>
  return null
}
