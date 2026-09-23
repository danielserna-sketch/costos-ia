import type { ModelPricing } from '@/types/model'
import { formatUsd } from '@/utils/cost'
import { formatContextWindow } from '@/utils/format'

export function ModelCard({ model }: { model: ModelPricing }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          {model.name}
        </p>
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {formatContextWindow(model.contextWindow)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Entrada / 1M
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {formatUsd(model.inputPricePerMTokens)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Salida / 1M
          </p>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {formatUsd(model.outputPricePerMTokens)}
          </p>
        </div>
      </div>

      {model.cachedInputPricePerMTokens !== undefined && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Entrada en caché: {formatUsd(model.cachedInputPricePerMTokens)} / 1M
        </p>
      )}

      {model.notes && (
        <p className="text-xs italic text-slate-400 dark:text-slate-500">
          {model.notes}
        </p>
      )}
    </div>
  )
}
