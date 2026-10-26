# Plan de implementación: Migración a i18n + Server Components

> **Estado actual**: SPA monolingüe, textos hardcodeados en componentes (mezcla es/en), sin next-intl, sin rutas `/[locale]/`, sin sitemap ni robots.txt.
> **Objetivo**: HTML estático bilingüe (es/en), Server Components por defecto, `"use client"` solo en islas interactivas, SEO canónico completo.

---

## Resumen de decisiones de arquitectura

| Aspecto | Decisión |
|---|---|
| i18n runtime | `next-intl` solo en cliente (`NextIntlClientProvider` + `useTranslations`) |
| Textos en Server Components | Props tipadas desde `getDictionary(locale)` (import estático del JSON) |
| `next-intl/server` | **Prohibido** — regla anti-regresión del repo |
| Redirect `/` → `/es` | Regla CDN edge (Cloudflare `_redirects`); sin `meta http-equiv` |
| Provider único | Un solo `NextIntlClientProvider` por namespace de islas cliente |
| `"use client"` | Solo 5-6 componentes con interactividad real (ver tabla Fase 3) |

---

## Fase 0 — Preparación del entorno

### 0.1 Instalar next-intl

```bash
pnpm add next-intl
```

Versión mínima requerida: **3.x** (APIs de cliente estables). Verificar que no arrastra `next-intl/server` como side-effect — el tree-shaking lo elimina si no se importa explícitamente.

### 0.2 Ajustar package.json

```jsonc
// package.json
{
  "name": "ewala-landing-page",   // ← sin espacios ni mayúsculas
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint"
    // "start" eliminado — no existe runtime en producción
  }
}
```

### 0.3 Verificar next.config.mjs (sin cambios)

```js
// next.config.mjs — no modificar, ya es correcto
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
```

No añadir `createNextIntlPlugin` — es el wrapper del server pipeline (prohibido).

---

## Fase 1 — Fuente única de verdad i18n

### 1.1 Crear `i18n/config.ts`

Este módulo es el **único lugar** donde se definen locales, rutas y helpers de URLs. Sitemap, metadata y language switcher lo importan; nadie construye URLs a mano.

```typescript
// i18n/config.ts
export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

/** Rutas publicadas. Añadir aquí al crear nuevas páginas. */
export const PAGES = ['/'] as const
export type Page = (typeof PAGES)[number]

/** Lee el JSON de mensajes del locale pedido. Puro import estático — cero runtime. */
export async function getDictionary(locale: Locale) {
  const messages = await import(`@/messages/${locale}.json`)
  return messages.default as Messages
}

/** Construye la URL localizada preservando la ruta. */
export function localizedPath(locale: Locale, path: Page = '/'): string {
  return `/${locale}${path === '/' ? '' : path}`
}

/** Genera los alternates hreflang para una ruta. */
export function alternatesFor(path: Page = '/') {
  return {
    canonical: localizedPath(defaultLocale, path),
    languages: Object.fromEntries([
      ...locales.map((l) => [l, localizedPath(l, path)]),
      ['x-default', localizedPath(defaultLocale, path)],
    ]) as Record<string, string>,
  }
}
```

### 1.2 Crear tipo `Messages`

El tipo se deriva del JSON fuente (es.json) para que los props de Server Components queden tipados sin duplicación.

```typescript
// i18n/types.ts
import type esMessages from '@/messages/es.json'
export type Messages = typeof esMessages
```

Importar este tipo en los componentes: `import type { Messages } from '@/i18n/types'`.

### 1.3 Crear `messages/es.json` (fuente de verdad)

Extraer **todos** los textos hardcodeados de los 14 componentes. Estructura de namespaces:

