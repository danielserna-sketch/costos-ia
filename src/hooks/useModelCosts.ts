import { useMemo, useState } from 'react'
import { models } from '@/data/models'
import { calculateModelCost } from '@/utils/cost'
import type { UsageEstimate } from '@/types/model'

const defaultUsage: UsageEstimate = {
  inputTokens: 1000,
  outputTokens: 500,
  requestsPerMonth: 10_000,
}

export function useModelCosts(initialUsage: UsageEstimate = defaultUsage) {
  const [usage, setUsage] = useState<UsageEstimate>(initialUsage)

  const results = useMemo(
    () => models.map((model) => calculateModelCost(model, usage)),
    [usage],
  )

  return { usage, setUsage, results }
}
