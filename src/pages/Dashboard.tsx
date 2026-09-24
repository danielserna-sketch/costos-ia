import { useMemo, useState } from 'react'
import { useUsage } from '@/hooks/useUsage'
import { useModelSelection, pickModels, MAX_SELECTION } from '@/hooks/useModelSelection'
import { calculateModelCost } from '@/utils/cost'
import { UsageForm } from '@/components/UsageForm'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ComparisonChart } from '@/components/ComparisonChart'
import { ProviderFilter } from '@/components/ProviderFilter'
import { ModelPicker } from '@/components/ModelPicker'
import { PricingChanges } from '@/components/PricingChanges'
import { Header } from '@/components/Header'
import type { Provider } from '@/types/model'
import { models, pricingChanges, providers } from '@/data/models'

export function Dashboard() {
  const { usage, setUsage } = useUsage()
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    ...providers,
  ])
  const { selectedIds, toggle, isFull } = useModelSelection(models)

  const visibleModels = models.filter((m) => selectedProviders.includes(m.provider))
  const filteredChanges = pricingChanges.filter((c) =>
    selectedProviders.includes(c.provider),
  )

  const selectedModels = pickModels(models, selectedIds)
  const results = useMemo(
    () => selectedModels.map((model) => calculateModelCost(model, usage)),
    [selectedModels, usage],
  )

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        {filteredChanges.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Cambios de precio recientes
            </h2>
            <PricingChanges changes={filteredChanges} />
          </section>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              1. Elige hasta {MAX_SELECTION} modelos para comparar
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {selectedIds.length}/{MAX_SELECTION} seleccionados
              </span>
              <ProviderFilter
                selected={selectedProviders}
                onChange={setSelectedProviders}
              />
            </div>
          </div>
          <ModelPicker
            models={visibleModels}
            providers={providers.filter((p) => selectedProviders.includes(p))}
            selectedIds={selectedIds}
            onToggle={toggle}
            isFull={isFull}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            2. Ajusta tu volumen de uso
          </h2>
          <UsageForm usage={usage} onChange={setUsage} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            3. Comparación
          </h2>
          {results.length >= 2 ? (
            <>
              <ComparisonTable results={results} onRemove={toggle} />
              <ComparisonChart results={results} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Selecciona al menos 2 modelos arriba para verlos comparados lado
              a lado.
            </div>
          )}
        </section>
      </div>
    </>
  )
}
