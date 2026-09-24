import { usePortalState } from '@/state/PortalState'
import { models, providers } from '@/data/models'
import { UsageForm } from '@/components/UsageForm'
import { BaselineSelect } from '@/components/BaselineSelect'
import { ProviderFilter } from '@/components/ProviderFilter'

/** Volumen de uso, modelo actual y proveedores: el "escenario" compartido entre páginas. */
export function ScenarioPanel() {
  const {
    usage,
    setUsage,
    baselineId,
    setBaselineId,
    selectedProviders,
    setSelectedProviders,
  } = usePortalState()

  return (
    <div className="flex flex-col gap-3">
      <UsageForm usage={usage} onChange={setUsage} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BaselineSelect
          models={models}
          providers={providers}
          value={baselineId}
          onChange={setBaselineId}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Proveedores</span>
          <ProviderFilter selected={selectedProviders} onChange={setSelectedProviders} />
        </div>
      </div>
    </div>
  )
}
