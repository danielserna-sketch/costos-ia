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

// Palabras que, aunque calcen con la forma de un id válido, no representan un
// SKU "activo" vendible (snapshots de preview o líneas ya descontinuadas).
const DENYLIST_WORDS = new Set(['preview', 'turbo', 'instant'])

function hasDeniedWord(words) {
  return words.some((w) => DENYLIST_WORDS.has(w))
}

// Nombres de variante que se muestran en minúscula (siguiendo la convención
// que ya usan los proveedores en su propia documentación); cualquier otra
// variante (codenames como sol/luna/terra/astra/cyber) se capitaliza.
const LOWERCASE_VARIANTS = new Set(['mini', 'nano'])

function formatVariant(word) {
  return LOWERCASE_VARIANTS.has(word) ? word : capitalize(word)
}

// Cada extractor recibe el id "limpio" (sin prefijo de proveedor, ej. sin el
// "gemini/" inicial) y, si reconoce la forma, devuelve { tier, version, name }.
// `tier` agrupa versiones de la misma línea de producto; `version` es un array
// de números comparable con compareVersions; `name` es el nombre para mostrar.
// No se restringe a una lista fija de variantes (mini/nano/etc.): cualquier
// sufijo de una sola palabra se acepta como una línea de producto propia,
// salvo que esté en DENYLIST_WORDS.
const EXTRACTORS = {
  anthropic: (slug) => {
    const m = slug.match(/^claude-([a-z]+)((?:-\d+){1,2})$/)
    if (!m) return null
    const [, family, versionSuffix] = m
    if (hasDeniedWord([family])) return null
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
    let m = slug.match(/^gpt-(\d+(?:\.\d+)?)(?:-([a-z]+))?$/)
    if (m) {
      const [, versionStr, variant] = m
      if (variant && hasDeniedWord([variant])) return null
      const version = versionStr.split('.').map(Number)
      return {
        tier: variant ? `gpt-${variant}` : 'gpt',
        version,
        name: `GPT-${version.join('.')}${variant ? ` ${formatVariant(variant)}` : ''}`,
      }
    }
    m = slug.match(/^o(\d+)(?:-([a-z]+))?$/)
    if (m) {
      const [, versionStr, variant] = m
      if (variant && hasDeniedWord([variant])) return null
      const version = [Number(versionStr)]
      return {
        tier: variant ? `o-${variant}` : 'o',
        version,
        name: `o${version[0]}${variant ? `-${formatVariant(variant)}` : ''}`,
      }
    }
    return null
  },
  gemini: (slug) => {
    const m = slug.match(/^gemini-(\d+(?:\.\d+)?)-([a-z]+(?:-[a-z]+)*)$/)
    if (!m) return null
    const [, versionStr, variantPath] = m
    const words = variantPath.split('-')
    if (hasDeniedWord(words)) return null
    const version = versionStr.split('.').map(Number)
    return {
      tier: variantPath,
      version,
      name: `Gemini ${version.join('.')} ${words.map(capitalize).join('-')}`,
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

// Validación cruzada con la página oficial de precios de cada proveedor.
// OpenAI queda afuera a propósito: su página bloquea requests automatizados
// con un challenge anti-bot (Cloudflare) y no vamos a intentar evadir eso —
// para OpenAI seguimos confiando solo en los EXTRACTORS de arriba.
//
// `anchors` son nombres de tier bien establecidos que deberían aparecer
// siempre en la página si el scraping realmente está viendo el contenido
// real; si ni siquiera esos aparecen, asumimos que el scraping falló
// (cambio de layout, bloqueo, etc.) y NO filtramos nada esa corrida — mejor
// dejar pasar un modelo dudoso que borrar el catálogo entero por un scraper
// roto.
const VALIDATION = {
  Anthropic: {
    url: 'https://www.anthropic.com/pricing',
    anchors: ['opus', 'sonnet', 'haiku'],
    scrape: scrapeWithBrowser,
  },
  Google: {
    url: 'https://ai.google.dev/gemini-api/docs/pricing',
    anchors: ['flash', 'pro'],
    scrape: scrapeWithFetch,
  },
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

async function scrapeWithFetch(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return htmlToText(await res.text())
}

async function scrapeWithBrowser(url) {
  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    return null // playwright no instalado en este entorno; se omite validación
  }
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    return (await page.innerText('body')).toLowerCase()
  } finally {
    await browser.close()
  }
}

async function fetchOfficialPageText(provider) {
  const config = VALIDATION[provider]
  if (!config) return null

  try {
    const text = await config.scrape(config.url)
    if (!text) return null

    const confident = config.anchors.every((a) => text.includes(a))
    if (!confident) {
      console.warn(
        `Aviso: no se pudo confirmar contenido real en la página de ${provider} (¿cambió el layout?) — se omite la validación cruzada para este proveedor en esta corrida.`,
      )
      return null
    }
    return text
  } catch (err) {
    console.warn(
      `Aviso: scraping de ${provider} falló (${err.message}) — se omite la validación cruzada para este proveedor en esta corrida.`,
    )
    return null
  }
}

// Un tier se confirma si TODAS sus palabras (ej. "flash-lite" -> flash, lite)
// aparecen en el texto de la página oficial. No se exige que coincida el
// número de versión exacto: las páginas de marketing no siempre listan cada
// versión menor, así que eso generaría falsos negativos.
function confirmedOnPage(tier, pageText) {
  return tier.split('-').every((word) => pageText.includes(word))
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

  // Validación cruzada contra la página oficial de cada proveedor (ver
  // fetchOfficialPageText arriba). Descarta candidatos cuyo tier no aparezca
  // en la página real, solo cuando el scraping de esa página fue confiable.
  for (const provider of ['Anthropic', 'Google']) {
    const pageText = await fetchOfficialPageText(provider)
    if (!pageText) continue

    for (const [tier, candidate] of winners[provider]) {
      if (!confirmedOnPage(tier, pageText)) {
        console.warn(
          `Descartado ${provider}/${candidate.slug} (${candidate.match.name}): "${tier}" no aparece en la página oficial de precios.`,
        )
        winners[provider].delete(tier)
      }
    }
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
