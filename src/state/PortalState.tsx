import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { ModelCostResult, ModelPricing, Provider, UsageEstimate } from '@/types/model'
import { models, providers } from '@/data/models'
import { DEFAULT_TASK, type TaskPreset } from '@/data/tasks'
import { useModelSelection } from '@/hooks/useModelSelection'
import { calculateModelCost } from '@/utils/cost'
import { classifyModelsById, type CompetitiveClass } from '@/utils/classify'
import type { Strategy } from '@/utils/recommend'

interface PortalState {
  task: TaskPreset
  selectTask: (task: TaskPreset) => void
  usage: UsageEstimate
  setUsage: (usage: UsageEstimate) => void
  strategy: Strategy
  setStrategy: (strategy: Strategy) => void
  selectedProviders: Provider[]
  setSelectedProviders: (providers: Provider[]) => void
  visibleModels: ModelPricing[]
  classById: Map<string, CompetitiveClass>
  baselineId: string | null
  setBaselineId: (id: string | null) => void
  baseline: ModelCostResult | null
  baselineClassAllowed: boolean
  selectedIds: string[]
  toggleSelected: (id: string) => void
  isSelectionFull: boolean
  /** Carga los modelos en el comparador y navega a él. */
  compare: (models: ModelPricing[]) => void
}

const PortalStateContext = createContext<PortalState | null>(null)

export function PortalStateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [task, setTask] = useState<TaskPreset>(DEFAULT_TASK)
  const [usage, setUsage] = useState<UsageEstimate>(DEFAULT_TASK.usage)
  const [strategy, setStrategy] = useState<Strategy>('balance')
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([...providers])
  const [baselineId, setBaselineId] = useState<string | null>(null)
  const { selectedIds, toggle, select, isFull } = useModelSelection(models)

  const visibleModels = useMemo(
    () => models.filter((m) => selectedProviders.includes(m.provider)),
    [selectedProviders],
  )
  const classById = useMemo(() => classifyModelsById(models), [])

  const baselineModel = models.find((m) => m.id === baselineId) ?? null
  const baseline = baselineModel ? calculateModelCost(baselineModel, usage) : null
  const baselineClassAllowed = baselineModel
    ? task.allowedClasses.some((c) => c === classById.get(baselineModel.id))
    : false

  const value: PortalState = {
    task,
    selectTask: (next) => {
      setTask(next)
      setUsage(next.usage)
    },
    usage,
    setUsage,
    strategy,
    setStrategy,
    selectedProviders,
    setSelectedProviders,
    visibleModels,
    classById,
    baselineId,
    setBaselineId,
    baseline,
    baselineClassAllowed,
    selectedIds,
    toggleSelected: toggle,
    isSelectionFull: isFull,
    compare: (toCompare) => {
      select(toCompare.map((m) => m.id))
      navigate('/comparador')
    },
  }

  return <PortalStateContext.Provider value={value}>{children}</PortalStateContext.Provider>
}

export function usePortalState(): PortalState {
  const ctx = useContext(PortalStateContext)
  if (!ctx) throw new Error('usePortalState debe usarse dentro de PortalStateProvider')
  return ctx
}
