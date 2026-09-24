import { Link } from 'react-router'
import { usePortalState } from '@/state/PortalState'
import { pricingChanges } from '@/data/models'
import { MAX_SELECTION } from '@/hooks/useModelSelection'
import { PageHeader, SectionTitle } from '@/components/PageHeader'
import { ProviderFilter } from '@/components/ProviderFilter'
import { PricingChanges } from '@/components/PricingChanges'
import { InsightsPanel } from '@/components/InsightsPanel'
import { CatalogTable } from '@/components/CatalogTable'

export function Market() {
  const {
    usage,
    task,
    visibleModels,
    selectedProviders,
    setSelectedProviders,
    classById,
    selectedIds,
    isSelectionFull,
    toggleSelected,
    compare,
  } = usePortalState()

  const changes = pricingChanges.filter((c) => selectedProviders.includes(c.provider))

  return (
    <>
      <PageHeader
        title="Mercado"
        description="El estado actual de los modelos de Anthropic, OpenAI y Google: quién compite con quién, cambios de precio y el catálogo completo."
        actions={
          <ProviderFilter selected={selectedProviders} onChange={setSelectedProviders} />
        }
      />

      <div className="flex flex-col gap-10">
        {changes.length > 0 && (
          <section className="flex flex-col gap-4">
            <SectionTitle title="Cambios de precio recientes" />
            <PricingChanges changes={changes} />
          </section>
        )}

        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Quién compite con quién"
            subtitle={`Modelos agrupados por posicionamiento de precio. Costo mensual calculado con el escenario de "${task.name}" (${usage.requestsPerMonth.toLocaleString('es-CO')} requests/mes).`}
          />
          <InsightsPanel models={visibleModels} usage={usage} onCompare={compare} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <SectionTitle
              title="Catálogo completo"
              subtitle="Ordena por cualquier columna. Agrega modelos al comparador desde aquí."
            />
            {selectedIds.length > 0 && (
              <Link
                to="/comparador"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                Ver comparación ({selectedIds.length}/{MAX_SELECTION}) →
              </Link>
            )}
          </div>
          <CatalogTable
            models={visibleModels}
            classById={classById}
            selectedIds={selectedIds}
            isSelectionFull={isSelectionFull}
            onToggle={toggleSelected}
          />
        </section>
      </div>
    </>
  )
}
