import type { ReactNode } from 'react'
import { generatedAt, qualityMeta } from '@/data/models'
import { BALANCE_MARGIN } from '@/utils/recommend'
import { formatDate } from '@/utils/format'
import { PageHeader } from '@/components/PageHeader'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </section>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline hover:text-slate-900 dark:hover:text-slate-100">
      {children}
    </a>
  )
}

export function Methodology() {
  return (
    <>
      <PageHeader
        title="Metodología"
        description="De dónde salen los datos, cómo se clasifican los modelos y cómo se arma la recomendación, con sus limitaciones."
      />

      <div className="flex flex-col gap-4">
        <Block title="Precios y modelos">
          <p>
            Ninguno de los tres proveedores publica una API oficial de precios. Los
            precios salen del dataset comunitario de{' '}
            <ExternalLink href="https://github.com/BerriAI/litellm">LiteLLM</ExternalLink>,
            que se sincroniza cada día con una tarea automática
            {generatedAt ? ` (última actualización: ${formatDate(generatedAt)})` : ''}.
          </p>
          <p>
            Por cada línea de producto (por ejemplo Claude Sonnet, GPT mini o Gemini
            Flash) se conserva solo la versión más reciente, y se descartan previews
            y snapshots con fecha. En Anthropic y Google se verifica además que
            cada línea de producto aparezca en su página oficial de precios; los
            precios en sí siguen viniendo de LiteLLM. La página de OpenAI bloquea el
            acceso automatizado, así que en ese caso no hay verificación.
          </p>
          <p>
            El costo se calcula así: (tokens de entrada × precio de entrada + tokens de
            salida × precio de salida) × requests por mes. Todavía no descuenta el
            precio de caché ni los precios escalonados por tamaño de prompt.
          </p>
        </Block>

        <Block title="Calidad">
          <p>
            La calidad es el Arena Score de{' '}
            <ExternalLink href="https://lmarena.ai/leaderboard">LMArena</ExternalLink>{' '}
            (licencia CC BY 4.0
            {qualityMeta?.publishedAt ? `, publicado ${formatDate(qualityMeta.publishedAt)}` : ''}).
            Es una escala tipo Elo construida con votos de usuarios que comparan
            respuestas a ciegas: 100 puntos de diferencia equivalen a que el modelo
            de mayor puntaje sea preferido cerca del 64% de las veces.
          </p>
          <p>
            Cada tarea usa la categoría del leaderboard que más se le parece: código
            → coding, resumen y RAG → textos largos, soporte → conversación, agente y
            análisis → prompts difíciles, clasificación → seguir instrucciones. Si un
            modelo no tiene esa categoría, se usa su puntaje general.
          </p>
          <p>
            Los modelos que todavía no están en LMArena se muestran como "sin
            puntaje". No se les asigna el puntaje de otra versión.
          </p>
        </Block>

        <Block title="Categorías competitivas">
          <p>
            Cada proveedor tiene tres modelos "ancla" que definen su escalera de
            precios: Opus / Sonnet / Haiku en Anthropic, GPT / GPT mini / GPT nano en
            OpenAI y Pro / Flash / Flash-Lite en Google. Corresponden a Flagship,
            Balanceado y Económico. Los demás modelos (variantes como Sol, Luna o
            Fable) se ubican en la categoría cuyo ancla tiene el precio más cercano
            dentro del mismo proveedor. La serie o de OpenAI va aparte, como
            Razonamiento.
          </p>
          <p>
            Es una clasificación por posicionamiento de precio, no una medición de
            capacidad. Para capacidad, mira la calidad.
          </p>
        </Block>

        <Block title="Cómo se elige la recomendación">
          <p>
            Primero se filtran los modelos aptos para la tarea: los de una categoría
            permitida (por ejemplo, un agente autónomo solo acepta Flagship) y con
            ventana de contexto suficiente para los tokens de entrada. Sobre esos:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Más barato:</strong> el de menor costo mensual.
            </li>
            <li>
              <strong>Mejor balance:</strong> el más barato entre los que están a
              menos de {BALANCE_MARGIN} puntos de calidad del mejor. Frente al mejor,
              sería preferido cerca del 44% de las veces, casi paridad.
            </li>
            <li>
              <strong>Máxima calidad:</strong> el de mayor puntaje. Si hay empate, el
              más barato.
            </li>
          </ul>
          <p>
            Las alternativas son lo que la misma estrategia elegiría dentro de cada
            uno de los otros proveedores.
          </p>
        </Block>

        <Block title="Limitaciones">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Los volúmenes de tokens por tarea son aproximaciones; ajústalos con tus
              datos reales.
            </li>
            <li>
              LMArena mide preferencia de usuarios en conversaciones generales, no
              exactitud en tu caso de uso. Conviene validar con tus propias pruebas.
            </li>
            <li>
              Algunos puntajes se miden con el modelo en modo de razonamiento alto. En
              esa configuración genera más tokens de salida que los estimados, así que
              el costo real puede ser mayor.
            </li>
            <li>
              Los datos de LiteLLM son comunitarios y pueden tardar en reflejar un
              cambio de precio oficial.
            </li>
          </ul>
        </Block>
      </div>
    </>
  )
}
