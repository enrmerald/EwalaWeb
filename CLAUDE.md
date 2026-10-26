# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

Gestor de paquetes: **pnpm** (`pnpm-lock.yaml` + `pnpm-workspace.yaml`).

```bash
pnpm install              # instalar dependencias
pnpm dev                  # servidor de desarrollo (Next.js, http://localhost:3000)
pnpm build                # build de producción estática → genera carpeta out/
pnpm lint                 # ESLint 9 (flat config: eslint.config.mjs)
pnpm exec tsc --noEmit    # tipos (el build NO los comprueba: ignoreBuildErrors)
```

`pnpm start` **no se usa**: el proyecto exporta HTML estático (`output: 'export'`) y se despliega en
un CDN sin servidor Node.js. No hay framework de tests configurado.

**Cómo comprobar un cambio** (no hay tests): `pnpm lint` (sin errores), `pnpm build` (genera `out/`),
`pnpm exec tsc --noEmit` **después** del build, y revisar el HTML generado en `out/`. Hay 4 errores de
tipos previos en `.next/**/validator.ts` (Next valida `params.locale` como `string` y el código lo
tipa como `'es' | 'en'`); no son de ninguna página — cualquier error nuevo sí es del cambio. Los
avisos de lint previos (unos 9: React Compiler, variables sin usar) son conocidos.

## Qué es esto

Landing de marketing en **Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui ("new-york")**,
exportada a **HTML estático puro** (`output: 'export'` → `out/`). Producto en la home:
**SentryN3t Protection** (NDR de ciberseguridad industrial OT/IoT, con machine learning y asistente de
IA). Posicionamiento de la empresa: **startup europea de ciberseguridad industrial**.
**LIVET** (monitorización no invasiva para ganadería extensiva) **no está en la web**: su contenido
está archivado en `_livet-spa/` (SPA independiente en construcción) y fuera del navbar, del footer y
de los textos SEO. Páginas: home (con carrusel de partners y sección de sellos y reconocimientos),
`/compania`, `/blog` (+ artículos), `/contacto`, las **páginas legales** (`/aviso-legal`, `/privacidad`,
`/cookies`) y una página oculta (ver «Página oculta»).

> **Lectura obligatoria antes de tocar código:** [`docs/arquitectura.md`](docs/arquitectura.md)
> cubre el modelo de ejecución (build vs runtime), las reglas de seguridad y las prohibiciones
> anti-regresión en detalle. Lo esencial está abajo.

## Regla nº1: cero servidor en producción

El CDN sirve `out/` tal cual. **No hay runtime Node.js.** Por tanto, en este repo está **prohibido**:

- API Routes (`app/api/`), `'use server'` / Server Actions, `headers()`, `cookies()`, `middleware.ts`.
- Cualquier import de `next-intl/server` o sus APIs (`getRequestConfig`, `getTranslations`…).
- Secretos en el código. Solo se permiten variables públicas `NEXT_PUBLIC_*` para URLs/IDs no sensibles
  (hoy: `NEXT_PUBLIC_FORMSPREE_FORM_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SHOW_DEMO_CTA`,
  `NEXT_PUBLIC_SITE_URL`; todas se incrustan **en build**: cambiarlas exige reconstruir y desplegar).
- Dependencias de servidor (drivers BD, ORMs) — rompen el build con `output: 'export'`.
- `useSearchParams()` sin envolver en `<Suspense>` (Next lo exige en modo estático).
- Redirecciones en `next.config` (no existen con `output: 'export'`): se hacen en el hosting.

La tabla completa de prohibiciones y su motivo está en `docs/arquitectura.md`.

## Arquitectura

