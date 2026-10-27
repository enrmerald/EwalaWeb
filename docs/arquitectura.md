# Arquitectura y decisiones de diseño

Documento de referencia detallado. El `CLAUDE.md` de la raíz contiene el resumen operativo;
aquí está el "por qué" y el detalle que no hace falta tener siempre en contexto.

## Modelo de ejecución — dos fases separadas

Este proyecto tiene **dos fases de ejecución completamente separadas**:

| Fase | Cuándo ocurre | Qué corre | Output |
|---|---|---|---|
| **Pipeline de build** | `pnpm build` en Netlify/local | Node.js (una vez, desechable) | Archivos estáticos en `out/` |
| **Runtime (navegador)** | Navegador del usuario | React + JS del bundle | Interactividad, hydration |
| **Runtime (funciones)** | Petición a `/api/*` | Netlify Functions (`netlify/functions/*.mts`) | Respuesta JSON |

**Next.js no tiene ningún proceso en producción.** El CDN de Netlify sirve los archivos de `out/`
directamente. Cualquier código **de Next** que asuma un servidor activo (middleware, cookies de request,
headers HTTP, API routes, Server Actions) es incompatible con este modelo y romperá el build.

La única excepción controlada son las **Netlify Functions** de `netlify/functions/`: código de servidor
que Netlify despliega aparte (Next no las compila ni las conoce) y que se expone como `/api/*` mediante
reglas de `netlify.toml`. Hoy hay dos: `contact.mts` (formulario → Resend) y `csp-report.mts`
(sumidero de informes CSP). Ver «Formularios y envío de email».

Lo que corre **solo en el pipeline de build** (una vez, nunca en producción):

- `generateStaticParams` en `app/[locale]/layout.tsx` → genera las rutas `es` y `en`.
- `generateMetadata` en `app/[locale]/layout.tsx` → emite `<title>`, `description`, canonical,
  hreflang (`alternates.languages`), Open Graph y favicons embebidos en el HTML.
- `getDictionary(locale)` (en `i18n/config.ts`) → `import()` dinámico de `messages/{locale}.json`.
  Lo invocan los Server Components (`page.tsx`, `layout.tsx`) durante el build.

`pnpm start` **no existe**: el proyecto genera HTML estático (`output: 'export'`) que se despliega en
**Netlify** (`netlify.toml`, con `NETLIFY_NEXT_PLUGIN_SKIP=true` para que el plugin de Next no lo
convierta en SSR). Redirecciones, cabeceras y caché viven en `netlify.toml`, no en `next.config`.

## Landing de producto — hoy un solo producto, con tabs preparados

> **Estado actual:** la home muestra **solo SentryN3t**. LIVET se retiró (su contenido está en
> `_livet-spa/`, pensado para una SPA independiente) y los tabs están **dormidos**:
> `ProductExperience` renderiza `slots[PRODUCTS[0].id]` y `FloatingProductTabs` devuelve `null`.
> Lo que sigue describe el diseño completo («2 landings en 1»), que se conserva para reactivarlo si
> se añade un segundo producto. La guía de diseño original está en `guia-home-tabs-producto.md`
> (histórica).

La home es **una sola ruta estática** (`/es`, `/en`). En el diseño completo presenta **dos landings
de producto** mediante tabs flotantes; el HTML de ambas existe en el DOM desde el primer render,
garantizando SEO e indexabilidad para los dos productos.

### Flujo de renderizado

1. **`page.tsx`** (Server Component async) llama `getDictionary(locale)` en build, crea el slot
   JSX de cada producto (hoy solo uno):
   ```tsx
   const slots = {
     sentryn3t: <ProductLanding id="sentryn3t" content={dict.products.sentryn3t} active={true} locale={locale} />,
     // livet: <ProductLanding id="livet" … />   ← con un 2.º producto
   }
   ```
   y los pasa como prop a `<ProductExperience slots={slots} ui={dict.products.ui} />`.

