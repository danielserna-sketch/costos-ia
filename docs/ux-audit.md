# Auditoría UX/UI de Costos IA y roadmap

> Objetivo del producto: que una persona entienda rápido **qué modelos existen, qué hace cada uno, cuánto cuesta y qué alternativas le sirven** para su caso de uso.

Este documento tiene tres partes: el diagnóstico de la versión anterior (septiembre de 2026), la propuesta de diseño y el roadmap por fases. La **Fase 1 ya está implementada** (ver [§7](#7-roadmap)).

---

## 1. Hallazgos y recomendaciones

Prioridades: **P0** bloquea el objetivo del producto, **P1** lo degrada de forma notable y **P2** es pulido o deuda.

| # | Problema | Impacto en el usuario | Solución UX | Cambio visual | Prio | Estado |
|---|---|---|---|---|---|---|
| 1 | No hay búsqueda y el único filtro es por proveedor | No se encuentra un modelo por nombre ni por capacidad ("¿cuál acepta PDF?") | Directorio `/modelos` con buscador, chips de filtro rápido y panel avanzado | Barra de búsqueda protagonista, chips bajo ella y barra lateral de filtros | P0 | ✅ Fase 1 |
| 2 | No se muestran capacidades, modalidades ni estado | No se puede responder "¿procesa imágenes?", "¿usa herramientas?" ni "¿es nuevo?" | Enriquecer el sync con los flags de LiteLLM y derivar estado y fortalezas | Etiquetas de modalidad, badges "✦ Nuevo" y "⚠ Por retirarse", lista ✓/– en el detalle | P0 | ✅ Fase 1 |
| 3 | Home sobrecargado: 5 secciones y el catálogo completo repetido de Mercado | Hay que leer mucho antes de poder actuar | Home con 3 acciones claras (Explorar, Comparar, Mi caso) y luego descubrimiento | Hero con buscador, 3 tarjetas de acción, novedades, populares y proveedores | P0 | ✅ Fase 1 |
| 4 | Filtro de proveedor global e invisible: cambiarlo en Home alteraba el Recomendador y el Comparador | Resultados "desaparecidos" sin explicación | Filtros locales por página y guardados en la URL, con un resumen visible | Fila "Filtrando: [chip ×] … Limpiar todo" | P0 | ✅ en `/modelos`; Recomendador y Mercado aún usan el filtro global (Fase 2) |
| 5 | OpenAI usaba emerald, el mismo color que "mejor valor" y "ahorro" | Se confunde la identidad del proveedor con un juicio de valor | Paleta categórica propia, validada para daltonismo y sin verde ni rojo | Badge neutro con un punto de color y el nombre siempre visible | P0 | ✅ Fase 1 |
| 6 | Calidad mostrada como Elo crudo ("1511") | Nadie sabe si 1511 es bueno o malo | Posición relativa: "#3 de 19", más una barra escalada al catálogo | `QualityMeter` y tooltip explicativo | P1 | ✅ en el detalle; la tabla aún muestra el número |
| 7 | Tablas densas en móvil (`min-w-[760px]` sin columna fija) | Scroll horizontal y pérdida del contexto del nombre | Tarjetas por debajo de `sm` y tabla con columna fija en desktop | `ModelCard` y columna `sticky` | P1 | ✅ Fase 1 |
| 8 | Estado solo en memoria | No se puede compartir ni recargar sin perder lo hecho | Filtros, orden, vista y modelo abierto en los query params | URLs como `/#/modelos?proveedor=Google&entrada=pdf` | P1 | ✅ directorio; el comparador (`?m=`) queda para la Fase 2 |
| 9 | Precios con 4 decimales fijos ("US$ 0,2000") | Ruido visual y lectura lenta | Decimales adaptativos: $0,20, $0,075 o $15 | La unidad "1M tokens" aparece una vez por bloque | P1 | ✅ Fase 1 |
| 10 | Tooltips con `title` | No funcionan en táctil ni con teclado | `InfoTip` accesible que se abre con clic, foco o hover y se cierra con Esc | Icono "?" junto al título de la sección | P1 | ✅ Fase 1 |
| 11 | El comparador es una tabla transpuesta sin agrupar | Cuesta ver qué diferencia realmente a los modelos | Comparador agrupado por secciones, con resaltado del mejor valor y opción "Solo diferencias" | Cabeceras fijas por modelo y grupos colapsables | P1 | Fase 2 |
| 12 | La calculadora de costo está escondida en el Recomendador | No se entiende el costo real de un uso concreto | Página Precios con presets de consumo, caché y contexto largo | Ranking con barras horizontales de costo mensual y por request | P1 | Fase 3 |
| 13 | El KPI "Cambios de precio: 0" | Ocupa espacio sin aportar | Mostrarlo solo cuando hay cambios | Contador dentro del enlace a Mercado | P2 | ✅ Fase 1 |
| 14 | Accesibilidad: sin `aria-sort`, foco invisible y tema con emojis | Barreras para usuarios de teclado y lector de pantalla | `aria-sort`, `:focus-visible` global e iconos SVG con `aria-label` | Anillo de foco sky-500 | P2 | ✅ Fase 1 |
| 15 | La marca decía "Tablero de Costos IA" y no había meta description ni Open Graph | Enlaces compartidos pobres y marca inconsistente | Unificar a "Costos IA" y agregar description y OG | — | P2 | ✅ Fase 1 |

### Otros hallazgos menores

- **Comparaciones sin competidores directos a mano:** el detalle de un modelo ahora lista el más barato de cada otro proveedor en su misma categoría y ofrece el botón "Comparar con competidores".
- **La bandeja de comparación no tenía destino visible:** se agregó una bandeja fija con la selección y el contador en la navegación.
- **La selección por defecto del comparador aparecía como "seleccionada" en el catálogo:** el primer clic en "Comparar" desde el directorio ahora empieza de cero.

---

## 2. Arquitectura de información y navegación

```
Explorar      /               Home: buscar · comparar · mi caso + descubrimiento
Modelos       /modelos        Directorio con búsqueda y filtros; detalle en panel lateral
Comparar      /comparador     Lado a lado, hasta 4 modelos
Casos de uso  /recomendador   Recomendación por tarea (evoluciona a /casos-de-uso, Fase 4)
Mercado       /mercado        Insights y cambios de precio (se integra en Precios/Novedades)
Precios       /precios        Calculadora y ranking por escenario            [Fase 3]
Novedades     /novedades      Lanzamientos, retiros y cambios de precio       [Fase 4]
Proveedores   /proveedores    Vista por proveedor y familia                   [Fase 4]
Metodología   /metodologia    En el footer y en enlaces contextuales
```

- **Header (≥640px):** logo, 5 secciones y el selector de tema. "Comparar" muestra el contador de la selección.
- **Móvil (<640px):** barra inferior fija con 5 iconos y etiqueta, al alcance del pulgar. El header conserva el logo y el tema.
- **Bandeja de comparación:** persiste en todas las páginas salvo en el comparador. Aparece solo cuando el usuario eligió algo y queda por encima de la barra móvil.
- **Profundidad máxima de 2 niveles.** El detalle de un modelo es un panel sobre el directorio, no una página nueva, para no perder los filtros. Aun así se puede enlazar: `?modelo=<id>`.

---

## 3. Layouts

### 3.1 Explorar (Home)

```
┌────────────────────────────────────────────────────────────┐
│ [IA] Costos IA   Explorar Modelos Comparar Casos Mercado ☾ │
├────────────────────────────────────────────────────────────┤
│        Qué modelos de IA existen, qué hacen y cuánto       │
│                       cuestan                              │
│        30 modelos de 6 proveedores · actualizado hoy       │
│        ┌──────────────────────────────────────────┐        │
│        │ 🔍 Busca un modelo…                        │        │
│        └──────────────────────────────────────────┘        │
│        (sugerencias en vivo → abre el detalle)             │
├──────────────────┬──────────────────┬──────────────────────┤
│ 🔍 Explorar      │ ⇄ Comparar       │ ◎ Encontrar para mi  │
│ modelos          │ Opus vs GPT vs…  │ caso                 │
│ Ver directorio → │ Abrir →          │ Elegir caso →        │
├──────────────────┴──────────────────┴──────────────────────┤
│ Casos de uso: (Clasificar) (Chatbot) (Resumir) (RAG) (…)   │
├────────────────────────────────────────────────────────────┤
│ Últimos modelos                               Ver todos →  │
│ [tarjeta] [tarjeta] [tarjeta]   ← carrusel con snap en móvil│
├────────────────────────────────────────────────────────────┤
│ Comparaciones populares                                    │
│ [Flagship: A vs B vs C] [Balanceado: …] [Económico: …]     │
├────────────────────────────────────────────────────────────┤
│ Proveedores  [● Anthropic 5] [● OpenAI 11] [● Google 3] …  │
├────────────────────────────────────────────────────────────┤
│ Lo destacado por categoría          Ver el mercado →       │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Modelos (directorio)

```
┌────────────────────────────────────────────────────────────┐
│ Modelos · 30 modelos de 6 proveedores                      │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🔍 Buscar por nombre o proveedor                        │ │
│ └────────────────────────────────────────────────────────┘ │
│ (✦ Nuevos) (Más baratos) (Contexto ≥1M) (Visión) (Razon.)  │
│ ─────────────────────────────────────────────────────────  │
│ 12 modelos · 2 filtros          Ordenar [Calidad ▾] [▦|☰]  │
│ Filtrando: [Google ×] [Acepta PDF ×]  Limpiar todo         │
├─────────────┬──────────────────────────────────────────────┤
│ PROVEEDOR   │ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ ☐ ● Anthrop │ │ Nombre  +│ │          │ │          │       │
│ ☐ ● OpenAI  │ │ ●Prov Cls│ │          │ │          │       │
│ CATEGORÍA   │ │ $in / $out│ │          │ │          │       │
│ DEBE ACEPTAR│ │ ctx · mod │ │          │ │          │       │
│ DEBE SOPORT.│ │ fortalezas│ │          │ │          │       │
│ CONTEXTO    │ └──────────┘ └──────────┘ └──────────┘       │
│ PRECIO MÁX. │                                              │
│ ESTADO      │                                              │
└─────────────┴──────────────────────────────────────────────┘
 Móvil: barra lateral → botón "Filtros (n)" → bottom sheet con "Ver n modelos".
 Detalle: panel derecho de 480px (bottom sheet en móvil):
   precio + ejemplo tangible → [Agregar a comparar] [Comparar con competidores]
   → Destaca en → Calidad (#rank) → Precios detallados → Contexto
   → Modalidades/capacidades ✓/– → Alternativas → Fuentes oficiales
```

**Tarjeta de modelo:** muestra como máximo cinco datos. Identidad (nombre, proveedor, categoría, estado), precio de entrada y salida, contexto, modalidades y hasta dos fortalezas. El resto vive en el detalle, siguiendo la idea de *progressive disclosure*.

### 3.3 Comparar (Fase 2)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ [Modelo A ×] │ [Modelo B ×] │ [Modelo C ×] │ [+ Agregar]  │ ← cabeceras fijas
├──────────────┴──────────────┴──────────────┴──────────────┤
│ [☐ Solo diferencias]      Escenario: [Chatbot ▾]          │
│ ▾ Costo            $in · $out · costo/mes (mejor = ★)     │
│ ▾ Calidad          #rank por categoría                    │
│ ▾ Contexto/salida                                         │
│ ▸ Modalidades      (filas iguales atenuadas)              │
│ ▸ Capacidades                                             │
│ Sugerencia: agrega a <competidor directo> (misma categoría)│
└───────────────────────────────────────────────────────────┘
 Móvil: una columna por modelo con scroll horizontal y snap; etiqueta de fila fija.
 URL: /comparador?m=id1,id2,id3
```

### 3.4 Precios (Fase 3)

```
┌─────────────────────────────┬─────────────────────────────┐
│ Presets:                    │ Ranking · costo mensual     │
│ (Chat corto) (RAG largo)    │ Modelo A  ████ $12          │
│ (Agente de código) (Masivo) │ Modelo B  ██████ $18        │
│ Entrada  [2.000] ───●──     │ Modelo C  ██████████ $31    │
│ Salida   [500]   ──●───     │ ▸ ver desglose entrada/salida│
│ Requests [30.000]────●─     │                             │
│ ☐ Usar caché (x% hits)      │ Costo por request · por mes │
└─────────────────────────────┴─────────────────────────────┘
```

Debe aplicar el precio de caché y el de contexto largo cuando corresponda. Hoy el cálculo de costo los ignora.

### 3.5 Casos de uso (Fase 4)

Tarjetas de necesidad: "Programar", "Documentos largos", "Imágenes", "Lo más económico" y "Razonamiento avanzado". Cada una propone 3 opciones con un **por qué generado a partir de los datos**, por ejemplo "#2 en código según LMArena", "1M de contexto" o "US$ 0,10 por 1M de entrada". Todas llevan el aviso "Son señales, no una recomendación absoluta". Esto reutiliza `utils/strengths.ts`.

---

## 4. Componentes reutilizables

| Componente | Archivo | Uso |
|---|---|---|
| `Card` / `CARD_CLASS` | `components/ui/Card.tsx` | Superficie estándar (borde, fondo, sombra) |
| `Button` / `ButtonLink` | `components/ui/Button.tsx` | Variantes primary, secondary y ghost |
| `Badge` / `StatusBadge` | `components/ui/Badge.tsx` | Categoría y estado ("✦ Nuevo", "⚠ Por retirarse"), nunca solo color |
| `Chip` | `components/ui/Chip.tsx` | Filtro rápido (`aria-pressed`) y filtro activo removible |
| `InfoTip` | `components/ui/InfoTip.tsx` | Tooltip accesible (clic, foco, hover, Esc) |
| `SearchInput` | `components/ui/SearchInput.tsx` | Tamaños md y lg |
| `ProviderBadge` | `components/ProviderBadge.tsx` | Punto de color y nombre, sobre fondo neutro |
| `ProviderLegend` | `components/ProviderLegend.tsx` | Leyenda de los gráficos, visible con 2 o más proveedores |
| `PriceTag` | `components/ModelBits.tsx` | Precio de entrada y salida con la unidad una sola vez |
| `ModalityList` | `components/ModelBits.tsx` | Modalidades además de texto, o "Solo texto" |
| `QualityMeter` | `components/ModelBits.tsx` | Barra relativa y "#rank de total" |
| `ModelCard` | `components/ModelCard.tsx` | Tarjeta del directorio, clicable en toda su superficie |
| `ModelDrawer` | `components/ModelDrawer.tsx` | Detalle con progressive disclosure |
| `FilterPanel` | `components/FilterPanel.tsx` | Panel avanzado, compartido entre la barra lateral y el bottom sheet |
| `CompareTray` | `components/CompareTray.tsx` | Selección persistente del comparador |
| `CatalogTable` | `components/CatalogTable.tsx` | Vista tabla: columna fija, `aria-sort` y orden controlable |

Lógica de soporte:

- `hooks/useModelFilters.ts`: los filtros viven en la URL.
- `utils/status.ts`: calcula si un modelo es Nuevo, Actual o Por retirarse.
- `utils/strengths.ts`: fortalezas derivadas, con su "por qué".
- `utils/sort.ts` y `utils/capabilities.ts`: orden y etiquetas.
- `theme/providers.ts`: color y enlaces oficiales por proveedor.

---

## 5. Sistema de filtros

- **Chips rápidos, siempre visibles:** ✦ Nuevos · Más baratos · Contexto ≥ 1M · Visión · Razonamiento · Top en código. Cada chip es un atajo a un filtro normal del panel, no hay filtros "especiales".
- **Panel avanzado:**
  - Proveedor
  - Categoría
  - Debe aceptar (imágenes, PDF, audio, video)
  - Debe soportar (razonamiento, tools, JSON, web, caché, computer use)
  - Contexto mínimo
  - Precio de entrada máximo
  - Estado
- **Lógica de combinación:**
  - Entre grupos, AND.
  - Dentro de Proveedor y Categoría, OR ("Anthropic **o** Google").
  - Dentro de modalidades, capacidades y fortalezas, AND ("imágenes **y** PDF"), porque son requisitos.
- **Feedback:** contador de resultados en vivo (`aria-live`), filtros activos como chips removibles, y "Limpiar todo".
- **Estado vacío:** ofrece "Quitar el último filtro" y "Limpiar filtros".
- **Persistencia:** todo vive en la URL (`q`, `proveedor`, `categoria`, `entrada`, `capacidad`, `fuerte`, `contextoMin`, `maxEntrada`, `estado`, `orden`, `dir`, `vista`, `modelo`), así que un filtro se puede compartir y sobrevive a recargar la página.

---

## 6. Jerarquía visual y responsive

### Tipografía

- Display: `text-3xl`/`4xl` (hero)
- H1: `text-2xl`/`3xl`
- H2: `text-lg`
- Cuerpo: `text-sm`
- Caption: `text-xs`/`[11px]`

Todas las cifras llevan `tabular-nums` y las columnas numéricas van alineadas a la derecha.

### Color

- **Semánticos, de uso exclusivo:** emerald para ahorro o mejor opción, amber para aviso o por retirarse, rose para más caro. "Nuevo" usa tinta sólida para no competir con la semántica.
- **Proveedores:** son variables CSS (`--provider-*`) validadas con el script de paleta, para contraste y separación bajo daltonismo, en claro y en oscuro. Ninguno es verde ni rojo. El color nunca va solo: siempre lo acompaña el nombre del proveedor.
- **Texto:** siempre en tinta neutra, nunca en el color del proveedor.

### Breakpoints

- **<640px:**
  - Tarjetas en una columna.
  - Barra de navegación inferior y bandeja de comparación encima de ella.
  - Filtros en bottom sheet y detalle del modelo como sheet desde abajo.
  - "Últimos modelos" como carrusel con snap.
  - La vista tabla se muestra como tarjetas.
- **640–1024px:** 2 columnas, filtros en bottom sheet y tabla disponible.
- **≥1024px:** barra lateral de filtros (240px) y 2 a 3 columnas; la tabla tiene la columna de nombre fija.

### Accesibilidad

- Foco visible global.
- Diálogos con `aria-modal`, cierre con Esc y foco inicial en "Cerrar".
- `aria-sort` en la tabla y `aria-pressed` en los chips.
- Iconos SVG con `aria-hidden` y etiquetas de texto.

---

## 7. Roadmap

| Fase | Alcance | Estado |
|---|---|---|
| **1. Fundamentos, exploración y descubrimiento** | Datos enriquecidos (6 proveedores, modalidades, capacidades, retiro, caché, contexto largo, `firstSeenAt`), paleta y componentes base, navegación nueva con barra móvil, Home, directorio `/modelos` con filtros en la URL, detalle del modelo y bandeja de comparación | ✅ Implementada |
| **2. Comparador** | Agrupado por secciones, "Solo diferencias", mejor valor por fila, `?m=` en la URL, sugerencias de competidor directo, columnas con snap en móvil. Migrar Recomendador y Mercado a filtros locales en vez del filtro global de proveedor | Pendiente |
| **3. Precios** | Página `/precios` con calculadora y presets. El costo incluye caché y contexto largo, y muestra un ranking por escenario. Absorbe los insights de Mercado | Pendiente |
| **4. Casos de uso, Novedades y Proveedores** | Guías por necesidad con el "por qué" automático, historial de lanzamientos y cambios de precio a partir de `firstSeenAt` y `changes`, y páginas por proveedor y familia | Pendiente |

### Vacíos de datos conocidos

- **Meta (Llama):** el dataset de LiteLLM no trae entradas `meta_llama` directas, así que se omitió. Se agregará cuando haya una fuente automática estable.
- **Velocidad y latencia:** no hay una fuente automática confiable, por lo que la interfaz no las muestra en lugar de inventarlas.
- **"Nuevo":** el seguimiento empezó el 30 de septiembre de 2026 (`trackingSince`). Los modelos existentes tienen `firstSeenAt: null`, así que el badge "Nuevo" solo aparecerá con lanzamientos detectados a partir de esa fecha. Mientras tanto, "Últimos modelos" muestra la versión más reciente de cada proveedor.
- **Categoría de proveedores sin anclas de nombre** (xAI, Mistral, DeepSeek): se asigna por percentil de precio dentro del proveedor, lo que produce casos contraintuitivos. Por ejemplo, Mistral Large 3 queda como "Balanceado" porque es más barato que Mistral Medium. Conviene revisarlo en la Fase 2.
- **Capacidades:** provienen de los flags de LiteLLM y pueden estar incompletas. El detalle del modelo lo advierte y enlaza la documentación oficial.