```
app/
  layout.tsx              ← root mínimo (devuelve children; sin <html>)
  page.tsx                ← redirect('/') → '/es'
  sitemap.ts, robots.ts   ← estáticos (`dynamic = 'force-static'`); sitemap = PAGES × locales + blog
  [locale]/
    layout.tsx            ← build-time: <html lang>, fuentes, generateStaticParams,
                            generateMetadata (canonical/hreflang/OG/favicons), JSON-LD Organization,
                            I18nProvider
    page.tsx              ← home: getDictionary + Header + ProductExperience + LogoCarousel + Footer
    compania/ blog/ blog/[slug]/ contacto/   ← páginas interiores (HeroInterior + secciones)
    aviso-legal/ privacidad/ cookies/        ← páginas legales (LegalDocument; ver «Páginas legales»)
    sellos-y-reconocimientos/                ← página OCULTA: carteles y banner Kit (ver más abajo)
    opengraph-image.tsx   ← imagen social (texto fijo en español; pendiente de diseño de marketing)
  globals.css             ← Tailwind v4 + tema (ver "Estilos")

i18n/                     ← módulo i18n PROPIO (no next-intl)
  config.ts               ← locales, PAGES, getDictionary, localizedPath, alternatesFor(path, locale)
  client.tsx              ← "use client": I18nProvider (Context) + useTranslations → t() / t.raw()
  types.ts                ← Messages = typeof es.json; ProductId; ProductLanding; LegalDoc/LegalBlock/LegalCommon

lib/
  products.ts             ← ProductConfig[], PRODUCTS (solo SentryN3t), DEFAULT_PRODUCT, getProduct()
  blog.ts                 ← lectura de src/generated/blog.json (posts, categorías, relacionados)
  jsonld.ts               ← Organization, BreadcrumbList, BlogPosting
  metadata.ts             ← pageOpenGraph(): hereda el openGraph del layout (ver «SEO»)
  site.ts                 ← SITE_URL (NEXT_PUBLIC_SITE_URL, por defecto https://ewala.es)
  consent.ts              ← consentimiento de cookies (localStorage, 12 meses), GA_MEASUREMENT_ID validado,
                            borrado de cookies _ga*; lo usan CookieConsent y Footer
  features.ts             ← interruptores por env: SHOW_DEMO_CTA (demo/PoC; por defecto oculto)
  utils.ts                ← cn() (clsx + tailwind-merge)

messages/
  es.json                 ← fuente de verdad (todos los namespaces; incl. `legal.*` y `cookieBanner`)
  en.json                 ← traducción, misma estructura de claves
  es_old.json, en_old.json ← históricos, no se usan

scripts/                  ← utilidades manuales (no son parte del build): build-blog-content.mjs (sí, vía
                            predev/prebuild), generar-capturas-carrusel.py, generar-carteles-recursos.py

content/blog/{es,en}/*.md ← artículos; scripts/build-blog-content.mjs los valida (zod) y genera
                            src/generated/blog.json (predev/prebuild, no se versiona)

components/ewala/
  product-experience.tsx  ← isla cliente (hoy solo renderiza el slot de SentryN3t)
  floating-product-tabs.tsx ← hoy devuelve null (se reactivará con un 2.º producto)
  product-landing.tsx     ← Server Component: compone las 8 secciones de un producto
  sections/               ← Server Components por producto (hero, metrics, showcase…)
  header.tsx, footer.tsx, mobile-sticky-cta.tsx   ← islas cliente
  cookie-consent.tsx      ← isla cliente: banner de cookies + carga de GA4 tras el consentimiento
  legal-document.tsx      ← Server Component: renderiza una página legal (`messages.legal.*`)
  logo-carousel.tsx       ← carrusel de partners (home y /compania)
  hero-interior.tsx       ← hero de páginas interiores (breadcrumb + único <h1>)
  seals-grid.tsx          ← sellos y reconocimientos (se muestra en la home, antes del footer)
  posters-grid.tsx, funding-banner.tsx   ← carteles y banner Kit (página oculta)
  blog-*.tsx, contact-*.tsx, json-ld.tsx

components/ui/            ← shadcn/ui (~57 primitivos). No editar manualmente (excluido del lint).
hooks/                    ← use-mobile, use-toast
_livet-spa/               ← contenido archivado de LIVET (no forma parte del build)
```

