import { useEffect, useMemo, useState } from 'react'
import { models } from '@/data/models'
import { usePortalState } from '@/state/PortalState'
import { useModelFilters, type ModelFilters } from '@/hooks/useModelFilters'
import { MAX_SELECTION } from '@/hooks/useModelSelection'
import { sortModels, defaultAscending, type SortKey } from '@/utils/sort'
import { strengths } from '@/utils/strengths'
import { CAPABILITY_SHORT_LABELS, MODALITY_LABELS } from '@/utils/capabilities'
import { formatUsd } from '@/utils/cost'
import { formatTokensShort } from '@/utils/format'
import { PageHeader } from '@/components/PageHeader'
import { FilterPanel } from '@/components/FilterPanel'
import { ModelCard } from '@/components/ModelCard'
import { ModelDrawer } from '@/components/ModelDrawer'
import { CatalogTable } from '@/components/CatalogTable'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { CARD_CLASS } from '@/components/ui/Card'

type FilterApi = ReturnType<typeof useModelFilters>

interface QuickFilter {
  label: string
  active: (f: ModelFilters) => boolean
  toggle: (api: FilterApi) => void
}

// Atajos a las preguntas más comunes; cada uno es un filtro normal del panel.
const QUICK_FILTERS: QuickFilter[] = [
  { label: '✦ Nuevos', active: (f) => f.onlyNew, toggle: (a) => a.setOnlyNew(!a.filters.onlyNew) },
  { label: 'Más baratos', active: (f) => f.strengths.includes('cheap'), toggle: (a) => a.toggleIn('strengths', 'cheap') },
  {
    label: 'Contexto ≥ 1M',
    active: (f) => f.minContext >= 1_000_000,
    toggle: (a) => a.setMinContext(a.filters.minContext >= 1_000_000 ? 0 : 1_000_000),
  },
  { label: 'Visión', active: (f) => f.modalities.includes('image'), toggle: (a) => a.toggleIn('modalities', 'image') },
  {
    label: 'Razonamiento',
    active: (f) => f.capabilities.includes('reasoning'),
    toggle: (a) => a.toggleIn('capabilities', 'reasoning'),
  },
  {
    label: 'Top en código',
    active: (f) => f.strengths.includes('quality:coding'),
    toggle: (a) => a.toggleIn('strengths', 'quality:coding'),
  },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'quality', label: 'Mayor calidad' },
  { key: 'input', label: 'Menor precio de entrada' },
  { key: 'output', label: 'Menor precio de salida' },
  { key: 'context', label: 'Mayor contexto' },
  { key: 'newest', label: 'Más nuevos' },
  { key: 'name', label: 'Nombre' },
]

const STRENGTH_LABELS: Record<string, string> = {
  cheap: 'Más baratos',
  'long-context': 'Documentos largos',
  multimodal: 'Audio / video',
  'quality:coding': 'Top en código',
  'quality:hard_prompts': 'Top en prompts difíciles',
  'quality:longer_query': 'Top en consultas largas',
  'quality:instruction_following': 'Top en seguir instrucciones',
  'quality:multi_turn': 'Top en conversación',
}

/** Filtros activos como chips removibles, en el mismo orden que el panel. */
function activeChips(api: FilterApi): { key: string; label: string; remove: () => void }[] {
  const { filters: f } = api
  return [
    ...(f.q ? [{ key: 'q', label: `“${f.q}”`, remove: () => api.setQuery('') }] : []),
    ...f.providers.map((p) => ({ key: `p:${p}`, label: p, remove: () => api.toggleIn('providers', p) })),
    ...f.classes.map((c) => ({ key: `c:${c}`, label: c, remove: () => api.toggleIn('classes', c) })),
    ...f.modalities.map((m) => ({
      key: `m:${m}`,
      label: `Acepta ${MODALITY_LABELS[m].toLowerCase()}`,
      remove: () => api.toggleIn('modalities', m),
    })),
    ...f.capabilities.map((c) => ({
      key: `k:${c}`,
      label: CAPABILITY_SHORT_LABELS[c],
      remove: () => api.toggleIn('capabilities', c),
    })),
    ...f.strengths.map((s) => ({
      key: `s:${s}`,
      label: STRENGTH_LABELS[s] ?? s,
      remove: () => api.toggleIn('strengths', s),
    })),
    ...(f.minContext
      ? [{ key: 'ctx', label: `Contexto ≥ ${formatTokensShort(f.minContext)}`, remove: () => api.setMinContext(0) }]
      : []),
    ...(f.maxInputPrice != null
      ? [{ key: 'price', label: `Entrada ≤ ${formatUsd(f.maxInputPrice)}`, remove: () => api.setMaxInputPrice(null) }]
      : []),
    ...(f.onlyNew ? [{ key: 'new', label: 'Solo nuevos', remove: () => api.setOnlyNew(false) }] : []),
  ]
}

