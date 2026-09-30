import type { Capability, InputModality } from '@/types/model'

export const MODALITY_LABELS: Record<InputModality, string> = {
  text: 'Texto',
  image: 'Imágenes',
  pdf: 'PDF',
  audio: 'Audio',
  video: 'Video',
}

export const MODALITY_ORDER: InputModality[] = ['text', 'image', 'pdf', 'audio', 'video']

export const CAPABILITY_LABELS: Record<Capability, string> = {
  tools: 'Herramientas (function calling)',
  structured: 'Salida estructurada (JSON)',
  reasoning: 'Razonamiento',
  web: 'Búsqueda web',
  caching: 'Caché de prompts',
  computer: 'Uso de computadora',
}

export const CAPABILITY_SHORT_LABELS: Record<Capability, string> = {
  tools: 'Tools',
  structured: 'JSON',
  reasoning: 'Razonamiento',
  web: 'Web',
  caching: 'Caché',
  computer: 'Computer use',
}

export const CAPABILITY_ORDER: Capability[] = [
  'reasoning',
  'tools',
  'structured',
  'web',
  'caching',
  'computer',
]