### Landing de producto (SentryN3t)

La home es **una sola ruta** (`/es`, `/en`). El diseño original era «2 landings en 1» con tabs y hash
routing (`#sentryn3t`, `#livet`); al retirar LIVET quedó **un solo producto** y los tabs están
dormidos, pero la estructura se conserva para reactivarla:

1. **`page.tsx`** construye el slot del producto como JSX estático
   (`<ProductLanding id="sentryn3t" content={dict.products.sentryn3t} />`) y se lo pasa a
   `<ProductExperience slots={slots} ui={dict.products.ui} />`.
2. **`ProductExperience`** renderiza hoy `slots[PRODUCTS[0].id]`. `FloatingProductTabs` devuelve `null`.
   Si se añade un segundo producto: añadir su entrada a `PRODUCTS`, su namespace en `messages/*.json`
   y su slot en `page.tsx`, y restaurar tabs con `forceMount` + `hidden` + `inert` (así el HTML de
   ambos productos sigue en el DOM y el SEO se mantiene). El diseño de referencia está en
   `docs/guia-home-tabs-producto.md` (histórico).
3. **`ProductLanding`** inyecta `--brand` / `--brand-foreground` desde `lib/products.ts` y compone las
   8 sub-secciones: `ProductHero`, `ProductMetrics`, `ProductShowcase`, `ProductCapabilities`,
   `ProductSectors`, `ProductInnovation`, `ProductTestimonial`, `ProductFinalCta`.
4. **Las sub-secciones** de `components/ewala/sections/` son **Server Components puros**: reciben su
   slice de mensajes tipado por props. No llevan `"use client"`.

Color de acento: **SentryN3t** `#00e58d` / `#020617`.

### Islas cliente

| Componente | Motivo |
|---|---|
| `ProductExperience`, `FloatingProductTabs` | Hoy triviales (un producto); reservadas para los tabs |
| `Header` | Scroll detection, menú móvil con estado, dropdowns |
| `Footer` | Accordion móvil, estado; botón «Preferencias de cookies» (evento al banner) |
| `CookieConsent` (`cookie-consent.tsx`) | Banner/panel de consentimiento (`useSyncExternalStore` sobre `localStorage`) y carga condicionada de `gtag.js`. Solo se monta si hay ID de GA4 |
| `MobileStickyCta` | Scroll listener (aparece tras 400 px) |
| `HeroScreenshotCarousel` (`hero-screenshot-carousel.tsx`) | Carrusel embla de capturas del hero con autoplay; las 4 slides van en el HTML estático (SEO intacto) |
| `BlogFiltro` (`blog-filtro.tsx`) | Filtro de categoría del blog vía atributo de datos + CSS; no desmonta tarjetas (SEO intacto) |
| `ContactForm` (`contact-form.tsx`) | Estado de formulario, validación `react-hook-form` + `zod`, envío a Formspree |

El `layout.tsx` pasa a `I18nProvider` **solo** los namespaces que consumen las islas con contexto:
`nav`, `footer`, `mobileCta`, `cookieBanner` — eso es lo único que viaja al cliente como JSON.

### Navegación (navbar y footer)

El **footer repite los enlaces del navbar** (Soluciones: SentryN3t `/#showcase` y MSSP, externo a
`secnorthlabs.eu`; Sectores: 3 sectores `/#sectors`; Ewala: Compañía, Blog, Contacto) más la columna
**Legal**: Aviso legal (`/aviso-legal`), Política de privacidad (`/privacidad`), Política de cookies
(`/cookies`) y «Preferencias de cookies» (entrada con `"action": "cookie-settings"`, que se pinta como
`<button>` y **solo aparece si hay ID de GA4**). Si cambia el navbar (`header.tsx` + `nav.*` en
messages), actualizar `footer.sections` también. En `footer.sections` las anclas de la home se escriben
`/#showcase` y `Footer.resolveHref` las convierte en `/{locale}#showcase`; los enlaces `https://…` se
abren en pestaña nueva. Los botones «Solicitar demo» del navbar dependen de `SHOW_DEMO_CTA` (ver abajo).

