import { useEffect, useRef, type ReactNode } from 'react'
import type { ModelPricing, QualityCategory } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'
import { calculateModelCost, formatUsd } from '@/utils/cost'
import { formatContextWindow, formatTokensShort } from '@/utils/format'
import { modelStatus } from '@/utils/status'
import { qualityRank, strengths } from '@/utils/strengths'
import { QUALITY_CATEGORY_LABELS } from '@/utils/quality'
import { CAPABILITY_LABELS, CAPABILITY_ORDER, MODALITY_LABELS, MODALITY_ORDER } from '@/utils/capabilities'
import { PROVIDER_META } from '@/theme/providers'
import { ProviderBadge } from '@/components/ProviderBadge'
import { PriceTag, QualityMeter } from '@/components/ModelBits'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { InfoTip } from '@/components/ui/InfoTip'

interface ModelDrawerProps {
  model: ModelPricing
  models: ModelPricing[]
  classById: Map<string, CompetitiveClass>
  isSelected: boolean
  isSelectionFull: boolean
  onToggleCompare: () => void
  onCompareWith: (models: ModelPricing[]) => void
  onOpen: (model: ModelPricing) => void
  onClose: () => void
}

const QUALITY_ORDER: QualityCategory[] = [
  'overall',
  'coding',
  'hard_prompts',
  'longer_query',
  'instruction_following',
  'multi_turn',
]

// Escenario de ejemplo para traducir precios por millón a algo tangible.
const EXAMPLE_USAGE = { inputTokens: 2_000, outputTokens: 500, requestsPerMonth: 1_000 }

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right tabular-nums text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  )
}

/** Competidores directos: el más barato de cada otro proveedor en la misma categoría. */
function competitorsOf(model: ModelPricing, models: ModelPricing[], classById: Map<string, CompetitiveClass>) {
  const cls = classById.get(model.id)
  const seen = new Set([model.provider])
  return models
    .filter((m) => m.id !== model.id && classById.get(m.id) === cls)
    .sort((a, b) => a.inputPricePerMTokens + a.outputPricePerMTokens - (b.inputPricePerMTokens + b.outputPricePerMTokens))
    .filter((m) => (seen.has(m.provider) ? false : (seen.add(m.provider), true)))
}

