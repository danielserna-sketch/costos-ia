import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ModelPricing } from '@/types/model'
import { usePortalState } from '@/state/PortalState'
import { generatedAt, models, pricingChanges, providers } from '@/data/models'
import { tasks, type TaskPreset } from '@/data/tasks'
import { CLASS_DESCRIPTIONS, classifyModels, representativePerProvider, type CompetitiveClass } from '@/utils/classify'
import { formatUsd } from '@/utils/cost'
import { formatDate, formatTokensShort } from '@/utils/format'
import { compareNewest, modelStatus } from '@/utils/status'
import { SectionTitle } from '@/components/PageHeader'
import { ProviderBadge } from '@/components/ProviderBadge'
import { PriceTag } from '@/components/ModelBits'
import { StatusBadge } from '@/components/ui/Badge'
import { CARD_CLASS } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { providerColor } from '@/theme/providers'

const HIGHLIGHT_CLASSES: CompetitiveClass[] = ['Flagship', 'Balanceado', 'Económico']
const LATEST_COUNT = 6

function modelLink(model: ModelPricing) {
  return `/modelos?modelo=${encodeURIComponent(model.id)}`
}

function ActionCard({
  title,
  description,
  cta,
  onClick,
  to,
  icon,
}: {
  title: string
  description: string
  cta: string
  onClick?: () => void
  to?: string
  icon: ReactNode
}) {
  const body = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {icon}
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <span className="mt-auto text-sm font-medium text-slate-900 group-hover:underline dark:text-slate-100">{cta} →</span>
    </>
  )
  const className = `${CARD_CLASS} group flex flex-col gap-4 p-5 text-left transition-shadow hover:shadow-md`
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      {children}
    </svg>
  )
}

function ModelLine({ label, model, value }: { label: string; model: ModelPricing; value: string }) {
  return (
    <Link to={modelLink(model)} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/60">
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          <ProviderBadge provider={model.provider} />
          <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{model.name}</span>
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">{value}</span>
    </Link>
  )
}

/**
 * Con lanzamientos detectados, los más recientes primero. Sin ellos (antes de
 * que el seguimiento acumule fechas) la versión más alta de cada proveedor,
 * para no llenar la sección con una sola familia.
 */
function latestModels(hasNew: boolean): ModelPricing[] {
  const sorted = [...models].sort(compareNewest)
  if (hasNew) return sorted.slice(0, LATEST_COUNT)
  const seen = new Set<string>()
  const firstPerProvider = sorted.filter((m) => (seen.has(m.provider) ? false : (seen.add(m.provider), true)))
  const rest = sorted.filter((m) => !firstPerProvider.includes(m))
  return [...firstPerProvider, ...rest].slice(0, LATEST_COUNT)
}

