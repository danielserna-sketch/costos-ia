import type { ReactNode } from 'react'
import { providers } from '@/data/models'
import type { useModelFilters } from '@/hooks/useModelFilters'
import { CLASS_ORDER } from '@/utils/classify'
import { CAPABILITY_ORDER, CAPABILITY_SHORT_LABELS, MODALITY_LABELS } from '@/utils/capabilities'
import { formatUsd } from '@/utils/cost'
import { providerColor } from '@/theme/providers'
import type { InputModality } from '@/types/model'

type FilterApi = ReturnType<typeof useModelFilters>

const MODALITIES: InputModality[] = ['image', 'pdf', 'audio', 'video']
const CONTEXT_OPTIONS = [0, 128_000, 200_000, 1_000_000]
const PRICE_OPTIONS: (number | null)[] = [null, 0.5, 2, 5]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2 border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 accent-slate-900 dark:accent-slate-100"
      />
      {children}
    </label>
  )
}

function Segmented<T>({
  name,
  options,
  value,
  label,
  onChange,
}: {
  name: string
  options: T[]
  value: T
  label: (v: T) => string
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {options.map((opt) => {
        const active = opt === value
        return (
          <label
            key={String(opt)}
            className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium ${
              active
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <input type="radio" name={name} className="sr-only" checked={active} onChange={() => onChange(opt)} />
            {label(opt)}
          </label>
        )
      })}
    </div>
  )
}

export function FilterPanel({ api }: { api: FilterApi }) {
  const { filters, toggleIn } = api
  return (
    <div className="flex flex-col gap-4">
      <Group title="Proveedor">
        {providers.map((p) => (
          <Check key={p} checked={filters.providers.includes(p)} onChange={() => toggleIn('providers', p)}>
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: providerColor(p) }} />
            {p}
          </Check>
        ))}
      </Group>
      <Group title="Categoría">
        {CLASS_ORDER.map((c) => (
          <Check key={c} checked={filters.classes.includes(c)} onChange={() => toggleIn('classes', c)}>
            {c}
          </Check>
        ))}
      </Group>
      <Group title="Debe aceptar">
        {MODALITIES.map((m) => (
          <Check key={m} checked={filters.modalities.includes(m)} onChange={() => toggleIn('modalities', m)}>
            {MODALITY_LABELS[m]}
          </Check>
        ))}
      </Group>
      <Group title="Debe soportar">
        {CAPABILITY_ORDER.map((c) => (
          <Check key={c} checked={filters.capabilities.includes(c)} onChange={() => toggleIn('capabilities', c)}>
            {CAPABILITY_SHORT_LABELS[c]}
          </Check>
        ))}
      </Group>
      <Group title="Contexto mínimo">
        <Segmented
          name="contexto"
          options={CONTEXT_OPTIONS}
          value={filters.minContext}
          label={(v) => (v === 0 ? 'Cualquiera' : v >= 1_000_000 ? '≥ 1M' : `≥ ${v / 1000}K`)}
          onChange={api.setMinContext}
        />
      </Group>
      <Group title="Precio de entrada máx. (1M)">
        <Segmented
          name="precio"
          options={PRICE_OPTIONS}
          value={filters.maxInputPrice}
          label={(v) => (v == null ? 'Cualquiera' : `≤ ${formatUsd(v)}`)}
          onChange={api.setMaxInputPrice}
        />
      </Group>
      <Group title="Estado">
        <Check checked={filters.onlyNew} onChange={() => api.setOnlyNew(!filters.onlyNew)}>
          Solo nuevos
        </Check>
      </Group>
    </div>
  )
}
