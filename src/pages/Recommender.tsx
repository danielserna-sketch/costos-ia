import { useMemo } from 'react'
import { usePortalState } from '@/state/PortalState'
import { tasks } from '@/data/tasks'
import { qualityMeta } from '@/data/models'
import { recommend } from '@/utils/recommend'
import { QUALITY_CATEGORY_LABELS } from '@/utils/quality'
import { PageHeader, SectionTitle } from '@/components/PageHeader'
import { TaskSelector } from '@/components/TaskSelector'
import { ScenarioPanel } from '@/components/ScenarioPanel'
import { RecommendationCard } from '@/components/RecommendationCard'
import { CostQualityChart } from '@/components/CostQualityChart'

export function Recommender() {
  const {
    task,
    selectTask,
    usage,
    strategy,
    setStrategy,
    visibleModels,
    baseline,
    baselineId,
    baselineClassAllowed,
    compare,
  } = usePortalState()

  const recommendation = useMemo(
    () => recommend(visibleModels, task, usage, strategy),
    [visibleModels, task, usage, strategy],
  )

  return (
    <>
      <PageHeader
        title="Recomendador"
        description="Cuéntanos qué quieres hacer y te decimos qué modelo te da la mejor relación entre costo y calidad, y cuánto ahorrarías frente al que usas hoy."
      />

      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="1. Tu escenario"
            subtitle="Elige la tarea más parecida a la tuya; cargamos un volumen típico que puedes ajustar."
          />
          <TaskSelector tasks={tasks} selectedId={task.id} onSelect={selectTask} />
          <ScenarioPanel />
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle title="2. Recomendación" />
          <RecommendationCard
            task={task}
            strategy={strategy}
            onStrategyChange={setStrategy}
            recommendation={recommendation}
            baseline={baseline}
            baselineClassAllowed={baselineClassAllowed}
            qualityMeta={qualityMeta}
            onCompare={compare}
          />
          {recommendation && (
            <CostQualityChart
              eligible={recommendation.eligible}
              recommendedId={recommendation.best.model.id}
              labeledIds={[
                recommendation.best.model.id,
                ...recommendation.alternatives.map((a) => a.model.id),
                ...(baselineId ? [baselineId] : []),
              ]}
              categoryLabel={QUALITY_CATEGORY_LABELS[task.qualityCategory]}
            />
          )}
        </section>
      </div>
    </>
  )
}