### Carrusel de partners

`LogoCarousel` muestra **solo partners** (INCIBE, CCI, Industria 4.0, Femetal, Clúster TIC, AsturCON
Tech). Para añadir uno: logo en `public/team/`, entrada `{ name, href, alt }` en `logoCarousel.seals`
(ES y EN) y su `name` → ruta en `SEAL_SRC` de `logo-carousel.tsx`. Los **sellos y reconocimientos
propios** (Pyme innovadora, ENISA, EiBT, Spain 101, igualdad, premios) **no** van aquí sino en
`SealsGrid`. Se respeta `prefers-reduced-motion` (carrusel parado, copia duplicada oculta).

### Sellos y reconocimientos (home)

`SealsGrid` se renderiza en `app/[locale]/page.tsx` **entre el carrusel de partners y el footer**, con el
namespace `sellos` de messages (`sealsHeading`, `seals`). Es contenido **público e indexable**. Para añadir
un sello: asset en `public/sellos/` (o `public/team/`), entrada en `sellos.seals` (ES y EN, con `id`) y su
imagen en `SEAL_IMAGE` de `seals-grid.tsx`. Los logos van en **placa blanca** (están diseñados para
fondo claro). El sello «Pyme innovadora» tiene vigencia (04/03/2026 – 03/03/2029): renovarlo antes de
que venza (imagen oficial en `https://aplicaciones.ciencia.gob.es/pyi/imagenes/sello.jpg`).

### Páginas legales: `/aviso-legal`, `/privacidad`, `/cookies`

Son **públicas e indexables** (están en `PAGES` → sitemap y hreflang) y el slug es el mismo en `/es` y
`/en`. Estructura y contenido = los de ISN Labs (`secnorthlabs.eu`) con los datos legales de Ewala
(razón social, CIF, domicilio, `rgpd@ewala.es`, datos registrales, tribunales de Gijón); la versión
inglesa es traducción de cortesía y declara que prevalece la española.

- **El texto vive en `messages/{es,en}.json` → `legal.{common,notice,privacy,cookies}`**, no en los
  componentes. Cada documento: `meta`, `breadcrumb`, `title`, `subtitle`, `updated`, `sections[]`; cada
  sección: `title` + `blocks[]` de tipo `p`, `ul`, `dl` (fichas término/definición) o `table` (tipos en
  `i18n/types.ts`: `LegalDoc`). Dentro de los textos se admite solo `**negrita**` y `[etiqueta](href)`.
- `components/ewala/legal-document.tsx` los renderiza (índice de apartados + secciones numeradas
  `#apartado-N`). `renderInline` convierte el marcado en nodos React (**sin `dangerouslySetInnerHTML`**) y solo
  admite enlaces `/ruta` (se antepone el idioma), `mailto:`, `tel:` y `https://`; cualquier otro esquema
  se descarta. Las 3 `page.tsx` son idénticas salvo el namespace y la ruta de `alternatesFor`.
- **Fecha «Última actualización»** (`legal.*.updated`): actualizarla (ES y EN) cada vez que cambie el texto.
- **Mantener sincronizado**: si cambia un tratamiento de datos (proveedores, plazos, cookies) hay que
  revisar `privacy`/`cookies` y el bloque `contact.rail.dataProtection`. Esto es redacción adaptada, no
  asesoramiento jurídico: pasar por asesoría antes de publicar cambios sustanciales.
- Pendiente de confirmar con Ewala: ID real de GA4 (la tabla de cookies muestra `_ga_<ID de medición>`),
  plazo de conservación de CV (24 meses, el de la web antigua; ISN usa 1 año) y garantías con Formspree
  (EE. UU.; la política no afirma certificación DPF sin verificarla).