```jsonc
// messages/es.json (esqueleto — rellenar con los textos reales de cada componente)
{
  "announcement": {
    "badge": "Nuevo",
    "text": "...",
    "cta": "Saber más"
  },
  "nav": {
    "products": "Productos",
    "sectors": "Sectores",
    "about": "Nosotros",
    "contact": "Contacto",
    "cta": "Solicitar demo"
  },
  "hero": {
    "eyebrow": "...",
    "headline": "...",
    "subheadline": "...",
    "cta_primary": "Solicitar demo",
    "cta_secondary": "Ver productos"
  },
  "metrics": {
    "items": [
      { "value": "...", "label": "..." }
    ]
  },
  "products": {
    "sentryn3t": { "name": "SentryN3t", "tagline": "...", "features": [] },
    "livet": { "name": "LIVET", "tagline": "...", "features": [] }
  },
  "bento": { "headline": "...", "items": [] },
  "sectors": { "headline": "...", "items": [] },
  "innovation": { "headline": "...", "items": [] },
  "testimonials": { "headline": "...", "items": [] },
  "partners": { "headline": "...", "items": [] },
  "finalCta": { "headline": "...", "body": "...", "cta": "..." },
  "footer": {
    "tagline": "...",
    "links": { "products": [], "company": [], "legal": [] },
    "copyright": "© 2025 Ewala IT Services S.L."
  },
  "mobileCta": { "text": "...", "cta": "..." },
  "meta": {
    "title": "Ewala | Ciberseguridad industrial y monitorización remota",
    "description": "..."
  }
}
```

**Proceso de extracción**: ir componente a componente, cortar el string hardcodeado y pegarlo en la clave correspondiente del JSON. En arrays usar `t.raw('key') as TipoEspecífico[]` en las islas cliente, o acceder directamente `dict.namespace.key` en Server Components.

### 1.4 Crear `messages/en.json`

Estructura de claves **idéntica** a `es.json`, con los valores traducidos al inglés. Mantener simetría estricta de claves — el build fallará si falta alguna clave en el JSON de un locale.

---

## Fase 2 — Andamiaje de rutas

### 2.1 Modificar `app/layout.tsx` → root mínimo

```typescript
// app/layout.tsx
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return children  // <html> lo genera [locale]/layout.tsx
}
```

Eliminar: `lang="en"`, fuentes de Google (se mueven a `[locale]/layout.tsx`), metadata raíz (se mueve a `[locale]/layout.tsx`).

### 2.2 Crear `app/[locale]/layout.tsx`

Este es el layout principal. Hace cuatro cosas: genera rutas estáticas, genera metadata SEO, carga fuentes e instancia el único `NextIntlClientProvider`.

