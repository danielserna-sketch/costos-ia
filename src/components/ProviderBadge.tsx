import type { Provider } from '@/types/model'

const styles: Record<Provider, string> = {
  Anthropic: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  OpenAI: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Google: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
}

export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[provider]}`}
    >
      {provider}
    </span>
  )
}