### Cookies y analítica (GA4)

- GA4 **solo se carga tras el consentimiento**. `app/[locale]/layout.tsx` monta `CookieConsent` únicamente
  si `NEXT_PUBLIC_GA_MEASUREMENT_ID` existe **y** tiene el formato `G-XXXXXXXX` (`lib/consent.ts`
  descarta cualquier otro valor: acaba en una URL y en un script inline). **Sin ID no hay banner, ni
  script, ni cookies.** Si se despliega sin ID, la Política de Cookies sigue describiendo GA4: ajustar el
  texto o fijar la variable en el pipeline.
- Banner: «Aceptar todas» y «Rechazar todas» con el mismo estilo, «Configurar» abre el panel con la
  analítica **sin premarcar**. Seguir navegando, desplazarse o cerrar con Esc **no** es consentimiento (no
  se guarda nada). Se reabre desde el footer («Preferencias de cookies») con el evento `OPEN_EVENT`.
- La elección `{v, analytics, ts}` se guarda **solo en `localStorage`** (clave `ewala-cookie-consent`, caduca a
  los 12 meses; corrupta, caducada o de otra versión = sin consentimiento). No hay registro en servidor.
  Al retirar el consentimiento se activa `ga-disable-<ID>` y se borran `_ga`, `_ga_*` y `_gid`.
- Los textos del banner (`cookieBanner`) y las etiquetas de la Política de Cookies y del footer
  («Aceptar todas», «Rechazar todas», «Configurar», «Preferencias de cookies») deben coincidir literalmente.
- Para probar en local: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST12345 pnpm dev` (no commitear ese valor).

### Interruptor de la demo: `NEXT_PUBLIC_SHOW_DEMO_CTA`

La demo aún no está activa. `lib/features.ts` exporta `SHOW_DEMO_CTA` (`=== 'true'`; **por defecto
oculto**). Con la variable ausente se ocultan: «Solicitar demo» del navbar (escritorio y menú móvil),
«Solicita una demo» del hero, los botones «Descargar cómo funciona una PoC» (showcase y CTA final; apuntan
a `#`) y la opción «Demo SentryN3t» del selector del formulario (`?need=demo` se ignora); el botón principal
del CTA final pasa a «Contáctanos» (`finalCta.ctaContact`). Las claves de texto se conservan en los
JSON. Los componentes importan `SHOW_DEMO_CTA`, nunca leen `process.env` por su cuenta. Se incrusta en build:
activar la demo = definir la variable a `true` **y reconstruir**. «Solicita una PoC» (enlaza a `/contacto`)
no está incluido.

### Página oculta: `/{locale}/sellos-y-reconocimientos`

Hoy contiene los **carteles de proyectos europeos y el banner Kit Digital/Consulting** (los sellos se
movieron a la home). Conserva la URL y el nombre de la ruta por si ya está compartida; el título visible
es «Proyectos y financiación europea». **Solo se entra escribiendo la URL.** Los 3 carteles miden
**exactamente 1080×761** (`public/recursos/*-1080x761.webp`) y `PostersGrid` los pinta en una caja
`aspect-[1080/761]` (1 columna bajo `lg`, 3 iguales desde `lg`): misma altura y anchura, sin huecos.
Los originales están en `docs/assets-origen/carteles/`; para cambiar un cartel, sustituir el original
y regenerar con `uv run --with pillow --with numpy python scripts/generar-carteles-recursos.py` (el
nombre de salida lleva el tamaño para invalidar cachés del CDN; si cambia el tamaño objetivo, actualizar
`width/height` en `sellos.posters` y la clase `aspect-[…]`). Reglas para no romperlo:

- **No** añadirla a `PAGES` (`i18n/config.ts`) ni a `sitemap.ts`; **no** enlazarla desde header,
  footer, home ni ningún componente; **no** ponerla en `robots.txt` (un `Disallow` publicaría la URL).