```typescript
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { Space_Mono, Noto_Sans } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { locales, defaultLocale, getDictionary, alternatesFor } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import '@/app/globals.css'

// Fuentes (se mueven aquí desde root layout)
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' })
const notoSans = Noto_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const alt = alternatesFor('/')

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale,
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params

  if (!locales.includes(locale)) notFound()

  const dict = await getDictionary(locale)

  // Solo los namespaces consumidos por islas cliente van al provider
  const clientMessages = {
    nav: dict.nav,
    announcement: dict.announcement,
    products: dict.products,
    mobileCta: dict.mobileCta,
    footer: dict.footer,
  }

  return (
    <html lang={locale} className={`${spaceMono.variable} ${notoSans.variable}`}>
      <body className="bg-slate-950 font-sans">
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Nota**: `clientMessages` contiene solo los namespaces que las islas cliente necesitan. No serializar el JSON completo en el HTML — los Server Components reciben su slice vía props en page.tsx.

### 2.3 Mover `app/page.tsx` → `app/[locale]/page.tsx`

```typescript
// app/[locale]/page.tsx  (Server Component — sin "use client")
import { getDictionary } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { AnnouncementBar } from '@/components/ewala/announcement-bar'
import { Header } from '@/components/ewala/header'
import { HeroSection } from '@/components/ewala/hero-section'
// ... resto de imports

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  return (
    <main className="bg-slate-950">
      <AnnouncementBar t={dict.announcement} />
      <Header locale={locale} />  {/* isla cliente — no recibe t, usa useTranslations */}
      <HeroSection t={dict.hero} />
      <LogoCarousel />             {/* sin texto traducible */}
      <MetricsStrip t={dict.metrics} />
      <ProductShowcase locale={locale} />  {/* isla cliente */}
      <BentoCapabilities t={dict.bento} />
      <SectorsSection t={dict.sectors} />
      <InnovationSection t={dict.innovation} />
      <TestimonialSection t={dict.testimonials} />
      <PartnersSection t={dict.partners} />
      <FinalCta t={dict.finalCta} />
      <Footer locale={locale} />   {/* isla cliente */}
      <MobileStickyCta />          {/* isla cliente */}
    </main>
  )
}
```

**Regla**: Los Server Components reciben `t={dict.namespace}`. Las islas cliente (`Header`, `Footer`, `ProductShowcase`, `AnnouncementBar`, `MobileStickyCta`) usan `useTranslations('namespace')` internamente — por eso sus namespaces están en `clientMessages` del layout.

---

## Fase 3 — Clasificación definitiva de componentes

### Tabla de decisiones

| Componente | Estado actual | Estado objetivo | Razón |
|---|---|---|---|
| `announcement-bar.tsx` | `"use client"` | **Isla cliente** | `useState` para dismiss |
| `header.tsx` | `"use client"` | **Isla cliente** (mantener) | Scroll state + menú móvil Dialog |
| `hero-section.tsx` | Server Component ✓ | **Server Component** | Solo texto e iconos |
| `logo-carousel.tsx` | Server Component ✓ | **Server Component** | Animación CSS pura |
| `metrics-strip.tsx` | Server Component ✓ | **Server Component** | Datos estáticos |
| `product-showcase.tsx` | `"use client"` | **Isla cliente** | Radix `Tabs` |
| `bento-capabilities.tsx` | Server Component ✓ | **Server Component** | Grid estático |
| `sectors-section.tsx` | Server Component ✓ | **Server Component** | Grid estático |
| `innovation-section.tsx` | Server Component ✓ | **Server Component** | Grid estático |
| `testimonial-section.tsx` | Server Component ✓ | **Server Component** | Grid estático |
| `partners-section.tsx` | Server Component ✓ | **Server Component** | Grid estático |
| `final-cta.tsx` | Server Component ✓ | **Server Component** | Solo texto + link |
| `footer.tsx` | `"use client"` | **Isla cliente** | Accordion (Radix) |
| `mobile-sticky-cta.tsx` | `"use client"` | **Isla cliente** | Scroll detection |

**Resultado**: 9 Server Components + 5 islas cliente. El JS del bundle se reduce a lo estrictamente interactivo.

### 3.1 Patrón para Server Components

Cada uno de los 9 Server Components sigue este patrón:

```typescript
// Ejemplo: components/ewala/hero-section.tsx
// SIN "use client"
import type { Messages } from '@/i18n/types'