export function Models() {
  const { classById, userSelectedIds, toggleCompare, compare } = usePortalState()
  const api = useModelFilters(models, classById)
  const { filters, results, activeCount } = api
  const [sheetOpen, setSheetOpen] = useState(false)
  // Borrador local del buscador para no reescribir la URL en cada tecla.
  const [query, setQuery] = useState(filters.q)
  const [syncedQ, setSyncedQ] = useState(filters.q)
  if (filters.q !== syncedQ) {
    // La URL cambió desde fuera (Limpiar, chip removido, atrás/adelante).
    setSyncedQ(filters.q)
    setQuery(filters.q)
  }
  const commitQuery = api.setQuery
  useEffect(() => {
    if (query === syncedQ) return
    const id = setTimeout(() => commitQuery(query), 200)
    return () => clearTimeout(id)
  }, [query, syncedQ, commitQuery])

  const sorted = useMemo(
    () => sortModels(results, filters.sort, filters.ascending, classById),
    [results, filters.sort, filters.ascending, classById],
  )
  const strengthsById = useMemo(() => new Map(models.map((m) => [m.id, strengths(m, models)])), [])
  const openModel = models.find((m) => m.id === api.openModelId) ?? null
  const chips = activeChips(api)
  const selectionFull = userSelectedIds.length >= MAX_SELECTION

  return (
    <>
      <PageHeader
        title="Modelos"
        description={`${models.length} modelos de ${new Set(models.map((m) => m.provider)).size} proveedores con precio, contexto, modalidades y calidad. Busca, filtra y abre cualquiera para ver el detalle.`}
      />

      <div className="flex flex-col gap-4">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o proveedor (ej. Sonnet, Gemini, Grok)"
          aria-label="Buscar modelos"
        />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {QUICK_FILTERS.map((q) => (
            <Chip key={q.label} active={q.active(filters)} onClick={() => q.toggle(api)}>
              {q.label}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{results.length}</span>{' '}
            {results.length === 1 ? 'modelo' : 'modelos'}
            {activeCount > 0 && ` · ${activeCount} ${activeCount === 1 ? 'filtro' : 'filtros'}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setSheetOpen(true)}>
              Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Ordenar</span>
              <select
                value={filters.sort}
                onChange={(e) => {
                  const key = e.target.value as SortKey
                  api.setSort(key, defaultAscending(key))
                }}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
                {!SORT_OPTIONS.some((o) => o.key === filters.sort) && <option value={filters.sort}>Columna de la tabla</option>}
              </select>
            </label>
            <div role="group" aria-label="Vista" className="hidden rounded-full border border-slate-300 p-0.5 sm:flex dark:border-slate-700">
              {(['cards', 'table'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={filters.view === v}
                  onClick={() => api.setView(v)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    filters.view === v
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {v === 'cards' ? 'Tarjetas' : 'Tabla'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">Filtrando:</span>
            {chips.map((c) => (
              <Chip key={c.key} active removable onClick={c.remove}>
                {c.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={api.clear}
              className="text-sm text-slate-500 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Limpiar todo
            </button>
          </div>
        )}

        <div className="flex gap-8">
          <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros">
            <div className="sticky top-20">
              <FilterPanel api={api} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {sorted.length === 0 ? (
              <div className={`${CARD_CLASS} flex flex-col items-center gap-3 p-10 text-center`}>
                <p className="font-medium text-slate-800 dark:text-slate-200">Ningún modelo cumple todos los filtros</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Prueba quitar {chips.length > 1 ? `“${chips[chips.length - 1].label}”` : 'el filtro'} o empieza de cero.
                </p>
                <div className="flex gap-2">
                  {chips.length > 1 && (
                    <Button variant="secondary" onClick={chips[chips.length - 1].remove}>
                      Quitar el último filtro
                    </Button>
                  )}
                  <Button onClick={api.clear}>Limpiar filtros</Button>
                </div>
              </div>
            ) : filters.view === 'table' ? (
              <div className="hidden sm:block">
                <CatalogTable
                  models={sorted}
                  classById={classById}
                  selectedIds={userSelectedIds}
                  isSelectionFull={selectionFull}
                  onToggle={toggleCompare}
                  onOpen={(m) => api.setOpenModelId(m.id)}
                  sort={{ key: filters.sort, ascending: filters.ascending }}
                  onSortChange={api.setSort}
                />
              </div>
            ) : null}
            {sorted.length > 0 && (
              // En móvil siempre tarjetas: la tabla exige scroll horizontal.
              <div
                className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 ${
                  filters.view === 'table' ? 'sm:hidden' : ''
                }`}
              >
                {sorted.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    modelClass={classById.get(m.id)}
                    strengths={strengthsById.get(m.id) ?? []}
                    selected={userSelectedIds.includes(m.id)}
                    selectionFull={selectionFull}
                    onToggle={() => toggleCompare(m.id)}
                    onOpen={() => api.setOpenModelId(m.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            tabIndex={-1}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Filtros</h2>
              <button type="button" onClick={api.clear} className="text-sm text-slate-500 underline dark:text-slate-400">
                Limpiar
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <FilterPanel api={api} />
            </div>
            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <Button className="w-full" onClick={() => setSheetOpen(false)}>
                Ver {results.length} {results.length === 1 ? 'modelo' : 'modelos'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {openModel && (
        <ModelDrawer
          model={openModel}
          models={models}
          classById={classById}
          isSelected={userSelectedIds.includes(openModel.id)}
          isSelectionFull={selectionFull}
          onToggleCompare={() => toggleCompare(openModel.id)}
          onCompareWith={compare}
          onOpen={(m) => api.setOpenModelId(m.id)}
          onClose={() => api.setOpenModelId(null)}
        />
      )}
    </>
  )
}
