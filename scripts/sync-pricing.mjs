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
import { fetchArenaRows, matchQuality, publishDate } from './quality.mjs'

const LITELLM_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const OUTPUT_PATH = fileURLToPath(
  new URL('../src/data/models.generated.json', import.meta.url),
)

const PROVIDER_MAP = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  gemini: 'Google',
  xai: 'xAI',
  mistral: 'Mistral',
  deepseek: 'DeepSeek',
}

// Proveedores sin los cuales el catálogo no tiene sentido: si alguno queda en
// 0 modelos se aborta sin escribir. Para el resto solo se avisa (un cambio de
// nombres en un proveedor secundario no debe bloquear la sincronización).
// Meta no se incluye: LiteLLM no publica precios de su API propia (solo de
// revendedores como Bedrock o Together, con precios distintos entre sí).
const CORE_PROVIDERS = new Set(['Anthropic', 'OpenAI', 'Google'])

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
  // xAI numera en decimal (4.20 es anterior a 4.3), así que la versión se
  // compara como un único número. Los alias (-latest, -reasoning, -beta…)
  // quedan fuera porque la forma exige que el id termine en la versión.
  xai: (slug) => {
    let m = slug.match(/^grok-(\d+(?:\.\d+)?)$/)
    if (m) {
      return { tier: 'grok', version: [Number(m[1])], name: `Grok ${m[1]}` }
    }
    m = slug.match(/^grok-code-fast-(\d+)$/)
    if (m) {
      return { tier: 'grok-code-fast', version: [Number(m[1])], name: `Grok Code Fast ${m[1]}` }
    }
    return null
  },
  deepseek: (slug) => {
    const m = slug.match(/^deepseek-v(\d+(?:\.\d+)?)-([a-z]+)$/)
    if (!m) return null
    const [, versionStr, variant] = m
    if (hasDeniedWord([variant])) return null
    const version = versionStr.split('.').map(Number)
    return {
      tier: variant,
      version,
      name: `DeepSeek V${version.join('.')} ${capitalize(variant)}`,
    }
  },
  // Mistral publica versiones numeradas (mistral-medium-3-5) solo para
  // algunas líneas; para el resto se acepta el alias "-latest" (versión 0,
  // así una numerada siempre le gana). Los snapshots fechados (-2512) quedan
  // fuera por tener más de dos dígitos.
  mistral: (slug) => {
    const m = slug.match(
      /^(mistral|magistral|devstral)-(large|medium|small)-(\d{1,2}(?:[.-]\d{1,2})?|latest)$/,
    )
    if (!m) return null
    const [, family, size, versionStr] = m
    const version = versionStr === 'latest' ? [0] : versionStr.split(/[.-]/).map(Number)
    const versionLabel = versionStr === 'latest' ? '' : ` ${version.join('.')}`
    return {
      tier: `${family}-${size}`,
      version,
      name: `${capitalize(family)} ${capitalize(size)}${versionLabel}`,
    }
  },
}

// Umbrales de "contexto largo" que usa LiteLLM (ej.
// input_cost_per_token_above_200k_tokens); se toma el más bajo presente.
const LONG_CONTEXT_THRESHOLDS = [
  ['32k', 32_000],
  ['128k', 128_000],
  ['200k', 200_000],
  ['256k', 256_000],
  ['272k', 272_000],
  ['512k', 512_000],
]

function longContextPricing(entry) {
  for (const [label, tokens] of LONG_CONTEXT_THRESHOLDS) {
    const input = entry[`input_cost_per_token_above_${label}_tokens`]
    const output = entry[`output_cost_per_token_above_${label}_tokens`]
    if (input != null && output != null) {
      return {
        thresholdTokens: tokens,
        inputPricePerMTokens: round(input * 1_000_000),
        outputPricePerMTokens: round(output * 1_000_000),
      }
    }
  }
  return null
}

