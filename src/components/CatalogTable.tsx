import { useState } from 'react'
import type { ModelPricing } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { formatUsd } from '@/utils/cost'
import { formatTokensShort } from '@/utils/format'
import { modelStatus } from '@/utils/status'
import { defaultAscending, sortModels, type SortKey } from '@/utils/sort'
import { ProviderBadge } from '@/components/ProviderBadge'
import { ModalityList } from '@/components/ModelBits'
import { StatusBadge } from '@/components/ui/Badge'

interface CatalogTableProps {
  models: ModelPricing[]
  classById: Map<string, CompetitiveClass>
  selectedIds: string[]
  isSelectionFull: boolean
  onToggle: (id: string) => void
  /** Si se pasa, el nombre del modelo abre su detalle. */
  onOpen?: (model: ModelPricing) => void
  /** Orden controlado desde afuera (ej. el selector del directorio). */
  sort?: { key: SortKey; ascending: boolean }
  onSortChange?: (key: SortKey, ascending: boolean) => void
}

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Modelo', numeric: false },
  { key: 'class', label: 'Categoría', numeric: false },
  { key: 'quality', label: 'Calidad', numeric: true },
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
  onOpen,
  sort,
  onSortChange,
}: CatalogTableProps) {
  const [localSort, setLocalSort] = useState<{ key: SortKey; ascending: boolean }>({
    key: 'quality',
    ascending: false,
  })
  const current = sort ?? localSort
  const sorted = sortModels(models, current.key, current.ascending, classById)

  const onSort = (key: SortKey) => {
    const next = key === current.key ? !current.ascending : defaultAscending(key)
    if (onSortChange) onSortChange(key, next)
    else setLocalSort({ key, ascending: next })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key}
                aria-sort={
                  current.key === col.key ? (current.ascending ? 'ascending' : 'descending') : 'none'
                }
                className={`px-4 py-3 font-medium ${
                  i === 0 ? 'sticky left-0 z-10 bg-white dark:bg-slate-900' : ''
                } ${col.numeric ? 'text-right' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  {col.label}
                  <span aria-hidden className="w-2 text-xs">
                    {current.key === col.key ? (current.ascending ? '↑' : '↓') : ''}
                  </span>
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-medium">Entrada acepta</th>
            <th className="px-4 py-3 font-medium">
              <span className="sr-only">Comparar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const selected = selectedIds.includes(m.id)
            return (
              <tr key={m.id} className="group border-b border-slate-100 last:border-0 dark:border-slate-800">
                <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800/60">
                  <div className="flex flex-col gap-1">
                    {onOpen ? (
                      <button
                        type="button"
                        onClick={() => onOpen(m)}
                        className="w-fit text-left font-medium text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {m.name}
                      </button>
                    ) : (
                      <span className="font-medium text-slate-900 dark:text-slate-100">{m.name}</span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <ProviderBadge provider={m.provider} />
                      <StatusBadge status={modelStatus(m)} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 group-hover:bg-slate-50 dark:text-slate-300 dark:group-hover:bg-slate-800/60">
                  {classById.get(m.id) ?? '—'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 group-hover:bg-slate-50 dark:text-slate-200 dark:group-hover:bg-slate-800/60">
                  {m.quality?.overall?.rating ?? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Sin puntaje</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 group-hover:bg-slate-50 dark:text-slate-200 dark:group-hover:bg-slate-800/60">
                  {formatUsd(m.inputPricePerMTokens)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 group-hover:bg-slate-50 dark:text-slate-200 dark:group-hover:bg-slate-800/60">
                  {formatUsd(m.outputPricePerMTokens)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 group-hover:bg-slate-50 dark:text-slate-200 dark:group-hover:bg-slate-800/60">
                  {formatTokensShort(m.contextWindow)}
                </td>
                <td className="px-4 py-3 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60">
                  <div className="min-w-[8.5rem]">
                    <ModalityList model={m} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right group-hover:bg-slate-50 dark:group-hover:bg-slate-800/60">
                  <button
                    type="button"
                    onClick={() => onToggle(m.id)}
                    disabled={!selected && isSelectionFull}
                    aria-pressed={selected}
                    aria-label={`${selected ? 'Quitar' : 'Agregar'} ${m.name} ${selected ? 'de' : 'a'} la comparación`}
                    className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {selected ? '✓ Comparando' : '+ Comparar'}
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
