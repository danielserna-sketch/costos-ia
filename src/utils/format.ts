export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    // 1.048.576 (2^20) se muestra como "1M", igual que 1.000.000.
    const millions = Number((tokens / 1_000_000).toFixed(1))
    return `${millions}M tokens`
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K tokens`
  }
  return `${tokens} tokens`
}

/** Versión corta sin la palabra "tokens" (para chips y tarjetas). */
export function formatTokensShort(tokens: number): string {
  return formatContextWindow(tokens).replace(' tokens', '')
}

export function formatDate(value: string): string {
  // Una fecha sin hora ("2026-09-13") se interpreta en UTC y en zonas como
  // Colombia se mostraría como el día anterior; se ancla al mediodía local.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
