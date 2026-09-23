import type { ModelPricing, Provider } from '@/types/model'
import { ProviderBadge } from '@/components/ProviderBadge'
import { ModelCard } from '@/components/ModelCard'

interface ModelCatalogProps {
  models: ModelPricing[]
  providers: readonly Provider[]
}

export function ModelCatalog({ models, providers }: ModelCatalogProps) {
  const grouped = providers.map((provider) => ({
    provider,
    models: models.filter((m) => m.provider === provider),
  }))

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ provider, models: providerModels }) => (
        <div key={provider} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ProviderBadge provider={provider} />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {providerModels.length} modelo
              {providerModels.length === 1 ? '' : 's'} activo
              {providerModels.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providerModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