// Modalidades de entrada y capacidades, a partir de los flags `supports_*`
// de LiteLLM. Un flag ausente se interpreta como "no soportado".
function inputModalities(entry) {
  const modalities = ['text']
  if (entry.supports_vision || entry.supports_image_input) modalities.push('image')
  if (entry.supports_pdf_input) modalities.push('pdf')
  if (entry.supports_audio_input) modalities.push('audio')
  if (entry.supports_video_input) modalities.push('video')
  return modalities
}

function capabilities(entry) {
  const caps = []
  if (entry.supports_function_calling) caps.push('tools')
  if (entry.supports_response_schema || entry.supports_native_structured_output) {
    caps.push('structured')
  }
  if (entry.supports_reasoning) caps.push('reasoning')
  if (entry.supports_web_search) caps.push('web')
  if (entry.supports_prompt_caching || entry.cache_read_input_token_cost != null) {
    caps.push('caching')
  }
  if (entry.supports_computer_use) caps.push('computer')
  return caps
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

// Detecta sucesiones de versión con cambio de precio dentro de la misma
// línea de producto (mismo `tier`, `id` distinto), comparando contra el
// snapshot anterior. Se usa para mostrar un aviso tipo "GPT-5.6 Sol -> GPT-6
// Sol, 50% más barato" en el front.
function computeChanges(previousModels, currentModels) {
  const previousByTier = new Map(
    previousModels.filter((m) => m.tier).map((m) => [m.tier, m]),
  )

  const changes = []
  for (const model of currentModels) {
    if (!model.tier) continue
    const prev = previousByTier.get(model.tier)
    if (!prev || prev.id === model.id) continue
    if (
      prev.inputPricePerMTokens === model.inputPricePerMTokens &&
      prev.outputPricePerMTokens === model.outputPricePerMTokens
    ) {
      continue
    }

    changes.push({
      provider: model.provider,
      oldName: prev.name,
      newName: model.name,
      oldInputPricePerMTokens: prev.inputPricePerMTokens,
      newInputPricePerMTokens: model.inputPricePerMTokens,
      oldOutputPricePerMTokens: prev.outputPricePerMTokens,
      newOutputPricePerMTokens: model.outputPricePerMTokens,
    })
  }
  return changes
}

async function main() {
  const res = await fetch(LITELLM_URL)
  if (!res.ok) {
    throw new Error(`No se pudo descargar el dataset de LiteLLM: HTTP ${res.status}`)
  }
  const raw = await res.json()

  // Map<provider, Map<tier, candidato ganador>>
  const providerNames = Object.values(PROVIDER_MAP)
  const winners = Object.fromEntries(providerNames.map((p) => [p, new Map()]))

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

  const byProvider = Object.fromEntries(providerNames.map((p) => [p, []]))

  for (const [provider, tierMap] of Object.entries(winners)) {
    for (const [tier, { slug, entry, match }] of tierMap) {
      // Precio 0 = modelo experimental/gratuito sin tarifa pública real.
      if (entry.input_cost_per_token === 0 && entry.output_cost_per_token === 0) continue
      const model = {
        id: slug,
        provider,
        name: match.name,
        inputPricePerMTokens: round(entry.input_cost_per_token * 1_000_000),
        outputPricePerMTokens: round(entry.output_cost_per_token * 1_000_000),
        contextWindow: entry.max_input_tokens ?? entry.max_tokens ?? 0,
        tier: `${provider}:${tier}`,
      }
      if (entry.cache_read_input_token_cost != null) {
        model.cachedInputPricePerMTokens = round(
          entry.cache_read_input_token_cost * 1_000_000,
        )
      }
      if (entry.cache_creation_input_token_cost != null) {
        model.cacheWritePricePerMTokens = round(
          entry.cache_creation_input_token_cost * 1_000_000,
        )
      }
      if (entry.max_output_tokens != null) model.maxOutputTokens = entry.max_output_tokens
      model.inputModalities = inputModalities(entry)
      model.capabilities = capabilities(entry)
      const longContext = longContextPricing(entry)
      if (longContext) model.longContextPricing = longContext
      if (entry.deprecation_date) model.deprecationDate = entry.deprecation_date
      byProvider[provider].push(model)
    }
  }

  for (const [provider, list] of Object.entries(byProvider)) {
    if (list.length === 0) {
      const message = `0 modelos coincidieron para ${provider} (revisa EXTRACTORS o el dataset fuente)`
      if (CORE_PROVIDERS.has(provider)) throw new Error(`${message} — abortando sin escribir.`)
      console.warn(`Aviso: ${message}; se omite este proveedor.`)
    }
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  const models = providerNames.flatMap((p) => byProvider[p])

  let previous = null
  try {
    previous = JSON.parse(await readFile(OUTPUT_PATH, 'utf-8'))
  } catch {
    // Primera corrida o archivo inválido.
  }
  const previousModels = Array.isArray(previous?.models) ? previous.models : []

  // Fecha en que cada id apareció por primera vez en el catálogo; es la
  // señal de "modelo nuevo" (LiteLLM no publica fechas de lanzamiento). Un
  // cambio de versión dentro de un tier cambia el id y cuenta como nuevo.
  // En la corrida que inicia el seguimiento (archivo previo sin
  // `trackingSince`) todo queda en null = "anterior al seguimiento", para no
  // marcar el catálogo entero como novedad.
  const today = new Date().toISOString().slice(0, 10)
  const trackingSince = previous?.trackingSince ?? today
  const firstSeenById = new Map(previousModels.map((m) => [m.id, m.firstSeenAt ?? null]))
  for (const model of models) {
    if (!previous?.trackingSince) model.firstSeenAt = null
    else model.firstSeenAt = firstSeenById.has(model.id) ? firstSeenById.get(model.id) : today
  }

  // Calidad (LMArena). Si la descarga falla, se conservan los puntajes de la
  // corrida anterior en vez de borrarlos: un fallo transitorio no debe
  // quitarle la señal de calidad al front ni generar un commit.
  let quality = previous?.quality ?? null
  try {
    const rows = await fetchArenaRows()
    const scores = matchQuality(rows, models.map((m) => m.id))
    for (const model of models) {
      const perModel = scores.get(model.id)
      if (perModel) model.quality = perModel
    }
    quality = {
      source: 'LMArena (lmarena.ai) — CC BY 4.0',
      publishedAt: publishDate(rows),
    }
    console.log(`Calidad: ${scores.size}/${models.length} modelos con puntaje de LMArena.`)
  } catch (err) {
    console.warn(`Aviso: no se pudo actualizar la calidad (${err.message}); se conservan los puntajes anteriores.`)
    const previousById = new Map(previousModels.map((m) => [m.id, m]))
    for (const model of models) {
      const prevQuality = previousById.get(model.id)?.quality
      if (prevQuality) model.quality = prevQuality
    }
  }

  // Si los modelos no cambiaron respecto a la corrida anterior, se reutiliza
  // el generatedAt y los `changes` viejos: así el archivo queda byte-idéntico
  // (el workflow no genera un commit vacío) y el aviso de cambios recientes
  // no desaparece del front en la primera corrida sin novedades después de
  // uno real.
  let generatedAt = new Date().toISOString()
  let changes = []
  if (previous) {
    if (
      previous.trackingSince === trackingSince &&
      JSON.stringify(previousModels) === JSON.stringify(models) &&
      JSON.stringify(previous.quality ?? null) === JSON.stringify(quality)
    ) {
      generatedAt = previous.generatedAt
      changes = Array.isArray(previous.changes) ? previous.changes : []
    } else {
      changes = computeChanges(previousModels, models)
    }
  }

  const output = { generatedAt, trackingSince, quality, models, changes }

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  const counts = providerNames.map((p) => `${p}:${byProvider[p].length}`).join(' ')
  console.log(`Listo: ${models.length} modelos (${counts})`)
}

main().catch((err) => {
  console.error('sync-pricing falló:', err.message)
  process.exit(1)
})
