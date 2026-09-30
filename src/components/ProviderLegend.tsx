import type { Provider } from '@/types/model'
import { providerColor } from '@/theme/providers'

/** Leyenda de proveedores para gráficos coloreados por proveedor. */
export function ProviderLegend({ providers }: { providers: Provider[] }) {
  const unique = [...new Set(providers)]
  if (unique.length < 2) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
      {unique.map((p) => (
        <li key={p} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: providerColor(p) }} />
          {p}
        </li>
      ))}
    </ul>
  )
}
