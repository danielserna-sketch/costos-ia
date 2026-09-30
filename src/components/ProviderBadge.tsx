import type { Provider } from '@/types/model'
import { providerColor } from '@/theme/providers'

// El color de marca va en el punto; el texto usa tinta neutra para que el
// badge sea legible en ambos temas y no se confunda con colores semánticos.
export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: providerColor(provider) }}
      />
      {provider}
    </span>
  )
}
