import type { Provider } from '@/types/model'

/**
 * Única fuente de identidad visual por proveedor. El color se expone como
 * variable CSS (definida en index.css con su paso para modo oscuro), así los
 * gráficos SVG (`fill="var(--provider-…)"`) y los badges usan el mismo valor.
 *
 * Paleta validada con el validador del skill dataviz (claro y oscuro): ningún
 * proveedor usa verde ni rojo, que quedan reservados para "mejor/ahorro" y
 * "más caro". El color nunca va solo: siempre acompaña al nombre.
 */
export interface ProviderMeta {
  color: string
  pricingUrl: string
  docsUrl: string
}

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  Anthropic: {
    color: 'var(--provider-anthropic)',
    pricingUrl: 'https://www.anthropic.com/pricing',
    docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
  },
  OpenAI: {
    color: 'var(--provider-openai)',
    pricingUrl: 'https://openai.com/api/pricing',
    docsUrl: 'https://platform.openai.com/docs/models',
  },
  Google: {
    color: 'var(--provider-google)',
    pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing',
    docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
  },
  xAI: {
    color: 'var(--provider-xai)',
    pricingUrl: 'https://docs.x.ai/docs/models',
    docsUrl: 'https://docs.x.ai/docs/models',
  },
  Mistral: {
    color: 'var(--provider-mistral)',
    pricingUrl: 'https://mistral.ai/pricing',
    docsUrl: 'https://docs.mistral.ai/getting-started/models/',
  },
  DeepSeek: {
    color: 'var(--provider-deepseek)',
    pricingUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    docsUrl: 'https://api-docs.deepseek.com/',
  },
}

export function providerColor(provider: Provider): string {
  return PROVIDER_META[provider].color
}
