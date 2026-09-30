import type { HTMLAttributes } from 'react'

export const CARD_CLASS =
  'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${CARD_CLASS} ${className}`} {...props} />
}