export function Home() {
  const navigate = useNavigate()
  const { selectTask, compare } = usePortalState()
  const [query, setQuery] = useState('')

  const classes = classifyModels(models)
  // Proveedores en el orden canónico: primero los tres más conocidos.
  const byProviderOrder = (list: ModelPricing[]) =>
    [...list].sort((a, b) => providers.indexOf(a.provider) - providers.indexOf(b.provider))
  const popular = HIGHLIGHT_CLASSES.map((cls) => ({
    cls,
    models: byProviderOrder(representativePerProvider(classes[cls])).slice(0, 3),
  })).filter((p) => p.models.length >= 2)
  const hasNew = models.some((m) => modelStatus(m) === 'Nuevo')
  const latest = latestModels(hasNew)

  const q = query.trim().toLowerCase()
  const suggestions = q
    ? models.filter((m) => `${m.name} ${m.provider}`.toLowerCase().includes(q)).slice(0, 5)
    : []

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    navigate(q ? `/modelos?q=${encodeURIComponent(query.trim())}` : '/modelos')
  }

  const startWith = (task: TaskPreset) => {
    selectTask(task)
    navigate('/recomendador')
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-center gap-5 pt-4 text-center sm:pt-8">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Qué modelos de IA existen, qué hacen y cuánto cuestan
        </h1>
        <p className="max-w-2xl text-slate-500 sm:text-lg dark:text-slate-400">
          {models.length} modelos de {providers.length} proveedores, con precios actualizados cada día
          {generatedAt ? ` (último: ${formatDate(generatedAt)})` : ''}.
        </p>
        <form onSubmit={onSearch} role="search" className="relative w-full max-w-xl text-left">
          <SearchInput
            size="lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un modelo: Claude Sonnet, GPT, Gemini, Grok…"
            aria-label="Buscar un modelo"
          />
          {suggestions.length > 0 && (
            <ul className={`${CARD_CLASS} absolute inset-x-0 top-full z-20 mt-2 overflow-hidden p-1 shadow-lg`}>
              {suggestions.map((m) => (
                <li key={m.id}>
                  <Link
                    to={modelLink(m)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: providerColor(m.provider) }} />
                      <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                      <span className="text-xs text-slate-400">{m.provider}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {formatUsd(m.inputPricePerMTokens)} / {formatUsd(m.outputPricePerMTokens)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </form>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Qué quieres hacer">
        <ActionCard
          title="Explorar modelos"
          description="Filtra por proveedor, precio, contexto, modalidades y capacidades."
          cta="Ver directorio"
          to="/modelos"
          icon={
            <Icon>
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.5-4.5" />
            </Icon>
          }
        />
        <ActionCard
          title="Comparar modelos"
          description={
            popular[0]
              ? `Lado a lado, hasta 4. Empieza con ${popular[0].models.map((m) => m.name).join(' vs ')}.`
              : 'Lado a lado, hasta 4 modelos.'
          }
          cta="Abrir comparación"
          onClick={() => (popular[0] ? compare(popular[0].models) : navigate('/comparador'))}
          icon={
            <Icon>
              <path d="M8 4v16M16 4v16M4 8h8M12 16h8" />
            </Icon>
          }
        />
        <ActionCard
          title="Encontrar para mi caso"
          description="Dinos qué quieres hacer y te sugerimos el modelo con mejor costo/calidad."
          cta="Elegir caso de uso"
          to="/recomendador"
          icon={
            <Icon>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
              <circle cx="12" cy="12" r="4" />
            </Icon>
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle title="Casos de uso frecuentes" subtitle="Un clic y vas directo a la recomendación." />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {tasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => startWith(t)}
              title={t.description}
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle
            title="Últimos modelos"
            subtitle={
              hasNew
                ? 'Los lanzamientos más recientes que detectamos en el dataset.'
                : 'La versión más reciente de cada proveedor.'
            }
          />
          <Link
            to={hasNew ? '/modelos?estado=nuevo' : '/modelos?orden=newest'}
            className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Ver todos →
          </Link>
        </div>
        <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {latest.map((m) => (
            <li key={m.id} className="w-64 shrink-0 snap-start sm:w-auto">
              <Link
                to={modelLink(m)}
                className={`${CARD_CLASS} flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-md`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{m.name}</span>
                  <StatusBadge status={modelStatus(m)} />
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ProviderBadge provider={m.provider} />
                  {formatTokensShort(m.contextWindow)} contexto
                </span>
                <PriceTag model={m} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {popular.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionTitle
            title="Comparaciones populares"
            subtitle="El modelo más barato de cada proveedor dentro de la misma categoría."
          />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {popular.map(({ cls, models: list }) => (
              <button
                key={cls}
                type="button"
                onClick={() => compare(list)}
                className={`${CARD_CLASS} group flex flex-col gap-3 p-4 text-left transition-shadow hover:shadow-md`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{cls}</span>
                <span className="flex flex-col gap-1.5">
                  {list.map((m, i) => (
                    <span key={m.id} className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: providerColor(m.provider) }} />
                      {m.name}
                      {i < list.length - 1 && <span className="text-xs font-normal text-slate-400">vs</span>}
                    </span>
                  ))}
                </span>
                <span className="mt-auto text-sm font-medium text-slate-900 group-hover:underline dark:text-slate-100">
                  Comparar →
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle title="Proveedores" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {providers.map((p) => {
            const count = models.filter((m) => m.provider === p).length
            return (
              <li key={p}>
                <Link
                  to={`/modelos?proveedor=${encodeURIComponent(p)}`}
                  className={`${CARD_CLASS} flex items-center gap-3 p-4 transition-shadow hover:shadow-md`}
                >
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: providerColor(p) }} />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p}</span>
                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                      {count} {count === 1 ? 'modelo' : 'modelos'}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle
            title="Lo destacado por categoría"
            subtitle="Precio por 1M tokens (entrada / salida)."
          />
          <Link
            to="/mercado"
            className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Ver el mercado{pricingChanges.length > 0 ? ` (${pricingChanges.length} cambios de precio)` : ''} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {HIGHLIGHT_CLASSES.map((cls) => {
            const list = classes[cls]
            if (list.length === 0) return null
            const cheapest = list[0]
            const best = list
              .filter((m) => m.quality?.overall)
              .reduce<ModelPricing | null>(
                (acc, m) => (!acc || m.quality!.overall!.rating > acc.quality!.overall!.rating ? m : acc),
                null,
              )
            const price = (m: ModelPricing) => `${formatUsd(m.inputPricePerMTokens)} / ${formatUsd(m.outputPricePerMTokens)}`
            return (
              <div key={cls} className={`${CARD_CLASS} flex flex-col gap-3 p-5`}>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{cls}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{CLASS_DESCRIPTIONS[cls]}</p>
                </div>
                <ModelLine label="Más barato" model={cheapest} value={price(cheapest)} />
                {best && best.id !== cheapest.id && (
                  <ModelLine label="Mayor calidad (LMArena)" model={best} value={price(best)} />
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