interface HeroSectionProps {
  t: Messages['hero']
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section>
      <p>{t.eyebrow}</p>
      <h1>{t.headline}</h1>
      {/* ... */}
    </section>
  )
}
```

Checklist por componente:
- [ ] Eliminar `"use client"` si existía
- [ ] Añadir prop `t: Messages['namespace']`
- [ ] Sustituir cada string hardcodeado por `t.clave`
- [ ] Para arrays: `(t.items as ItemType[]).map(...)` con tipo inline
- [ ] Eliminar imports de hooks (`useState`, `useEffect`) si los hubiera

### 3.2 Patrón para islas cliente

Las islas cliente usan `useTranslations` y **no** reciben el slice completo como prop:

```typescript
// Ejemplo: components/ewala/announcement-bar.tsx
"use client"
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function AnnouncementBar() {
  const t = useTranslations('announcement')
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div>
      <span>{t('badge')}</span>
      <p>{t('text')}</p>
      <button onClick={() => setDismissed(true)}>✕</button>
    </div>
  )
}
```

### 3.3 Header: decisión de arquitectura

El header actual mezcla estructura estática (logo, links de desktop) con interactividad (scroll, menú móvil). Opciones:

**Opción A (recomendada — mínima fricción)**: Mantener `header.tsx` como isla cliente completa. La superficie JS es pequeña y el header es above-the-fold de todos modos, así que la penalización de LCP es nula.

**Opción B (más pura)**: Dividir en:
- `components/ewala/header-static.tsx` — Server Component con logo + nav links desktop
- `components/ewala/header-client.tsx` — Isla cliente con scroll state + menú móvil
- `components/ewala/header.tsx` — Composición: `<HeaderStatic>` + `<HeaderClient>`

Implementar opción B solo si el bundle del header resulta >10 KB.

### 3.4 Footer: decisión de arquitectura

El footer usa `@radix-ui/react-accordion` para la versión móvil. Opciones:

**Opción A (recomendada)**: Mantener `"use client"` en footer. El footer es below-the-fold — no afecta LCP.

**Opción B**: Eliminar el Accordion y usar CSS `<details>/<summary>` nativo → footer pasa a Server Component. Implica cambio visual menor.

---

## Fase 4 — Mensajes y tipado

### 4.1 Proceso de extracción de textos (componente por componente)

Para cada componente, el proceso es:

1. Abrir el componente y localizar todos los strings de texto visible
2. Asignar una clave semántica en el namespace correspondiente de `es.json`
3. Traducir al inglés en `en.json`
4. Sustituir el string en el componente por la referencia (`t.clave` o `t('clave')`)

**Textos especiales a vigilar:**
- `hero-section.tsx`: actualmente tiene texto en inglés → normalizar a español en `es.json`
- `footer.tsx`: copyright con año → usar string estático `"© 2025 Ewala IT Services S.L."` (el año lo actualiza el equipo)
- Arrays de datos (metrics, sectors, partners): convertir a arrays en JSON con tipo definido

### 4.2 Tipos para arrays en JSON

```typescript
// i18n/types.ts — ampliar con tipos de arrays
export interface MetricItem { value: string; label: string }
export interface SectorItem { icon: string; name: string; description: string }
export interface ProductFeature { title: string; description: string }
// etc.
```

En Server Components: `(t.metrics.items as MetricItem[]).map(item => ...)`
En islas cliente: `t.raw('metrics.items') as MetricItem[]`

### 4.3 Imágenes e iconos

Los iconos de Lucide React **no** van en el JSON — se hardcodean en el componente y se mapean por clave. Ejemplo:

```typescript
// En el componente — el icon no es un string del JSON
import { Factory, Zap, Leaf } from 'lucide-react'

const SECTOR_ICONS = { factory: Factory, energy: Zap, environment: Leaf } as const

// El JSON solo lleva la clave del icono, no el componente
// es.json: { "sectors": { "items": [{ "icon": "factory", "name": "..." }] } }
```

---

## Fase 5 — Raíz `/`, SEO y navegación

### 5.1 Redirect `/` → `/es` en CDN edge

**Sin `<meta http-equiv="refresh">`. Sin middleware. Sin Server Action.**

#### Cloudflare Pages

```
# public/_redirects
/   /es   302
```

#### Netlify

```
# public/_redirects
/   /es   302   !
```

El `!` fuerza la regla incluso si existe `out/index.html`.

#### Vercel (si aplica)

```json
// vercel.json (crear en raíz si se despliega en Vercel)
{
  "redirects": [
    { "source": "/", "destination": "/es", "permanent": false }
  ]
}
```

### 5.2 Fallback: landing real en `/`

Si el CDN no admite reglas (ej. hosting estático puro), crear `app/page.tsx` con contenido real en español y canonical apuntando a `/es`:

```typescript
// app/page.tsx — solo si el CDN no soporta redirects
import { redirect } from 'next/navigation'
export default function RootPage() {
  redirect('/es')  // next/navigation redirect — se resuelve en build-time en output:export
}
```

**Nota**: `redirect()` de `next/navigation` en un Server Component con `output: 'export'` genera una página HTML con redirect nativo — **no** requiere runtime Node.js.

### 5.3 Crear `app/sitemap.ts`

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { locales, PAGES, localizedPath } from '@/i18n/config'

const BASE_URL = 'https://www.ewala.es'  // ← ajustar al dominio real

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: `${BASE_URL}${localizedPath(locale, page)}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}${localizedPath(l, page)}`])
        ),
      },
    }))
  )
}
```

