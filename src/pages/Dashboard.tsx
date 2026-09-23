import { useState } from 'react'
import { useModelCosts } from '@/hooks/useModelCosts'
import { UsageForm } from '@/components/UsageForm'
import { CostTable } from '@/components/CostTable'
import { CostChart } from '@/components/CostChart'
import { ProviderFilter } from '@/components/ProviderFilter'
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
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Tablero comparativo de costos de IA
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Compara el costo estimado de los modelos de Anthropic (Claude), OpenAI
          y Google (Gemini) según tu volumen de uso.
        </p>
      </header>

      <UsageForm usage={usage} onChange={setUsage} />

      <ProviderFilter selected={selectedProviders} onChange={setSelectedProviders} />

      <CostChart results={filteredResults} />

      <CostTable results={filteredResults} />
    </div>
  )
}