- Mantiene `robots: noindex, nofollow`, sin canonical ni hreflang (`alternates: {}` explícito: si no,
  heredaría los de la layout) y sin JSON-LD propio.
- Es discreción, **no** control de acceso: la ruta aparece en `_ssgManifest.js` y quien tenga el
  enlace entra. Para acceso restringido real haría falta Cloudflare Access / auth del hosting.

### i18n (resumen)

- Implementación propia en `i18n/`, **sin `next-intl`** (el `next-intl.config.ts` de la raíz es
  remanente sin uso). Rutas `app/[locale]/` + `generateStaticParams(['es','en'])` →
  `out/es.html`, `out/en.html`, `out/es/compania.html`…
- Server Components: leen su slice tipado `Messages['namespace']`. Islas cliente:
  `useTranslations('namespace')` → `t('key')`, arrays con `t.raw('key') as Tipo[]` (nunca sin tipo).
- **`t()` solo resuelve claves planas del namespace**: `t('social.linkedin')` NO funciona (devuelve la
  propia clave). Para objetos anidados usar `t.raw('social')`.
- Cambio de idioma: el `Header` usa `<Link href="/{altLocale}">` directo (no hay LanguageSwitcher).
- `app/sitemap.ts` y `app/robots.ts` existen y usan `PAGES`, `localizedPath()` y `getAllPosts()`.
- **Simetría ES/EN:** `messages/en.json` debe tener exactamente las mismas claves que `es.json`
  (el tipo sale de `es.json`; `en.json` se castea y TypeScript no avisa si difiere).
- Detalle del flujo de mensajes y simetría de rutas: `docs/arquitectura.md`.

### SEO

- `alternatesFor(path, locale)`: **canonical autorreferenciado por idioma** + hreflang (`es`, `en`,
  `x-default` → español). No volver a apuntar el canonical de `/en` a `/es`.
- Next **no fusiona** `openGraph` entre layout y página: si una página lo define, sustituye al del
  layout y pierde `siteName`, `type` e imagen. Las páginas interiores usan `pageOpenGraph(parent, …)`
  de `lib/metadata.ts`. **No** definir `twitter` en el layout (lo heredarían todas las páginas con el
  título de la home); Next lo deriva de `openGraph`.
- Posicionamiento (footer, `meta.description`, JSON-LD, `/compania`): *startup europea de ciberseguridad
  industrial, redes OT/IoT, machine learning, asistente de IA*; sin LIVET.
- Pendientes conocidos: enlaces `#` (redes sociales del footer, y los dos botones de `MobileStickyCta`;
  los de PoC quedan ocultos por `SHOW_DEMO_CTA`), `aria-label` de las redes del footer sin traducir (por el
  punto de `t()`), formulario de newsletter del footer sin función (si se activa, hay que cubrirlo en la
  política de privacidad), JSON-LD solo en español.

### Estilos, tema y fuentes

- **Tailwind v4 se configura vía CSS**, no con `tailwind.config.js`. Todo el tema vive en
  **`app/globals.css`**: `@import 'tailwindcss'` + `tw-animate-css`, tokens en `oklch` (`:root` y
  `.dark`, paleta shadcn por defecto) y el bloque `@theme inline` que los mapea a utilidades.
