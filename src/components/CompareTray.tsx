import { useLocation } from 'react-router'
import { models } from '@/data/models'
import { usePortalState } from '@/state/PortalState'
import { MAX_SELECTION, pickModels } from '@/hooks/useModelSelection'
import { providerColor } from '@/theme/providers'
import { ButtonLink } from '@/components/ui/Button'

/**
 * Bandeja fija con la selección del comparador, visible en cualquier página
 * (salvo en el propio comparador) para que agregar modelos tenga un destino
 * claro. Aparece solo cuando el usuario ya eligió algo.
 */
export function CompareTray() {
  const { pathname } = useLocation()
  const { userSelectedIds, toggleSelected } = usePortalState()
  if (userSelectedIds.length === 0 || pathname === '/comparador') return null

  const selected = pickModels(models, userSelectedIds)

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 sm:bottom-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
        <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {selected.map((m) => (
            <li
              key={m.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 py-0.5 pl-2 pr-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
            >
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: providerColor(m.provider) }} />
              {m.name}
              <button
                type="button"
                onClick={() => toggleSelected(m.id)}
                aria-label={`Quitar ${m.name} de la comparación`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <span className="hidden shrink-0 text-xs tabular-nums text-slate-400 sm:inline">
          {selected.length}/{MAX_SELECTION}
        </span>
        {selected.length < 2 ? (
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Agrega otro para comparar</span>
        ) : (
          <ButtonLink to="/comparador" className="shrink-0">
            Comparar →
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
