import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Capability, InputModality, ModelPricing, Provider } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { modelStatus } from '@/utils/status'
import { strengths } from '@/utils/strengths'
import { defaultAscending, type SortKey } from '@/utils/sort'

export interface ModelFilters {
  q: string
  providers: Provider[]
  classes: CompetitiveClass[]
  modalities: InputModality[]
  capabilities: Capability[]
  /** Ids de fortaleza (ver utils/strengths), ej. "quality:coding", "cheap". */
  strengths: string[]
  minContext: number
  maxInputPrice: number | null
  onlyNew: boolean
  sort: SortKey
  ascending: boolean
  view: 'cards' | 'table'
}

const SORT_KEYS: SortKey[] = ['name', 'class', 'input', 'output', 'context', 'quality', 'newest']

function list<T extends string>(params: URLSearchParams, key: string): T[] {
  const raw = params.get(key)
  return raw ? (raw.split(',').filter(Boolean) as T[]) : []
}

function parse(params: URLSearchParams): ModelFilters {
  const sortParam = params.get('orden') as SortKey | null
  const sort = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'quality'
  const dir = params.get('dir')
  const maxIn = Number(params.get('maxEntrada'))
  return {
    q: params.get('q') ?? '',
    providers: list<Provider>(params, 'proveedor'),
    classes: list<CompetitiveClass>(params, 'categoria'),
    modalities: list<InputModality>(params, 'entrada'),
    capabilities: list<Capability>(params, 'capacidad'),
    strengths: list(params, 'fuerte'),
    minContext: Number(params.get('contextoMin')) || 0,
    maxInputPrice: maxIn > 0 ? maxIn : null,
    onlyNew: params.get('estado') === 'nuevo',
    sort,
    ascending: dir ? dir === 'asc' : defaultAscending(sort),
    view: params.get('vista') === 'tabla' ? 'table' : 'cards',
  }
}

type ListKey = 'providers' | 'classes' | 'modalities' | 'capabilities' | 'strengths'

const PARAM_NAMES: Record<ListKey, string> = {
  providers: 'proveedor',
  classes: 'categoria',
  modalities: 'entrada',
  capabilities: 'capacidad',
  strengths: 'fuerte',
}

/**
 * Filtros del directorio guardados en la URL (se pueden compartir y
 * sobreviven a una recarga). Entre grupos se combinan con AND. Dentro de un
 * grupo: proveedor y categoría con OR ("Anthropic o Google"); modalidades,
 * capacidades y fortalezas con AND ("imágenes y PDF"), que es lo que se
 * espera al pedir requisitos.
 */
export function useModelFilters(allModels: ModelPricing[], classById: Map<string, CompetitiveClass>) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parse(params), [params])

  const strengthIds = useMemo(
    () => new Map(allModels.map((m) => [m.id, new Set(strengths(m, allModels).map((s) => s.id))])),
    [allModels],
  )

  const update = (mutate: (next: URLSearchParams) => void) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        mutate(next)
        return next
      },
      { replace: true },
    )
  }

  const setParam = (key: string, value: string | null) =>
    update((next) => (value ? next.set(key, value) : next.delete(key)))

  const toggleIn = <K extends ListKey>(key: K, value: ModelFilters[K][number]) => {
    const current = filters[key] as string[]
    const nextList = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setParam(PARAM_NAMES[key], nextList.length ? nextList.join(',') : null)
  }

  const clear = () =>
    update((next) => {
      for (const key of [
        'q',
        ...Object.values(PARAM_NAMES),
        'contextoMin',
        'maxEntrada',
        'estado',
      ]) {
        next.delete(key)
      }
    })

  const activeCount =
    (filters.q ? 1 : 0) +
    filters.providers.length +
    filters.classes.length +
    filters.modalities.length +
    filters.capabilities.length +
    filters.strengths.length +
    (filters.minContext ? 1 : 0) +
    (filters.maxInputPrice ? 1 : 0) +
    (filters.onlyNew ? 1 : 0)

  const results = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return allModels.filter((m) => {
      if (q && !`${m.name} ${m.provider} ${m.id}`.toLowerCase().includes(q)) return false
      if (filters.providers.length && !filters.providers.includes(m.provider)) return false
      const cls = classById.get(m.id)
      if (filters.classes.length && (!cls || !filters.classes.includes(cls))) return false
      if (!filters.modalities.every((mod) => m.inputModalities?.includes(mod))) return false
      if (!filters.capabilities.every((cap) => m.capabilities?.includes(cap))) return false
      const own = strengthIds.get(m.id)
      if (!filters.strengths.every((s) => own?.has(s))) return false
      if (filters.minContext && m.contextWindow < filters.minContext) return false
      if (filters.maxInputPrice != null && m.inputPricePerMTokens > filters.maxInputPrice) return false
      if (filters.onlyNew && modelStatus(m) !== 'Nuevo') return false
      return true
    })
  }, [allModels, classById, filters, strengthIds])

  return {
    filters,
    results,
    activeCount,
    toggleIn,
    clear,
    setQuery: (q: string) => setParam('q', q || null),
    setMinContext: (n: number) => setParam('contextoMin', n ? String(n) : null),
    setMaxInputPrice: (n: number | null) => setParam('maxEntrada', n ? String(n) : null),
    setOnlyNew: (v: boolean) => setParam('estado', v ? 'nuevo' : null),
    setSort: (key: SortKey, ascending: boolean) =>
      update((next) => {
        next.set('orden', key)
        next.set('dir', ascending ? 'asc' : 'desc')
      }),
    setView: (view: 'cards' | 'table') => setParam('vista', view === 'table' ? 'tabla' : null),
    openModelId: params.get('modelo'),
    setOpenModelId: (id: string | null) => setParam('modelo', id),
  }
}