### 5.4 Crear `app/robots.ts`

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.ewala.es'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
```

---

## Fase 6 — Coherencia y verificación

### 6.1 Actualizar `CLAUDE.md`

La sección "Arquitectura" y "Componentes de sección" del CLAUDE.md actual está desactualizada tras esta migración. Actualizar:

**Sección Arquitectura → componentes:**

Sustituir:
> "Componentes de sección: todos usan `"use client"` + `useTranslations('namespace')`"

Por:
> "Server Components por defecto. `"use client"` solo en islas interactivas (header, announcement-bar, product-showcase, footer, mobile-sticky-cta). Los Server Components reciben su slice de mensajes como prop `t: Messages['namespace']` desde `[locale]/page.tsx`."

**Sección "Capas de mensajes":**

Sustituir el sistema de providers críticos/diferidos por:
> "Un único `NextIntlClientProvider` en `[locale]/layout.tsx`, alimentado solo con los namespaces que las islas cliente consumen. Los Server Components no pasan por next-intl — leen del JSON directamente vía `getDictionary(locale)`."

**Añadir sección "Fuente única i18n":**
> "`i18n/config.ts` es la única fuente de verdad para locales, rutas y helpers de URL. Todo lo que construye una URL localizada (sitemap, metadata, language switcher) importa de ahí."

### 6.2 Verificación del build

```bash
pnpm build
```

Verificar:
- [ ] `out/es/index.html` existe y contiene texto en español
- [ ] `out/en/index.html` existe y contiene texto en inglés
- [ ] `out/sitemap.xml` existe con las 4 entradas (2 locales × 1 página)
- [ ] `out/robots.txt` existe y apunta al sitemap
- [ ] Las secciones Server Component no tienen `<script>` de i18n en el HTML resultante
- [ ] `next build` no lanza warnings de `useSearchParams` sin `<Suspense>`

### 6.3 Grep anti-regresión

```bash
# Ninguno de estos debe aparecer
grep -r "next-intl/server" app components
grep -r "getTranslations\|getMessages\|getRequestConfig" app components
grep -r "use server" app components
grep -r "app/api" app
grep -r "middleware" app
grep -r "createNextIntlPlugin" next.config.mjs
```

### 6.4 Lint

```bash
pnpm lint
```

### 6.5 Inspección de bundles (opcional pero recomendado)

```bash
pnpm add -D @next/bundle-analyzer
# Activar en next.config.mjs con ANALYZE=true
ANALYZE=true pnpm build
```

Verificar que los Server Components no aparecen en el bundle cliente.

---

## Orden de ejecución recomendado

El plan se puede ejecutar en tres bloques independientes:

```
Bloque 1 (infraestructura — no cambia UI):
  Fase 0 → Fase 1 → Fase 2 → pnpm build (debe pasar)

Bloque 2 (migración de componentes — cambia textos):
  Fase 3 → Fase 4 → pnpm build (debe pasar con textos correctos)

Bloque 3 (SEO + limpieza):
  Fase 5 → Fase 6 → pnpm build final + grep anti-regresión
```

Si el bloque 1 pasa el build, el bloque 2 se puede hacer componente a componente sin romper nada — cada componente convertido es independiente de los demás.

---

## Archivos nuevos/modificados — resumen

| Acción | Archivo |
|---|---|
| Crear | `i18n/config.ts` |
| Crear | `i18n/types.ts` |
| Crear | `messages/es.json` |
| Crear | `messages/en.json` |
| Crear | `app/[locale]/layout.tsx` |
| Crear | `app/[locale]/page.tsx` |
| Crear | `app/sitemap.ts` |
| Crear | `app/robots.ts` |
| Crear | `public/_redirects` |
| Modificar | `app/layout.tsx` (→ root mínimo) |
| Modificar | `app/page.tsx` (→ redirect fallback o eliminar) |
| Modificar | `package.json` (name, eliminar start) |
| Modificar | Cada uno de los 14 componentes en `components/ewala/` |
| Modificar | `CLAUDE.md` (actualizar guía de arquitectura) |
| No tocar | `next.config.mjs`, `app/globals.css`, `components/ui/`, `lib/utils.ts` |