2. **`ProductLanding`** (Server Component) recibe la config del producto de `lib/products.ts` e
   inyecta los tokens CSS de acento como inline styles:
   ```tsx
   style={{ '--brand': cfg.accent, '--brand-foreground': cfg.accentForeground }}
   ```
   Compone 6 sub-secciones: `ProductHero`, `ProductHowItWorks`, `ProductMetrics`, `ProductShowcase`,
   `ProductSectors` y `ProductFinalCta`. Todas son Server Components puros en
   `components/ewala/sections/`. `ProductCapabilities` y `ProductInnovation` están retiradas de la
   landing (se conservan para una futura página de producto). El testimonio se eliminó: no era de
   un cliente real.

3. **`ProductExperience`** (isla cliente). **Hoy** solo devuelve el slot del único producto. En el
   diseño con tabs (`@radix-ui/react-tabs`) gestionaba qué producto está activo: leía el hash
   inicial (`window.location.hash`), escuchaba `hashchange`, al cambiar de tab actualizaba
   `history.replaceState` y hacía scroll al top, y renderizaba ambos `Tabs.Content` con
   `forceMount` — el HTML de las dos landings siempre en el DOM:
   - Tab activa: visible (sin `hidden`, sin `inert`).
   - Tab inactiva: `hidden + inert` + opacidad 0 vía Tailwind.

4. **`FloatingProductTabs`** (isla cliente). **Hoy** devuelve `null`. En el diseño con tabs era la
   barra sticky (`top-16 z-40`, `backdrop-blur`) con los `Tabs.Trigger`, con las etiquetas
   traducidas vía prop `ui`.

### Por qué `forceMount` en vez de desmontar el tab inactivo (cuando haya tabs)

- Con desmontaje, el buscador solo indexa el producto activo por defecto.
- Con `forceMount + hidden + inert`, ambas landings están en el HTML estático (`out/`), los
  crawlers ven todo el contenido, y el JS de cliente simplemente muestra/oculta.
- `inert` (atributo HTML) elimina la interactividad y el foco del contenido oculto sin necesidad
  de CSS adicional.

### Configuración de productos — `lib/products.ts`

```ts
export interface ProductConfig {
  id: ProductId          // hoy solo 'sentryn3t' (i18n/types.ts)
  icon: LucideIcon       // icono para el tab trigger
  accent: string         // hex del color de acento (--brand)
  accentForeground: string // hex del texto sobre el acento (--brand-foreground)
  activeTabClass: string // clases Tailwind para el trigger activo
}
```

`PRODUCTS` contiene hoy solo **SentryN3t**: accent `#00e58d`, foreground `#020617` (negro sobre verde).
LIVET quedó fuera (referencia en `_livet-spa/product-config.ts`: accent `#14b8a6`, foreground `#ffffff`).

Para añadir un segundo producto: añadir su entrada a `PRODUCTS`, ampliar `ProductId` en
`i18n/types.ts`, su namespace en `messages/*.json` y su slot en `page.tsx`, y reactivar los tabs
(`ProductExperience` y `FloatingProductTabs`).

## Internacionalización (i18n) — implementación propia

**No se usa `next-intl`** (ni está instalado). La i18n es un módulo propio y minimalista en `i18n/`:

- **`i18n/config.ts`**: `locales = ['es','en']`, `defaultLocale = 'es'`,
  `PAGES = ['/', '/blog', '/contacto', '/compania', '/privacidad', '/aviso-legal', '/cookies']` (las
  páginas **públicas e indexables**: alimentan el sitemap; la página oculta de carteles y financiación
  no está aquí a propósito). No hay slugs por idioma: `/en/privacidad` usa el mismo slug que `/es/privacidad`.
  - `getDictionary(locale)` → `import()` dinámico del JSON de mensajes (build-time).
  - `isLocale(value)` acota un `string` de Next a `Locale` (los segmentos dinámicos llegan como `string`).
  - `localizedPath(locale, path)` y `alternatesFor(path, locale)` → construyen el **canonical
    autorreferenciado** (`/{locale}{path}/`, con barra final) y `languages` (hreflang, incluye `x-default` → español)
    para `generateMetadata`. `locale` es obligatorio: un canonical de `/en` apuntando a `/es`
    haría que Google tratara la versión inglesa como duplicado.