export function ModelDrawer({
  model,
  models,
  classById,
  isSelected,
  isSelectionFull,
  onToggleCompare,
  onCompareWith,
  onOpen,
  onClose,
}: ModelDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    closeRef.current?.focus()
  }, [model.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  const cls = classById.get(model.id)
  const example = calculateModelCost(model, EXAMPLE_USAGE)
  const modelStrengths = strengths(model, models)
  const competitors = competitorsOf(model, models, classById).slice(0, 3)
  const meta = PROVIDER_META[model.provider]

  // Escala por categoría: los puntajes de cada categoría tienen rangos distintos.
  const range = (c: QualityCategory) => {
    const ratings = models.map((m) => m.quality?.[c]?.rating).filter((r): r is number => r != null)
    return { min: Math.min(...ratings), max: Math.max(...ratings) }
  }
  const qualityRows = QUALITY_ORDER.filter((c) => model.quality?.[c])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
      <button
        type="button"
        aria-label="Cerrar detalle"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-drawer-title"
        className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-none sm:w-[480px] sm:rounded-none dark:bg-slate-900"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id="model-drawer-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {model.name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <ProviderBadge provider={model.provider} />
              {cls && <Badge>{cls}</Badge>}
              <StatusBadge status={modelStatus(model)} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ×
          </button>
        </header>

        <div className="flex flex-col gap-5 px-5 py-5">
          <div className="flex flex-col gap-3">
            <PriceTag model={model} size="lg" />
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              Ejemplo: 1.000 requests de 2K tokens de entrada y 500 de salida ≈{' '}
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatUsd(example.totalCostPerMonth)}
              </span>{' '}
              ({formatUsd(example.totalCostPerRequest)} por request).
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={isSelected ? 'secondary' : 'primary'}
                onClick={onToggleCompare}
                disabled={!isSelected && isSelectionFull}
              >
                {isSelected ? '✓ En la comparación' : '+ Agregar a comparar'}
              </Button>
              {competitors.length > 0 && (
                <Button variant="secondary" onClick={() => onCompareWith([model, ...competitors])}>
                  Comparar con competidores
                </Button>
              )}
            </div>
          </div>

          {modelStrengths.length > 0 && (
            <Section
              title="Destaca en"
              aside={
                <InfoTip label="Cómo se calculan las fortalezas">
                  Se derivan solo de datos: top 3 del catálogo en una categoría de LMArena, contexto de 1M o
                  más, precio en el 25% más barato o entrada de audio/video. Son señales, no una
                  recomendación absoluta.
                </InfoTip>
              }
            >
              <ul className="flex flex-col gap-2">
                {modelStrengths.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                    <span className="text-right text-xs text-slate-500 dark:text-slate-400">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section
            title="Calidad"
            aside={
              <InfoTip label="Qué significa el puntaje">
                Arena Score de LMArena (escala Elo): 100 puntos de diferencia ≈ 64% de preferencia en
                comparaciones a ciegas. La barra es relativa al rango de este catálogo.
              </InfoTip>
            }
          >
            {qualityRows.length > 0 ? (
              <div className="flex flex-col gap-3">
                {qualityRows.map((c) => (
                  <QualityMeter
                    key={c}
                    label={QUALITY_CATEGORY_LABELS[c].replace(/^./, (ch) => ch.toUpperCase())}
                    rating={model.quality![c]!.rating}
                    {...range(c)}
                    rank={qualityRank(model, models, c)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Todavía sin puntaje en LMArena (suele pasar con modelos muy recientes).
              </p>
            )}
          </Section>

          <Section title="Precios detallados · USD por 1M tokens">
            <dl className="flex flex-col gap-2">
              <Row label="Entrada" value={formatUsd(model.inputPricePerMTokens)} />
              <Row label="Salida" value={formatUsd(model.outputPricePerMTokens)} />
              {model.cachedInputPricePerMTokens != null && (
                <Row label="Entrada en caché (lectura)" value={formatUsd(model.cachedInputPricePerMTokens)} />
              )}
              {model.cacheWritePricePerMTokens != null && (
                <Row label="Escritura en caché" value={formatUsd(model.cacheWritePricePerMTokens)} />
              )}
              {model.longContextPricing && (
                <Row
                  label={`Más de ${formatTokensShort(model.longContextPricing.thresholdTokens)} de entrada`}
                  value={`${formatUsd(model.longContextPricing.inputPricePerMTokens)} / ${formatUsd(
                    model.longContextPricing.outputPricePerMTokens,
                  )}`}
                />
              )}
            </dl>
          </Section>

          <Section title="Contexto y salida">
            <dl className="flex flex-col gap-2">
              <Row label="Ventana de contexto" value={formatContextWindow(model.contextWindow)} />
              {model.maxOutputTokens != null && (
                <Row label="Salida máxima" value={formatContextWindow(model.maxOutputTokens)} />
              )}
              {model.deprecationDate && <Row label="Fecha de retiro" value={model.deprecationDate} />}
            </dl>
          </Section>

          {(model.inputModalities || model.capabilities) && (
            <Section title="Modalidades y capacidades">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {MODALITY_ORDER.map((m) => (
                  <Capable key={m} ok={Boolean(model.inputModalities?.includes(m))} label={`Entrada: ${MODALITY_LABELS[m]}`} />
                ))}
                {CAPABILITY_ORDER.map((c) => (
                  <Capable key={c} ok={Boolean(model.capabilities?.includes(c))} label={CAPABILITY_LABELS[c]} />
                ))}
              </ul>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Según los flags del dataset de LiteLLM; confirma en la documentación oficial.
              </p>
            </Section>
          )}

          {competitors.length > 0 && (
            <Section title={`Alternativas en ${cls ?? 'su categoría'}`}>
              <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {competitors.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(c)}
                      className="flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ProviderBadge provider={c.provider} />
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatUsd(c.inputPricePerMTokens)} / {formatUsd(c.outputPricePerMTokens)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Fuentes oficiales">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href={meta.pricingUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Precios de {model.provider} ↗
              </a>
              <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Documentación de modelos ↗
              </a>
            </div>
          </Section>
        </div>
      </aside>
    </div>
  )
}

function Capable({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
      <span aria-hidden className="w-3 text-center">{ok ? '✓' : '–'}</span>
      <span>
        <span className="sr-only">{ok ? 'Sí: ' : 'No: '}</span>
        {label}
      </span>
    </li>
  )
}
