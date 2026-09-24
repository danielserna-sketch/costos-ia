import { Link, useNavigate } from 'react-router'
import type { ModelPricing } from '@/types/model'
import { usePortalState } from '@/state/PortalState'
import { generatedAt, models, pricingChanges, providers, qualityMeta } from '@/data/models'
import { tasks, type TaskPreset } from '@/data/tasks'
import { CLASS_DESCRIPTIONS, classifyModels, type CompetitiveClass } from '@/utils/classify'
import { formatUsd } from '@/utils/cost'
import { formatDate } from '@/utils/format'
import { SectionTitle } from '@/components/PageHeader'
import { TaskSelector } from '@/components/TaskSelector'
import { ProviderBadge } from '@/components/ProviderBadge'

const HIGHLIGHT_CLASSES: CompetitiveClass[] = ['Flagship', 'Balanceado', 'Económico']

function Kpi({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
    </div>
  )
}

function ModelLine({ label, model, value }: { label: string; model: ModelPricing; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
        <div className="flex min-w-0 items-center gap-2">
          <ProviderBadge provider={model.provider} />
          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            {model.name}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { selectTask } = usePortalState()
  const classes = classifyModels(models)
  const scored = models.filter((m) => m.quality?.overall).length

  const startWith = (task: TaskPreset) => {
    selectTask(task)
    navigate('/recomendador')
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4 pt-2">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Encuentra el modelo de IA más costo-eficiente para tu tarea
        </h1>
        <p className="max-w-2xl text-slate-500 sm:text-lg dark:text-slate-400">
          Precios y calidad de Claude, GPT y Gemini actualizados cada día.
          Elige qué quieres hacer y te recomendamos el modelo con mejor
          relación costo/calidad.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="¿Qué quieres hacer?" subtitle="Elige una tarea para ir directo a la recomendación." />
        <TaskSelector tasks={tasks} selectedId="" onSelect={startWith} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Estado actual" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            label="Modelos activos"
            value={String(models.length)}
            detail={providers
              .map((p) => `${p} ${models.filter((m) => m.provider === p).length}`)
              .join(' · ')}
          />
          <Kpi
            label="Precios"
            value={generatedAt ? formatDate(generatedAt) : 'Sin sincronizar'}
            detail="Última actualización (sincronización diaria)"
          />
          <Kpi
            label="Calidad"
            value={qualityMeta?.publishedAt ? formatDate(qualityMeta.publishedAt) : 'Sin datos'}
            detail={`${scored} de ${models.length} modelos con puntaje (LMArena)`}
          />
          <Kpi
            label="Cambios de precio"
            value={String(pricingChanges.length)}
            detail={pricingChanges.length > 0 ? 'En la última actualización' : 'Sin cambios recientes'}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle
            title="Lo destacado por categoría"
            subtitle="Precios por millón de tokens (entrada / salida) y calidad general."
          />
          <Link
            to="/mercado"
            className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Ver el mercado completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HIGHLIGHT_CLASSES.map((cls) => {
            const list = classes[cls]
            if (list.length === 0) return null
            const cheapest = list[0]
            const withQuality = list.filter((m) => m.quality?.overall)
            const best = withQuality.reduce<ModelPricing | null>(
              (acc, m) => (!acc || m.quality!.overall!.rating > acc.quality!.overall!.rating ? m : acc),
              null,
            )
            return (
              <div
                key={cls}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cls}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{CLASS_DESCRIPTIONS[cls]}</p>
                </div>
                <ModelLine
                  label="Más barato"
                  model={cheapest}
                  value={`${formatUsd(cheapest.inputPricePerMTokens)} / ${formatUsd(cheapest.outputPricePerMTokens)}`}
                />
                {best && (
                  <ModelLine
                    label="Mayor calidad"
                    model={best}
                    value={String(best.quality!.overall!.rating)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