- **`i18n/client.tsx`** (`"use client"`): `I18nProvider` (React Context con un slice de `Messages`)
  y el hook `useTranslations(namespace)` que devuelve `t(key)` y `t.raw(key)`. Si falta la clave,
  `t()` devuelve la propia clave (fallback no-rompe). **`t()` solo busca claves planas del
  namespace**: `t('social.linkedin')` no resuelve la ruta con punto y devuelve la clave; para
  objetos anidados usar `t.raw('social')`.
- **`i18n/types.ts`**: `type Messages = typeof esMessages` — el tipo se deriva de `messages/es.json`,
  que es la **fuente de verdad**. `messages/en.json` debe mantener la misma estructura de claves
  (se castea a `Messages`, así que TypeScript **no** avisa si difiere: comprobarlo a mano).
  También exporta `ProductId = 'sentryn3t'` y `ProductLanding = Messages['products']['sentryn3t']`, y los
  tipos de las páginas legales (`LegalDoc`, `LegalBlock`, `LegalSection`, `LegalCommon`), que las páginas
  aplican con `as unknown as LegalDoc` porque el JSON infiere uniones laxas para los bloques.

### Flujo de mensajes

1. `app/[locale]/page.tsx` y `app/[locale]/layout.tsx` son **Server Components async** que llaman
   `getDictionary(locale)` en build.
2. `page.tsx` pasa los slices de producto a `ProductLanding` por props: `content={dict.products.sentryn3t}`.
   `ProductLanding` los reparte entre sus sub-secciones: `<ProductHero t={content.hero} />`, etc.
3. Los **Server Components de sección** (`components/ewala/sections/`) reciben su slice tipado
   como `Messages['products']['sentryn3t']['hero']`, etc. No usan contexto ni hooks.
4. Solo `Header`, `Footer` y `MobileStickyCta` consumen mensajes vía contexto (`useTranslations`).
   `ProductExperience` y `FloatingProductTabs` reciben `ui` por props desde `page.tsx`. Otras islas
   (`ContactForm`, `HeroScreenshotCarousel`, `BlogFiltro`) reciben sus textos por props.
5. El `layout.tsx` pasa a `I18nProvider` **solo** los namespaces de las islas que usan contexto:
   `{ nav, footer, mobileCta }` (cada uno de `dict`) → eso es lo único que
   viaja al cliente como JSON para hydration.

### Cambio de idioma

No hay `LanguageSwitcher` dedicado. El `Header` renderiza un `<Link href="/{altLocale}">` directo
(navegación explícita, sin JS extra). Cada locale es una página estática independiente
(`out/es/index.html`, `out/en/index.html`).

### Simetría de rutas

Páginas públicas actuales: home, `/blog` (+ `/blog/[slug]`), `/contacto`, `/compania` y las legales
(`/aviso-legal`, `/privacidad`, `/cookies`). Al añadir una
página pública nueva:
1. `app/[locale]/[ruta]/page.tsx`, con `generateMetadata` que use `alternatesFor('/ruta', locale)` y,
   si define `openGraph`, `pageOpenGraph(parent, …)` de `lib/metadata.ts`.
2. Añadir la ruta a `PAGES` en `i18n/config.ts` (entra sola en `app/sitemap.ts`) y su fecha en
   `PAGE_LAST_MODIFIED` de `app/sitemap.ts`.
3. Añadir las claves en **ambos** `messages/es.json` y `messages/en.json`.
4. Usar `HeroInterior` (aporta el único `<h1>`) y, si procede, `JsonLd` con `breadcrumbJsonLd`.

`app/sitemap.ts` (PAGES × locales + artículos del blog, con hreflang y `lastmod` fijo por página) y
`app/robots.ts` son estáticos (`dynamic = 'force-static'`). El dominio sale de `lib/site.ts`
(`NEXT_PUBLIC_SITE_URL`, por defecto `https://ewala.es`). Con `trailingSlash: true`, todas las URLs
(canonical, hreflang, sitemap, JSON-LD) terminan en `/`; `localizedPath()` y `withTrailingSlash()` lo
garantizan donde Next no lo hace solo.

