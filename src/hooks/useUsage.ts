import { useState } from 'react'
import type { UsageEstimate } from '@/types/model'

const defaultUsage: UsageEstimate = {
  inputTokens: 1000,
  outputTokens: 500,
  requestsPerMonth: 10_000,
}

export function useUsage(initialUsage: UsageEstimate = defaultUsage) {
  const [usage, setUsage] = useState<UsageEstimate>(initialUsage)
  return { usage, setUsage }
}
