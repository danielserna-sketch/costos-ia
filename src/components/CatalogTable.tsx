import { useState } from 'react'
import type { ModelPricing } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'
import { ProviderBadge } from '@/components/ProviderBadge'

interface CatalogTableProps {
  models: ModelPricing[]
  classById: Map<string, CompetitiveClass>
  selectedIds: string[]
  isSelectionFull: boolean
  onToggle: (id: string) => void
}

type SortKey = 'name' | 'class' | 'input' | 'output' | 'context' | 'quality'

const CLASS_RANK: Record<CompetitiveClass, number> = {
  Económico: 0,
  Balanceado: 1,
  Flagship: 2,
  Razonamiento: 3,
}

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Modelo', numeric: false },
  { key: 'class', label: 'Categoría', numeric: false },
  { key: 'quality', label: 'Calidad general', numeric: true },
  { key: 'input', label: 'Entrada / 1M', numeric: true },
  { key: 'output', label: 'Salida / 1M', numeric: true },
  { key: 'context', label: 'Contexto', numeric: true },
]

export function CatalogTable({
  models,
  classById,
  selectedIds,
  isSelectionFull,
  onToggle,
}: CatalogTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('quality')
  const [ascending, setAscending] = useState(false)

  const value = (m: ModelPricing): number | string => {
    switch (sortKey) {
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
        return m.quality?.overall?.rating ?? -Infinity
    }
  }

  const sorted = [...models].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
    return ascending ? cmp : -cmp
  })

  const onSort = (key: SortKey, numeric: boolean) => {
    if (key === sortKey) {
      setAscending(!ascending)
    } else {
      setSortKey(key)
      setAscending(!numeric || key === 'input' || key === 'output')
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium">
                <button
                  type="button"
                  onClick={() => onSort(col.key, col.numeric)}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  {col.label}
                  <span className="text-xs">
                    {sortKey === col.key ? (ascending ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Comparar</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const selected = selectedIds.includes(m.id)
            return (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProviderBadge provider={m.provider} />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {classById.get(m.id) ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {m.quality?.overall?.rating ?? (
                    <span className="text-slate-400 dark:text-slate-500">Sin puntaje</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {formatUsd(m.inputPricePerMTokens)}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {formatUsd(m.outputPricePerMTokens)}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {formatContextWindow(m.contextWindow)}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggle(m.id)}
                    disabled={!selected && isSelectionFull}
                    aria-pressed={selected}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {selected ? '✓ Agregado' : '+ Agregar'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