## SEO y metadatos

- El layout fija `metadataBase`, `title`/`description`, `alternates`, `openGraph` (con `url`,
  `siteName`, `type` y la imagen de `opengraph-image.tsx`), `manifest` y `twitter: { card }`. Emite el
  JSON-LD `Organization` (con `@id`, CIF, logo, contacto y `sameAs` = `SOCIAL_LINKS`) y `WebSite`.
- **Next no fusiona objetos entre layout y página.** Si una página define `openGraph` (o `alternates`),
  sustituye al del layout entero. Por eso las páginas interiores usan `pageOpenGraph()`, que hereda
  `siteName`, `type` e imagen del layout y solo pisa título, descripción, locale y URL.
- `twitter` en el layout lleva **solo** `card`: título, descripción e imagen los completa Next desde el
  `openGraph` de cada página (si se pusiera `twitter.title` en el layout, todas heredarían el de la home).
- **Previews no indexables:** si el build no es de producción (`CONTEXT` de Netlify distinto de
  `production`, ver `IS_PRODUCTION_DEPLOY` en `lib/site.ts`), todas las páginas llevan `noindex` y
  `robots.txt` es `Disallow: /`.
- `app/not-found.tsx` es la 404 global (`out/404.html`): monta su propio `<html lang="es">` porque el
  layout raíz es transparente.
- Posicionamiento de la empresa en textos públicos: *startup europea de ciberseguridad industrial,
  redes OT/IoT, machine learning y asistente de IA*. LIVET no se menciona (ni navbar, ni footer, ni
  meta, ni JSON-LD, ni `/compania`).
- Auditoría automática: `pnpm build && pnpm verify:seo` (`scripts/verificar-seo.mjs`).

## Páginas legales

`/aviso-legal`, `/privacidad` y `/cookies` (mismo slug en `/es` y `/en`) son páginas públicas e indexables.
Se basan en los documentos de ISN Labs (`secnorthlabs.eu`), cuya estructura (aviso legal: 10 apartados;
privacidad: 21; cookies: 10, con tabla) coincide con la de la web antigua de Ewala, que era una versión
anterior y menos depurada de esos mismos textos. Se adoptó la de ISN y se sustituyeron los datos legales.

**Datos, no marcado.** El contenido está en `messages/{es,en}.json` → `legal.*` como secciones de bloques
tipados (`p`, `ul`, `dl`, `table`), y `components/ewala/legal-document.tsx` los pinta. Así los textos
siguen la regla «sin strings en componentes», la simetría ES/EN se comprueba como el resto de claves y
las tres páginas comparten un único renderizador. Los textos admiten `**negrita**` y `[etiqueta](href)`;
`renderInline` los convierte en nodos React con una lista blanca de esquemas (`/ruta`, `mailto:`, `tel:`,
`https:`), de modo que no hay `dangerouslySetInnerHTML` ni superficie de inyección.

**Diferencias deliberadas respecto a ISN:**

| Tema | Decisión |
|---|---|
| Datos legales | Ewala IT Services S.L., CIF B42987651, `rgpd@ewala.es`, Registro Mercantil de Asturias (Tomo 4434, Folio 214, Inscripción 1, hoja AS-57378), tribunales de Gijón |
| Conservación de CV | 24 meses (la web antigua de Ewala); ISN usa 1 año |
| Formulario de contacto | Netlify, Inc. (alojamiento y función) y Resend, Inc. (envío de correo) se citan como encargados y como transferencia a EE. UU. (apartados 10 y 12 de privacidad). No se afirma certificación DPF: «cuando el destinatario esté adherido… o, en su defecto, Cláusulas Contractuales Tipo» |
| Cookies | GA4 a través de Google Tag Manager; banner de Cookiebot (Usercentrics A/S). La tabla incluye `_ga`, `_ga_<ID>` y la cookie técnica `CookieConsent` |
| Registro del consentimiento | Lo conserva Cookiebot en servidores de la UE (art. 7.1 RGPD) y el texto lo dice así |
| Contenido que **no** se copió | El último párrafo de la política de cookies antigua («esta web no utiliza cookies») contradecía el resto del documento |

