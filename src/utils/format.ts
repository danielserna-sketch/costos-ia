export function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)}M tokens`
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K tokens`
  }
  return `${tokens} tokens`
}
