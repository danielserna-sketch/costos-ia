import { useState } from 'react'
import { useModelCosts } from '@/hooks/useModelCosts'
import { UsageForm } from '@/components/UsageForm'
import { CostTable } from '@/components/CostTable'
import { CostChart } from '@/components/CostChart'
import { ProviderFilter } from '@/components/ProviderFilter'
import { SummaryCards } from '@/components/SummaryCards'
import { Header } from '@/components/Header'
import type { Provider } from '@/types/model'
import { providers } from '@/data/models'

export function Dashboard() {
  const { usage, setUsage, results } = useModelCosts()
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    ...providers,
  ])

  const filteredResults = results.filter((r) =>
    selectedProviders.includes(r.model.provider),
  )

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Volumen de uso estimado
          </h2>
          <UsageForm usage={usage} onChange={setUsage} />
        </section>

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