Mantenimiento: actualizar `legal.*.updated` (ES y EN) al cambiar un texto; revisar privacidad y cookies si
cambian proveedores, plazos o cookies; y pasar por asesoría jurídica antes de publicar cambios sustanciales.

## Consentimiento de cookies y GA4

La web solo carga **Google Tag Manager** (`GTM-KG3ZWVWW`). GA4 y el banner de **Cookiebot** se
configuran **dentro del contenedor**, no en el código. Nada no esencial funciona sin consentimiento:

- `public/gtm.js` (cargado por `components/ewala/analytics.tsx` en el `<head>` de todas las páginas, más
  el `<noscript>` tras `<body>`) fija **Consent Mode v2 con todo denegado por defecto** y después carga
  el contenedor. El ID está en `lib/analytics.ts` y en `public/gtm.js`: deben coincidir.
- En GTM, la etiqueta de GA4 exige el consentimiento `analytics_storage` y solo se dispara en el host
  `ewala.es` (las previews de Netlify no ensucian las estadísticas). Cookiebot se instala con su
  plantilla oficial (activador *Consent Initialization*), con los mismos valores por defecto (denegado).
- El footer muestra «Preferencias de cookies» **solo si Cookiebot está cargado** (`window.Cookiebot`,
  evento `CookiebotOnLoad`) y lo reabre con `Cookiebot.renew()`.
- La CSP (`netlify.toml`) ya permite los dominios de GTM, GA4 y Cookiebot. Va en modo **Report-Only** y
  los informes llegan a `netlify/functions/csp-report.mts` (Netlify → Logs → Functions).

Comprobación mínima tras tocar esta zona: en DevTools, el `dataLayer` debe tener `consent default` antes
de `gtm.js`; sin aceptar, *Application → Cookies* no debe tener `_ga`; aceptando en Cookiebot, sí.
⛔ Cookiebot debe estar publicado en el contenedor **antes** de pasar la web a producción.

## Interruptores por entorno

`lib/features.ts` centraliza los interruptores `NEXT_PUBLIC_*` de funcionalidad (se incrustan en build; un
único punto de lectura). Hoy: `SHOW_DEMO_CTA` (`NEXT_PUBLIC_SHOW_DEMO_CTA === 'true'`, **por defecto
oculto**), que gobierna «Solicitar demo» (navbar escritorio y móvil), «Solicita una demo» (hero), el botón
principal del CTA final (oculto → «Contáctanos»), los botones «Descargar cómo funciona una PoC» (que, sin
documento todavía, llevan a contacto con `?need=demo`) y la opción «Demo SentryN3t» del selector del formulario. Se conservan las claves de texto
en los JSON para poder reactivarlos sin reescribir nada.

## Sellos y reconocimientos (home)

Los sellos de la empresa (Pyme innovadora, ENISA, EiBT, Spain 101, marca de igualdad, Premios Industria
4.0) se muestran en la **home, entre el carrusel de partners y el footer**, con `SealsGrid`
(`seals-grid.tsx`) y el namespace `sellos` de messages. Es contenido público e indexable: placas blancas
(los logos oficiales están diseñados para fondo claro), imágenes mapeadas por `id` en `SEAL_IMAGE`, textos y
`alt` en `sellos.seals`. Assets en `public/sellos/` y `public/team/`. El sello **Pyme innovadora** caduca
el 03/03/2029.

## Página oculta: proyectos y financiación europea

`/{locale}/sellos-y-reconocimientos` contiene hoy los **carteles de proyectos europeos** y el **banner Kit
Digital/Kit Consulting** (los sellos se movieron a la home; la URL se conserva por si ya está compartida).
Está pensada para que **solo se entre escribiendo la URL**:

