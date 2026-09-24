import type { QualityCategory, UsageEstimate } from '@/types/model'
import type { CompetitiveClass } from '@/utils/classify'

export interface TaskPreset {
  id: string
  name: string
  description: string
  usage: UsageEstimate
  /** Categorías de modelo con capacidad suficiente para la tarea. */
  allowedClasses: CompetitiveClass[]
  /** Categoría de LMArena que mejor refleja la calidad para esta tarea. */
  qualityCategory: QualityCategory
}

// Perfiles de tokens aproximados para casos de uso típicos. Son un punto de
// partida razonable, no una medición: el usuario puede ajustarlos después.
export const tasks: TaskPreset[] = [
  {
    id: 'clasificacion',
    name: 'Clasificar en volumen',
    description: 'Etiquetar tickets, sentimiento, moderación.',
    usage: { inputTokens: 500, outputTokens: 20, requestsPerMonth: 500_000 },
    allowedClasses: ['Económico', 'Balanceado', 'Flagship'],
    qualityCategory: 'instruction_following',
  },
  {
    id: 'soporte',
    name: 'Chatbot de soporte',
    description: 'Responder clientes con historial y FAQs.',
    usage: { inputTokens: 2_000, outputTokens: 400, requestsPerMonth: 30_000 },
    allowedClasses: ['Económico', 'Balanceado', 'Flagship'],
    qualityCategory: 'multi_turn',
  },
  {
    id: 'resumen',
    name: 'Resumir documentos',
    description: 'Contratos, reportes, actas largas.',
    usage: { inputTokens: 8_000, outputTokens: 600, requestsPerMonth: 5_000 },
    allowedClasses: ['Balanceado', 'Flagship'],
    qualityCategory: 'longer_query',
  },
  {
    id: 'rag',
    name: 'Búsqueda en documentos (RAG)',
    description: 'Responder preguntas sobre tu base de conocimiento.',
    usage: { inputTokens: 6_000, outputTokens: 500, requestsPerMonth: 20_000 },
    allowedClasses: ['Balanceado', 'Flagship'],
    qualityCategory: 'longer_query',
  },
  {
    id: 'codigo',
    name: 'Generar o revisar código',
    description: 'Asistente de desarrollo, code review.',
    usage: { inputTokens: 4_000, outputTokens: 1_500, requestsPerMonth: 5_000 },
    allowedClasses: ['Balanceado', 'Flagship', 'Razonamiento'],
    qualityCategory: 'coding',
  },
  {
    id: 'razonamiento',
    name: 'Análisis complejo',
    description: 'Problemas de varios pasos, matemática, estrategia.',
    usage: { inputTokens: 3_000, outputTokens: 3_000, requestsPerMonth: 2_000 },
    allowedClasses: ['Flagship', 'Razonamiento'],
    qualityCategory: 'hard_prompts',
  },
  {
    id: 'agente',
    name: 'Agente autónomo',
    description: 'Tareas largas con herramientas y muchos pasos.',
    usage: { inputTokens: 20_000, outputTokens: 2_000, requestsPerMonth: 2_000 },
    allowedClasses: ['Flagship'],
    qualityCategory: 'hard_prompts',
  },
]

export const DEFAULT_TASK = tasks[1]
