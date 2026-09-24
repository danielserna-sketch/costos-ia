import { useMemo, useRef, useState } from 'react'
import { useUsage } from '@/hooks/useUsage'
import { useModelSelection, pickModels, MAX_SELECTION } from '@/hooks/useModelSelection'
import { calculateModelCost } from '@/utils/cost'
import { classifyModelsById } from '@/utils/classify'
import { UsageForm } from '@/components/UsageForm'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ComparisonChart } from '@/components/ComparisonChart'
import { ProviderFilter } from '@/components/ProviderFilter'
import { ModelPicker } from '@/components/ModelPicker'
import { PricingChanges } from '@/components/PricingChanges'
import { InsightsPanel } from '@/components/InsightsPanel'
import { Header } from '@/components/Header'
import type { ModelPricing, Provider } from '@/types/model'
import { models, pricingChanges, providers } from '@/data/models'

export function Dashboard() {
  const { usage, setUsage } = useUsage()
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    ...providers,
  ])
  const { selectedIds, toggle, select, isFull } = useModelSelection(models)
  const comparatorRef = useRef<HTMLElement>(null)

  const visibleModels = models.filter((m) => selectedProviders.includes(m.provider))
  const filteredChanges = pricingChanges.filter((c) =>
    selectedProviders.includes(c.provider),
  )
  const classById = useMemo(() => classifyModelsById(models), [])

  const selectedModels = pickModels(models, selectedIds)
  const results = useMemo(
    () => selectedModels.map((model) => calculateModelCost(model, usage)),
    [selectedModels, usage],
  )

  const handleCompare = (modelsToCompare: ModelPricing[]) => {
    select(modelsToCompare.map((m) => m.id))
    comparatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
              Volumen de uso y proveedores
            </h2>
            <ProviderFilter
              selected={selectedProviders}
              onChange={setSelectedProviders}
            />
          </div>
          <UsageForm usage={usage} onChange={setUsage} />
        </section>

        <section ref={comparatorRef} className="flex flex-col gap-3 scroll-mt-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Comparar modelos entre proveedores
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Elige hasta {MAX_SELECTION} modelos de cualquier proveedor y
              míralos lado a lado: precio, contexto y costo estimado a tu
              volumen de uso.
            </p>
          </div>

          <div className="flex items-center justify-end">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {selectedIds.length}/{MAX_SELECTION} seleccionados
            </span>
          </div>
          <ModelPicker
            models={visibleModels}
            providers={providers.filter((p) => selectedProviders.includes(p))}
            selectedIds={selectedIds}
            onToggle={toggle}
            isFull={isFull}
            classById={classById}
          />

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

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Insights: quién compite con quién
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Agrupación automática por posicionamiento de precio dentro de
              cada proveedor. Usa "Comparar estos" para mandar una categoría
              completa al comparador de arriba.
            </p>
          </div>
          <InsightsPanel
            models={visibleModels}
            usage={usage}
            onCompare={handleCompare}
          />
        </section>
      </div>
    </>
  )
}
