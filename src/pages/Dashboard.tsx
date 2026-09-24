import { useState } from 'react'
import { useModelCosts } from '@/hooks/useModelCosts'
import { UsageForm } from '@/components/UsageForm'
import { CostTable } from '@/components/CostTable'
import { CostChart } from '@/components/CostChart'
import { ProviderFilter } from '@/components/ProviderFilter'
import { SummaryCards } from '@/components/SummaryCards'
import { ModelCatalog } from '@/components/ModelCatalog'
import { PricingChanges } from '@/components/PricingChanges'
import { Header } from '@/components/Header'
import type { Provider } from '@/types/model'
import { models, pricingChanges, providers } from '@/data/models'

export function Dashboard() {
  const { usage, setUsage, results } = useModelCosts()
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    ...providers,
  ])

  const filteredResults = results.filter((r) =>
    selectedProviders.includes(r.model.provider),
  )
  const filteredModels = models.filter((m) =>
    selectedProviders.includes(m.provider),
  )
  const filteredChanges = pricingChanges.filter((c) =>
    selectedProviders.includes(c.provider),
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
              Proveedores
            </h2>
            <ProviderFilter
              selected={selectedProviders}
              onChange={setSelectedProviders}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Modelos activos
          </h2>
          <ModelCatalog
            models={filteredModels}
            providers={providers.filter((p) => selectedProviders.includes(p))}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Volumen de uso estimado
          </h2>
          <UsageForm usage={usage} onChange={setUsage} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Resumen de costos
          </h2>
          <SummaryCards results={filteredResults} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Costo mensual por modelo
          </h2>
          <CostChart results={filteredResults} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Detalle comparativo
          </h2>
          <CostTable results={filteredResults} />
        </section>
      </div>
    </>
  )
}
