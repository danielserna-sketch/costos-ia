import type { ModelPricing } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { formatTokensShort } from '@/utils/format'
import { modelStatus } from '@/utils/status'
import type { Strength } from '@/utils/strengths'
import { ProviderBadge } from '@/components/ProviderBadge'
import { ModalityList, PriceTag } from '@/components/ModelBits'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { CARD_CLASS } from '@/components/ui/Card'

interface ModelCardProps {
  model: ModelPricing
  modelClass?: CompetitiveClass
  strengths: Strength[]
  selected: boolean
  selectionFull: boolean
  onToggle: () => void
  onOpen: () => void
}

// Máximo cinco datos visibles: identidad, precio, contexto, modalidades y
// hasta dos fortalezas. El resto vive en el detalle (ModelDrawer).
export function ModelCard({ model, modelClass, strengths, selected, selectionFull, onToggle, onOpen }: ModelCardProps) {
  return (
    <article
      className={`${CARD_CLASS} group relative flex flex-col gap-4 p-4 transition-shadow hover:shadow-md ${
        selected ? 'ring-2 ring-slate-900 dark:ring-slate-100' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {/* El botón cubre toda la tarjeta (after:inset-0) para que sea clicable completa. */}
            <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-['']">
              {model.name}
            </button>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <ProviderBadge provider={model.provider} />
            {modelClass && <Badge>{modelClass}</Badge>}
            <StatusBadge status={modelStatus(model)} />
          </div>
        </div>
        <label
          className={`relative z-10 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            selected
              ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
              : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
          } ${!selected && selectionFull ? 'cursor-not-allowed opacity-40' : ''}`}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={selected}
            disabled={!selected && selectionFull}
            onChange={onToggle}
            aria-label={`Comparar ${model.name}`}
          />
          {selected ? '✓ Comparar' : '+ Comparar'}
        </label>
      </div>

      <PriceTag model={model} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            {formatTokensShort(model.contextWindow)}
          </span>{' '}
          contexto
        </span>
        <ModalityList model={model} />
      </div>

      {strengths.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
          {strengths.slice(0, 2).map((s) => (
            <li
              key={s.id}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              title={s.reason}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