- **Paleta corporativa** (tokens de `globals.css`): verde `#00e58d` (`--primary`), gris oscuro
  `#2f2f2f`, negro, blanco y gris 20. Utilidades de fondo: `bg-section-dark` (#2f2f2f),
  `bg-section-black`, `bg-section-light`, `bg-section-mid`, `bg-section-brand`. Texto sobre fondos
  claros: `text-on-light`, `text-on-light-muted`, `text-on-light-subtle`. Documentos de color en
  `docs/colores-coorporativos.md`.
- **Fuentes** (`app/[locale]/layout.tsx`, vía `next/font/google`):
  - `font-sans` → **Noto Sans** (`--font-noto-sans`) — texto por defecto del body.
  - `font-mono` → **Space Mono** (`--font-space-mono`) — títulos, nav, labels y CTAs.
- **El diseño es oscuro forzado a mano**, no por el sistema de tokens shadcn: `<html>`/`<body>` y
  `<main>` fijan el gris corporativo con `bg-section-dark` (layout y páginas; usar siempre el token,
  no el hex). Las secciones alternan `bg-section-dark` / `bg-section-light`, con acento verde y, en la landing,
  `--brand`. La clase `.dark` no se togglea (el sistema light/dark de shadcn es boilerplate heredado).
- Patrón para **logos y sellos oficiales**: placa blanca (`bg-white rounded-2xl border-black/10`), porque
  están diseñados para fondo claro.
- Páginas interiores: `Header` + `HeroInterior` (un único `<h1>`) + secciones + `Footer`.
- `@keyframes scroll` y `.logo-marquee` (con su regla `prefers-reduced-motion`) en `globals.css`
  animan el carrusel de logos.
- `styles/globals.css` es un remanente **no importado**; editar siempre `app/globals.css`.

### Convenciones

- Alias `@/*` → raíz del proyecto. Importar como `@/components/...`, `@/lib/utils`, `@/i18n/...`.
- Secciones: **named exports** (`export function ProductHero()`), nunca default.
- Server Components por defecto; añadir `"use client"` solo si la sección necesita estado/efectos
  (scroll, menús, formularios). No usar `fetch` en build ni `cookies()`/`headers()`.
- Componentes de sección sin strings hardcodeados: todo texto sale de `messages/*.json`.
- Assets no traducibles (rutas de imágenes) se mapean por `id`/`name` en el componente; el texto y los
  `alt` viven en `messages/*.json` (patrón de `logo-carousel.tsx` y `seals-grid.tsx`).
- Imágenes con `next/image` y `width`/`height` **reales** del archivo (evita deformación y CLS).

## Formularios y email

El formulario de contacto **no usa API Route**. Envía desde el cliente a **Formspree**
(`NEXT_PUBLIC_FORMSPREE_FORM_ID`, ver `.env.local.example`), validando con `zod` + `react-hook-form` y
con honeypot anti-spam. Claves públicas en `NEXT_PUBLIC_*`. Detalle en `docs/arquitectura.md`.

## Notas de build

- `next.config.mjs`: `output: 'export'`, `typescript.ignoreBuildErrors: true` (por eso `tsc` se corre
  aparte), `images.unoptimized: true`.
- `predev`/`prebuild` ejecutan `pnpm content:build` (genera `src/generated/blog.json` desde
  `content/blog/`).
- `pnpm-workspace.yaml` (`allowBuilds`): habilita `@parcel/watcher` y `@swc/core`; desactiva el build de
  `sharp` y de `unrs-resolver` (pnpm 12 bloquea por defecto los scripts de dependencias nuevas).
- ESLint: `eslint.config.mjs` (flat config; `eslint-config-next`). Ignora `components/ui/**` (shadcn) y
  deja como aviso las reglas del React Compiler (el proyecto no lo usa).
- El build produce `out/`, que se despliega en el CDN tal cual. **No** hay redirects en el export: si se
  retira una página (p. ej. `/recursos`, ya eliminada) hay que redirigirla en el hosting.
- Capturas del carrusel del hero: tras cambiar un PNG en `public/capturas-sentry/`, regenerar los
  WebP con `uv run --with pillow python scripts/generar-capturas-carrusel.py [login|panel-control|…]`
  (script manual, no forma parte del build).
- Carteles de `/sellos-y-reconocimientos`: ver «Página oculta» (`scripts/generar-carteles-recursos.py`).
- `pnpm build` ha fallado alguna vez de forma transitoria con «next/font/google queries have exactly one
  entry» (Turbopack) sin cambios de código relacionados; repetirlo suele bastar. Si es reproducible, investigar.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
