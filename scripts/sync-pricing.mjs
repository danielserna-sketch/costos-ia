// Sincroniza src/data/models.generated.json con el dataset comunitario de LiteLLM.
// Uso: node scripts/sync-pricing.mjs
//
// Estrategia: por cada proveedor se reconocen "líneas" de producto (tiers) con
// una forma de nombre conocida (ej. claude-opus-<version>, gpt-<version>-mini,
// gemini-<version>-flash) y, dentro de cada línea, se conserva solo la versión
// más alta. IDs que no calzan con ninguna forma conocida (previews, snapshots
// fechados, nombres en código experimentales) se ignoran automáticamente. Solo
// hay que tocar los extractores cuando un proveedor lanza una FORMA de nombre
// nueva (ej. un tier "ultra"), no en cada cambio de precio o versión.
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const LITELLM_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const OUTPUT_PATH = fileURLToPath(
  new URL('../src/data/models.generated.json', import.meta.url),
)

const PROVIDER_MAP = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
}

function compareVersions(a, b) {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? -Infinity
    const bv = b[i] ?? -Infinity
    if (av !== bv) return av - bv
  }
  return 0
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// Cada extractor recibe el id "limpio" (sin prefijo de proveedor, ej. sin el
// "gemini/" inicial) y, si reconoce la forma, devuelve { tier, version, name }.
// `tier` agrupa versiones de la misma línea de producto; `version` es un array
// de números comparable con compareVersions; `name` es el nombre para mostrar.
const EXTRACTORS = {
  anthropic: (slug) => {
    const m = slug.match(/^claude-(opus|sonnet|haiku|fable)((?:-\d+){1,2})$/)
    if (!m) return null
    const [, family, versionSuffix] = m
    const version = versionSuffix
      .split('-')
      .filter(Boolean)
      .map(Number)
    return {
      tier: family,
      version,
      name: `Claude ${capitalize(family)} ${version.join('.')}`,
    }
  },
  openai: (slug) => {
    let m = slug.match(/^gpt-(\d+(?:\.\d+)?)(?:-(mini|nano))?$/)
    if (m) {
      const [, versionStr, size] = m
      const version = versionStr.split('.').map(Number)
      return {
        tier: size ? `gpt-${size}` : 'gpt',
        version,
        name: `GPT-${version.join('.')}${size ? ` ${size}` : ''}`,
      }
    }
    m = slug.match(/^o(\d+)(?:-(mini|pro))?$/)
    if (m) {
      const [, versionStr, size] = m
      const version = [Number(versionStr)]
      return {
        tier: size ? `o-${size}` : 'o',
        version,
        name: `o${version[0]}${size ? `-${size}` : ''}`,
      }
    }
    return null
  },
  gemini: (slug) => {
    const m = slug.match(/^gemini-(\d+(?:\.\d+)?)-(flash|pro)(-lite)?$/)
    if (!m) return null
    const [, versionStr, size, lite] = m
    const version = versionStr.split('.').map(Number)
    return {
      tier: `${size}${lite ?? ''}`,
      version,
      name: `Gemini ${version.join('.')} ${capitalize(size)}${lite ? '-Lite' : ''}`,
    }
  },
}

function round(value, decimals = 4) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function stripProviderPrefix(id) {
  return id.includes('/') ? id.split('/').pop() : id
}

async function main() {
  const res = await fetch(LITELLM_URL)
  if (!res.ok) {
    throw new Error(`No se pudo descargar el dataset de LiteLLM: HTTP ${res.status}`)
  }
  const raw = await res.json()

  // Map<provider, Map<tier, candidato ganador>>
  const winners = {
    Anthropic: new Map(),
    OpenAI: new Map(),
    Google: new Map(),
  }

  for (const [rawId, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object') continue
    if (entry.mode !== 'chat') continue

    const litellmProvider = entry.litellm_provider
    const provider = PROVIDER_MAP[litellmProvider]
    if (!provider) continue
    if (entry.input_cost_per_token == null || entry.output_cost_per_token == null) {
      continue
    }

    const slug = stripProviderPrefix(rawId)
    const extractor = EXTRACTORS[litellmProvider]
    const match = extractor?.(slug)
    if (!match) continue

    const current = winners[provider].get(match.tier)
    if (current && compareVersions(current.match.version, match.version) >= 0) {
      continue
    }

    winners[provider].set(match.tier, { slug, entry, match })
  }

  const byProvider = { Anthropic: [], OpenAI: [], Google: [] }

  for (const [provider, tierMap] of Object.entries(winners)) {
    for (const { slug, entry, match } of tierMap.values()) {
      const model = {
        id: slug,
        provider,
        name: match.name,
        inputPricePerMTokens: round(entry.input_cost_per_token * 1_000_000),
        outputPricePerMTokens: round(entry.output_cost_per_token * 1_000_000),
        contextWindow: entry.max_input_tokens ?? entry.max_tokens ?? 0,
      }
      if (entry.cache_read_input_token_cost != null) {
        model.cachedInputPricePerMTokens = round(
          entry.cache_read_input_token_cost * 1_000_000,
        )
      }
      byProvider[provider].push(model)
    }
  }

  for (const [provider, list] of Object.entries(byProvider)) {
    if (list.length === 0) {
      throw new Error(
        `0 modelos coincidieron para ${provider} — abortando sin escribir (revisa EXTRACTORS o el dataset fuente).`,
      )
    }
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const models = [...byProvider.Anthropic, ...byProvider.OpenAI, ...byProvider.Google]

  // Si los modelos no cambiaron respecto a la corrida anterior, se reutiliza
  // el generatedAt viejo: así el archivo queda byte-idéntico y el workflow no
  // genera un commit vacío solo por refrescar la fecha.
  let generatedAt = new Date().toISOString()
  try {
    const previous = JSON.parse(await readFile(OUTPUT_PATH, 'utf-8'))
    if (
      Array.isArray(previous?.models) &&
      JSON.stringify(previous.models) === JSON.stringify(models)
    ) {
      generatedAt = previous.generatedAt
    }
  } catch {
    // No hay archivo previo (primera corrida) o quedó inválido: se usa la
    // fecha actual sin problema.
  }

  const output = { generatedAt, models }

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  console.log(
    `Listo: ${models.length} modelos (Anthropic:${byProvider.Anthropic.length} OpenAI:${byProvider.OpenAI.length} Google:${byProvider.Google.length})`,
  )
}

main().catch((err) => {
  console.error('sync-pricing falló:', err.message)
  process.exit(1)
})
