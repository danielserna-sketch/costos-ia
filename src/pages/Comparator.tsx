import { useMemo } from 'react'
import { Link } from 'react-router'
import { usePortalState } from '@/state/PortalState'
import { models, providers } from '@/data/models'
import { MAX_SELECTION, pickModels } from '@/hooks/useModelSelection'
import { calculateModelCost } from '@/utils/cost'
import { PageHeader, SectionTitle } from '@/components/PageHeader'
import { ScenarioPanel } from '@/components/ScenarioPanel'
import { ModelPicker } from '@/components/ModelPicker'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ComparisonChart } from '@/components/ComparisonChart'

export function Comparator() {
  const {
    task,
    usage,
    baseline,
    visibleModels,
    selectedProviders,
    selectedIds,
    toggleSelected,
    isSelectionFull,
    classById,
  } = usePortalState()

  const results = useMemo(
    () => pickModels(models, selectedIds).map((m) => calculateModelCost(m, usage)),
    [selectedIds, usage],
  )

  return (
    <>
      <PageHeader
        title="Comparador"
        description={`Elige hasta ${MAX_SELECTION} modelos de cualquier proveedor y míralos lado a lado: calidad, precio, contexto y costo a tu volumen de uso.`}
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <SectionTitle
              title="Escenario"
              subtitle={`Calidad medida para "${task.name}".`}
            />
            <Link
              to="/recomendador"
              className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cambiar tarea
            </Link>
          </div>
          <ScenarioPanel />
        </section>

        {results.length >= 2 ? (
          <section className="flex flex-col gap-4">
            <SectionTitle title="Comparación" />
            <ComparisonTable
              results={results}
              onRemove={toggleSelected}
              baseline={baseline}
              qualityCategory={task.qualityCategory}
            />
            <ComparisonChart results={results} />
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Selecciona al menos 2 modelos abajo para verlos comparados lado a lado.
          </div>
        )}

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <SectionTitle title="Modelos" subtitle="Toca un modelo para agregarlo o quitarlo." />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {selectedIds.length}/{MAX_SELECTION} seleccionados
            </span>
          </div>
          <ModelPicker
            models={visibleModels}
            providers={providers.filter((p) => selectedProviders.includes(p))}
            selectedIds={selectedIds}
            onToggle={toggleSelected}
            isFull={isSelectionFull}
            classById={classById}
            qualityCategory={task.qualityCategory}
          />
        </section>
      </div>
    </>
  )
}
