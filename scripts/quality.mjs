// Puntajes de calidad desde el leaderboard oficial de LMArena (CC BY 4.0),
// publicado como dataset en Hugging Face. Se usa el Parquet del split
// "latest" (~600 KB) en vez de la API de filas porque esta última es
// inestable ("dataset index is loading").
import { parquetReadObjects } from 'hyparquet'

const LMARENA_TEXT_LATEST_URL =
  'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/refs%2Fconvert%2Fparquet/text/latest/0000.parquet'

// Categorías del leaderboard que usamos (ver `qualityCategory` en
// src/data/tasks.ts). "overall" es el respaldo cuando falta la específica.
export const QUALITY_CATEGORIES = [
  'overall',
  'coding',
  'hard_prompts',
  'longer_query',
  'multi_turn',
  'instruction_following',
]

// Sufijos que LMArena agrega a un mismo modelo según el esfuerzo de
// razonamiento o la fecha del snapshot; se quitan para emparejar con
// nuestros ids.
const EFFORT_SUFFIX = /-(minimal|low|medium|high|xhigh|max|thinking)$/
const DATE_SUFFIX = /-(\d{8}|\d{4}-\d{2}-\d{2})$/

function normalize(name) {
  let n = name
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\./g, '-')
    .trim()
  let prev
  do {
    prev = n
    n = n.replace(EFFORT_SUFFIX, '').replace(DATE_SUFFIX, '')
  } while (n !== prev)
  return n
}

export async function fetchArenaRows() {
  const res = await fetch(LMARENA_TEXT_LATEST_URL)
  if (!res.ok) throw new Error(`LMArena: HTTP ${res.status}`)
  const file = await res.arrayBuffer()
  const rows = await parquetReadObjects({ file })
  if (rows.length === 0) throw new Error('LMArena: dataset vacío')
  return rows
}

/**
 * Devuelve Map<modelId, { [categoría]: { rating, votes, variant } }> para los
 * ids pedidos. Si un modelo aparece con varias variantes (ej. "-high" y
 * "-max"), se prefiere la variante sin sufijo; si no existe, la de más votos
 * (la más usada, y por lo tanto la más representativa).
 */
export function matchQuality(rows, modelIds) {
  const wanted = new Map(modelIds.map((id) => [normalize(id), id]))
  const result = new Map()

  for (const row of rows) {
    if (!QUALITY_CATEGORIES.includes(row.category)) continue
    const id = wanted.get(normalize(row.model_name))
    if (!id) continue

    const isBase = normalize(row.model_name) === row.model_name.toLowerCase().replace(/\./g, '-')
    const perModel = result.get(id) ?? {}
    const current = perModel[row.category]
    const candidate = {
      rating: Math.round(row.rating),
      votes: Number(row.vote_count),
      variant: row.model_name,
      base: isBase,
    }
    if (
      !current ||
      (candidate.base && !current.base) ||
      (candidate.base === current.base && candidate.votes > current.votes)
    ) {
      perModel[row.category] = candidate
    }
    result.set(id, perModel)
  }

  for (const perModel of result.values()) {
    for (const score of Object.values(perModel)) delete score.base
  }
  return result
}

export function publishDate(rows) {
  return rows.map((r) => r.leaderboard_publish_date).sort().at(-1) ?? null
}