| Qué | Cómo |
|---|---|
| No indexable | `robots: { index: false, follow: false, nocache: true, googleBot: { …, noimageindex: true } }` |
| Sin canonical ni hreflang | `alternates: {}` explícito: sin él heredaría los de la home y se presentaría como duplicado |
| Sin `og:url`/imagen | `openGraph` propio mínimo (no usa `pageOpenGraph`) |
| Fuera del sitemap | No está en `PAGES` |
| Sin enlaces | Nada la enlaza (header, footer, home, otras páginas) |
| Sin `Disallow` en `robots.txt` | Un `Disallow` revelaría la URL |
| Sin JSON-LD propio | Solo el `Organization` del layout |

**Es discreción, no control de acceso**: la ruta aparece en `_next/static/*/_ssgManifest.js` y quien
tenga el enlace entra. Si hiciera falta acceso restringido real, hay que ponerlo en Netlify (protección
por contraseña del sitio o Netlify Identity); opcionalmente una cabecera `X-Robots-Tag: noindex` en
`netlify.toml` refuerza el `noindex`.

Componentes: `posters-grid.tsx` y `funding-banner.tsx`. Assets en `public/recursos/` (carteles y logos
Kit).

**Carteles de proyectos.** Los 3 miden exactamente **1080×761** (`…-LUCIA-1080x761.webp`, `…-GRIAL-…`,
`…-LIVET-…`) y se pintan en una caja `aspect-[1080/761]` con `object-cover`: misma altura y anchura en
cualquier ancho (con imágenes de otra proporción, `object-cover` recortaría, de ahí que el tamaño deba
mantenerse). Una columna bajo `lg` y tres iguales desde `lg`; con dos columnas el tercer cartel quedaba
solo en la segunda fila. Los originales (1080×608, 1079×763 y 1080×761) se conservan en
`docs/assets-origen/carteles/`; `scripts/generar-carteles-recursos.py` los normaliza (LUCIA: prolonga el
panel de foto 76+77 px reflejando sus filas extremas con cizalla para continuar el borde, sin tocar logos
ni texto, y comprueba esos invariantes; GRIAL: elimina la franja blanca inferior que traía el original y repone esas filas como blanco, mitad
arriba y mitad sobre la banda, y repite 1 columna; LIVET: copia byte a byte). Los ficheros de salida llevan el tamaño en el nombre para que un CDN/navegador con la versión
antigua en caché no sirva otra proporción. Las bandas negras inferiores no coinciden entre carteles
porque cada diseño original las tenía distintas.

> `/recursos` fue la página anterior de carteles y banner Kit; se eliminó y su contenido pasó aquí.
> Nunca llegó a publicarse en ewala.es, así que no necesita redirección.

## Carrusel de partners

`components/ewala/logo-carousel.tsx` (home y `/compania`) muestra solo partners: INCIBE, Centro de
Ciberseguridad Industrial, Industria 4.0 Asturias, Femetal Industry, Clúster TIC y AsturCON Tech. Los
logos se mapean por `name` en `SEAL_SRC`; texto, `href` y `alt` viven en `logoCarousel.seals`.
Implementación: dos `<ul>` idénticos dentro de un contenedor `w-max` animado a `-50%` (la copia
duplicada va con `aria-hidden` y `tabIndex=-1`); duración = 3 s × nº de logos; pausa con ratón y con
foco; con `prefers-reduced-motion` se detiene y se oculta la copia (`.logo-marquee` en `globals.css`).

## Seguridad — por qué estas reglas

El proyecto compila a HTML/CSS/JS estático; Next no tiene servidor en producción. Mantenerlo así
elimina superficie de ataque entera (no hay sesiones ni secretos en el bundle). Los únicos endpoints son
las dos Netlify Functions (`/api/contact`, `/api/csp-report`), pequeñas, sin dependencias externas y con
sus propias defensas (ver «Formularios y envío de email»).

