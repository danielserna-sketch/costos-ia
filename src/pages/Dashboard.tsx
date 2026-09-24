import { useMemo, useRef, useState } from 'react'
import { useUsage } from '@/hooks/useUsage'
import { useModelSelection, pickModels, MAX_SELECTION } from '@/hooks/useModelSelection'
import { calculateModelCost } from '@/utils/cost'
import { classifyModelsById } from '@/utils/classify'
import { recommend, type Strategy } from '@/utils/recommend'
import { QUALITY_CATEGORY_LABELS } from '@/utils/quality'
import { UsageForm } from '@/components/UsageForm'
import { ComparisonTable } from '@/components/ComparisonTable'
import { ComparisonChart } from '@/components/ComparisonChart'
import { ProviderFilter } from '@/components/ProviderFilter'
import { ModelPicker } from '@/components/ModelPicker'
import { PricingChanges } from '@/components/PricingChanges'
import { InsightsPanel } from '@/components/InsightsPanel'
import { TaskSelector } from '@/components/TaskSelector'
import { BaselineSelect } from '@/components/BaselineSelect'
import { RecommendationCard } from '@/components/RecommendationCard'
import { CostQualityChart } from '@/components/CostQualityChart'
import { Header } from '@/components/Header'
import type { ModelPricing, Provider } from '@/types/model'
import { models, pricingChanges, providers, qualityMeta } from '@/data/models'
import { DEFAULT_TASK, tasks, type TaskPreset } from '@/data/tasks'

function StepHeading({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [task, setTask] = useState<TaskPreset>(DEFAULT_TASK)
  const { usage, setUsage } = useUsage(DEFAULT_TASK.usage)
  const [baselineId, setBaselineId] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<Strategy>('balance')
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([
    ...providers,
  ])
  const { selectedIds, toggle, select, isFull } = useModelSelection(models)
  const comparatorRef = useRef<HTMLElement>(null)

  const visibleModels = useMemo(
    () => models.filter((m) => selectedProviders.includes(m.provider)),
    [selectedProviders],
  )
  const filteredChanges = pricingChanges.filter((c) =>
    selectedProviders.includes(c.provider),
  )
  const classById = useMemo(() => classifyModelsById(models), [])

  const recommendation = useMemo(
    () => recommend(visibleModels, task, usage, strategy),
    [visibleModels, task, usage, strategy],
  )

  const baselineModel = models.find((m) => m.id === baselineId) ?? null
  const baseline = baselineModel ? calculateModelCost(baselineModel, usage) : null
  const baselineClassAllowed = baselineModel
    ? task.allowedClasses.some((c) => c === classById.get(baselineModel.id))
    : false

  const selectedModels = pickModels(models, selectedIds)
  const results = useMemo(
    () => selectedModels.map((model) => calculateModelCost(model, usage)),
    [selectedModels, usage],
  )

  const handleSelectTask = (next: TaskPreset) => {
    setTask(next)
    setUsage(next.usage)
  }

  const handleCompare = (modelsToCompare: ModelPricing[]) => {
    select(modelsToCompare.map((m) => m.id))
    comparatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <Header />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8">
        {filteredChanges.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Cambios de precio recientes
            </h2>
            <PricingChanges changes={filteredChanges} />
          </section>
        )}

        <section className="flex flex-col gap-4">
          <StepHeading
            step={1}
            title="¿Qué quieres hacer?"
            subtitle="Elige la tarea más parecida a la tuya; cargamos un volumen de uso típico que puedes ajustar."
          />
          <TaskSelector tasks={tasks} selectedId={task.id} onSelect={handleSelectTask} />
          <UsageForm usage={usage} onChange={setUsage} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BaselineSelect
              models={models}
              providers={providers}
              value={baselineId}
              onChange={setBaselineId}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Proveedores
              </span>
              <ProviderFilter selected={selectedProviders} onChange={setSelectedProviders} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <StepHeading
            step={2}
            title="Recomendación"
            subtitle="El modelo más costo-eficiente para tu tarea según costo y calidad, y cómo se compara con lo que usas hoy."
          />
          <RecommendationCard
            task={task}
            strategy={strategy}
            onStrategyChange={setStrategy}
            recommendation={recommendation}
            baseline={baseline}
            baselineClassAllowed={baselineClassAllowed}
            qualityMeta={qualityMeta}
            onCompare={handleCompare}
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

        <section ref={comparatorRef} className="flex scroll-mt-4 flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <StepHeading
              step={3}
              title="Comparar en detalle"
              subtitle={`Elige hasta ${MAX_SELECTION} modelos de cualquier proveedor y míralos lado a lado.`}
            />
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
            qualityCategory={task.qualityCategory}
          />
          {results.length >= 2 ? (
            <>
              <ComparisonTable
                results={results}
                onRemove={toggle}
                baseline={baseline}
                qualityCategory={task.qualityCategory}
              />
              <ComparisonChart results={results} />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Selecciona al menos 2 modelos arriba para verlos comparados lado
              a lado.
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <StepHeading
            step={4}
            title="Explorar el mercado"
            subtitle={'Quién compite con quién, agrupado por posicionamiento de precio. Usa "Comparar estos" para llevar una categoría al paso 3.'}
          />
          <InsightsPanel models={visibleModels} usage={usage} onCompare={handleCompare} />
        </section>
      </div>
    </>
  )
}