Cabeceras de seguridad (todas en `netlify.toml`): HSTS de 1 año sin `preload`, `X-Frame-Options: DENY`,
`nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y CSP en modo `Report-Only` con sumidero.
`'unsafe-inline'` en `script-src` es obligatorio por Next (scripts de hidratación en línea, sin nonce al no
haber servidor): con él la CSP es higiene y no una defensa completa frente a XSS.

### Prohibiciones absolutas (revertir en cualquier PR que las introduzca)

| Prohibido | Motivo |
|---|---|
| `middleware.ts` | No existe runtime donde ejecutarlo |
| Imports de `next-intl/server` | Requieren Node.js por request |
| `getRequestConfig`, `getTranslations`, `getMessages` | APIs del server pipeline de next-intl |
| `createNextIntlPlugin` en `next.config.mjs` | Wrapper del server pipeline |
| Detección de idioma por `Accept-Language`/cookies | No determinista entre CDN/bot/navegador |
| `'use server'`, Server Actions, `headers()`, `cookies()` | Requieren runtime Node.js |
| `app/api/` routes | Incompatible con `output: 'export'`. Los endpoints van en `netlify/functions/` |
| `fetch()` con `{ cache: 'no-store' }` en componentes | Requiere runtime para revalidar |
| Dependencias de servidor (drivers BD, ORMs) | Rompen el build con `output: 'export'` |
| Secretos en código o en `NEXT_PUBLIC_*` | Todo el bundle es público. Los secretos (p. ej. `RESEND_API_KEY`) solo como variables de Netlify con scope «Functions» |
| `import` de `node_modules` en `netlify/` | La función dejaría de ser autocontenida (en Windows, además, `netlify dev` no puede servirla) |

### Permitido y seguro

- `fetch()` desde el cliente a las funciones propias (`/api/*`, mismo origen) o a servicios con CORS.
- Variables `NEXT_PUBLIC_*` para valores públicos: `SITE_URL`, verificación de Search Console e
  interruptores de funcionalidad.
- Scripts de terceros solo a través de GTM y gobernados por Consent Mode/Cookiebot.
- Nuevas Netlify Functions con extensión **`.mts`** (con `.ts` Netlify las trataría como CommonJS con la
  firma antigua de Lambda), helpers en `netlify/lib/` y su ruta `/api/*` en `netlify.toml`.

## Formularios y envío de email

El formulario de contacto (`/{locale}/contacto`, `components/ewala/contact-form.tsx`) envía un `POST`
JSON a **`/api/contact`**, que `netlify.toml` reescribe a la Netlify Function
`netlify/functions/contact.mts`. La función manda un correo con **[Resend](https://resend.com)** al
buzón de Ewala.

```
navegador ──POST /api/contact──▶ Netlify (rate limit 10/min/IP) ──▶ contact.mts ──fetch──▶ API de Resend
                                                                        │
                                       contrato compartido: lib/contact.ts (límites, need, tipos)
```

- **Cliente** (`lib/contact-client.ts`): genera `submissionId` (UUID) al montar y mide el tiempo de relleno con
  `performance.now()` (reloj monotónico; se envía como `elapsedMs`, nunca una hora absoluta: el reloj del
  visitante no tiene por qué coincidir con el del servidor), valida con
  `zod` + `react-hook-form`, espera el tiempo mínimo antispam si hace falta y traduce la respuesta a
  mensajes (`validation`, `rateLimited`, `network`, `unavailable`, `generic`). Muestra la referencia y,
  en modo prueba, un aviso.
- **Función** (`contact.mts` + `netlify/lib/`):
  - `http.ts`: solo `POST` JSON ≤ 32 KB; rechaza `Sec-Fetch-Site` ≠ `same-origin` (CSRF); log sin datos
    personales.
  - `contact-validation.ts`: validación estricta **sin dependencias** (lista blanca de campos, longitudes de
    `lib/contact.ts`, sin caracteres de control en campos de una línea → evita inyección de cabeceras).
  - Antispam: honeypot (`company_website` en el formulario → `website` en el JSON) y `elapsedMs` < 3000 →
    responde éxito sin enviar.
  - `resend.ts`: `fetch` a la API de Resend con `Idempotency-Key` = `submissionId` + huella SHA-256 del contenido
    (sin duplicados por doble clic; Resend exige el mismo cuerpo por clave y el correo lleva la hora, así
    que el 409 `invalid_idempotent_request` se trata como «ya enviado» y el 409
    `concurrent_idempotent_requests` como transitorio), timeout de 3,5 s y un reintento solo ante errores
    transitorios. `Reply-To` = email del visitante.
  - `contact-email.ts`: plantilla HTML (tablas, CSS en línea) + texto; **todo** dato del formulario pasa
    por `esc()`.
  - Sin `RESEND_API_KEY`, `RESEND_FROM` o `CONTACT_MAILBOX_TO` → **modo prueba** (`delivery: "skipped"`).
    Si Resend falla → **503**, nunca un falso éxito.
- **Variables** (Netlify → Environment variables, scope «Functions»): `RESEND_API_KEY` (secreto),
  `RESEND_FROM`, `CONTACT_MAILBOX_TO`, `MAIL_ENVIRONMENT` (`production` o el nombre del entorno, que se
  añade al asunto). Documentadas en `.env.local.example`.
- **Protección de datos:** Netlify (alojamiento y función) y Resend (envío) actúan como encargados, con
  transferencia a EE. UU.; consta en la política de privacidad (apartados 10 y 12) y en el bloque
  informativo del formulario (`contact.rail.dataProtection`). Si se cambia de proveedor o se añaden
  campos, actualizar esos textos. La casilla de privacidad enlaza a `/{locale}/privacidad`.
- La opción «Demo SentryN3t» del selector `need` y `?need=demo` dependen de `SHOW_DEMO_CTA`
  (`lib/features.ts`).

## Notas de configuración

- **`next.config.mjs`**: `output: 'export'` (HTML estático), `trailingSlash: true` (cada página es
  `carpeta/index.html` y las URLs terminan en `/`), `poweredByHeader: false`,
  `typescript.ignoreBuildErrors: false` (el build comprueba tipos) e `images.unoptimized: true`
  (necesario para export estático).
- **`netlify.toml`**: build (`corepack enable && pnpm install --frozen-lockfile && pnpm build`, Node 24.18,
  pnpm 12.6, `NETLIFY_NEXT_PLUGIN_SKIP`), rutas de las funciones, redirecciones 301/410 de la web antigua,
  cabeceras de seguridad y caché, y la 404 final. Las reglas se evalúan de arriba abajo.
- **`eslint.config.mjs`**: flat config con `eslint-config-next` (core-web-vitals + typescript). Ignora
  `.next`, `out`, `.netlify`, `_livet-spa`, `src/generated` y `components/ui` (shadcn). Las reglas del React
  Compiler (`set-state-in-effect`, `immutability`, `purity`) están como aviso porque el proyecto no
  usa el compilador.
- **`pnpm-workspace.yaml`**: `allowBuilds` habilita `@parcel/watcher` y `@swc/core`, y desactiva
  el build nativo de `sharp` y de `unrs-resolver` (pnpm 12 bloquea los scripts de dependencias nuevas).
- **`postcss.config.mjs`**: único plugin `@tailwindcss/postcss` (Tailwind v4).
- **`tsconfig.json`**: alias `@/*` → raíz del proyecto (no disponible en `netlify/`, que usa rutas
  relativas). `target: ES6`, `strict: true`, `noEmit`; incluye `**/*.mts` para comprobar las funciones.
- **`components.json`**: shadcn estilo `new-york`, `baseColor: neutral`, `cssVariables: true`,
  iconos `lucide`, `rsc: true`. Aliases `@/components`, `@/lib`, `@/components/ui`, `@/hooks`.
- **`styles/globals.css`**: remanente **no importado**; editar siempre `app/globals.css`.
- **`docs/historico/IMPLEMENTATION_PLAN-i18n.md`** y **`docs/guia-home-tabs-producto.md`**: documentos de
  planificación anteriores; describen el diseño con dos productos y pueden no reflejar el estado actual.
- **`docs/assets-origen/public-sin-uso/`**: imágenes que estaban en `public/` sin usarse; se conservan
  fuera de la web publicada.
