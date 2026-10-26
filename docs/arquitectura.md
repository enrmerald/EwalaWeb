# Arquitectura y decisiones de diseño

Documento de referencia detallado. El `CLAUDE.md` de la raíz contiene el resumen operativo;
aquí está el "por qué" y el detalle que no hace falta tener siempre en contexto.

## Modelo de ejecución — dos fases separadas

Este proyecto tiene **dos fases de ejecución completamente separadas**:

| Fase | Cuándo ocurre | Qué corre | Output |
|---|---|---|---|
| **Pipeline de build** | `pnpm build` en CI/local | Node.js (una vez, desechable) | Archivos estáticos en `out/` |
| **Runtime** | Navegador del usuario | React + JS del bundle | Interactividad, hydration |

**No existe ningún proceso Node.js en producción.** El CDN sirve los archivos de `out/`
directamente. Cualquier código que asuma un servidor activo (middleware, cookies de request,
headers HTTP, API routes) es incompatible con este modelo y romperá el build o el despliegue.

Lo que corre **solo en el pipeline de build** (una vez, nunca en producción):

- `generateStaticParams` en `app/[locale]/layout.tsx` → genera las rutas `es` y `en`.
- `generateMetadata` en `app/[locale]/layout.tsx` → emite `<title>`, `description`, canonical,
  hreflang (`alternates.languages`), Open Graph y favicons embebidos en el HTML.
- `getDictionary(locale)` (en `i18n/config.ts`) → `import()` dinámico de `messages/{locale}.json`.
  Lo invocan los Server Components (`page.tsx`, `layout.tsx`) durante el build.

`pnpm start` **no se usa**: el proyecto genera HTML estático (`output: 'export'`) que se despliega
en un CDN (Cloudflare Pages, Netlify, Vercel static). No hay servidor Node.js en runtime.

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
   Compone las 8 sub-secciones: `ProductHero`, `ProductMetrics`, `ProductShowcase`,
   `ProductCapabilities`, `ProductSectors`, `ProductInnovation`, `ProductTestimonial`,
   `ProductFinalCta`. Todas son Server Components puros en `components/ewala/sections/`.

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

**No se usa `next-intl`** (pese a que quede un `next-intl.config.ts` remanente en la raíz y el
paquete en `node_modules`; ninguno se importa desde el código fuente). La i18n es un módulo propio
y minimalista en `i18n/`:

- **`i18n/config.ts`**: `locales = ['es','en']`, `defaultLocale = 'es'`,
  `PAGES = ['/', '/blog', '/contacto', '/compania', '/privacidad', '/aviso-legal', '/cookies']` (las
  páginas **públicas e indexables**: alimentan el sitemap; la página oculta de carteles y financiación
  no está aquí a propósito). No hay slugs por idioma: `/en/privacidad` usa el mismo slug que `/es/privacidad`.
  - `getDictionary(locale)` → `import()` dinámico del JSON de mensajes (build-time).
  - `localizedPath(locale, path)` y `alternatesFor(path, locale)` → construyen el **canonical
    autorreferenciado** (`/{locale}{path}`) y `languages` (hreflang, incluye `x-default` → español)
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
   `ProductLanding` los reparte entre sus 8 sub-secciones: `<ProductHero t={content.hero} />`, etc.
3. Los **Server Components de sección** (`components/ewala/sections/`) reciben su slice tipado
   como `Messages['products']['sentryn3t']['hero']`, etc. No usan contexto ni hooks.
4. Solo `Header`, `Footer`, `MobileStickyCta` y `CookieConsent` consumen mensajes vía contexto (`useTranslations`).
   `ProductExperience` y `FloatingProductTabs` reciben `ui` por props desde `page.tsx`. Otras islas
   (`ContactForm`, `HeroScreenshotCarousel`, `BlogFiltro`) reciben sus textos por props.
5. El `layout.tsx` pasa a `I18nProvider` **solo** los namespaces de las islas que usan contexto:
   `{ nav, footer, mobileCta, cookieBanner }` (cada uno de `dict`) → eso es lo único que
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
2. Añadir la ruta a `PAGES` en `i18n/config.ts` (entra sola en `app/sitemap.ts`).
3. Añadir las claves en **ambos** `messages/es.json` y `messages/en.json`.
4. Usar `HeroInterior` (aporta el único `<h1>`) y, si procede, `JsonLd` con `breadcrumbJsonLd`.

`app/sitemap.ts` (PAGES × locales + artículos del blog) y `app/robots.ts` (`Allow: /` + sitemap) son
estáticos (`dynamic = 'force-static'`). El dominio sale de `lib/site.ts` (`NEXT_PUBLIC_SITE_URL`, por
defecto `https://ewala.es`, pendiente de confirmar con el cliente).

## SEO y metadatos

- El layout fija `metadataBase`, `title`/`description`, `alternates` y `openGraph` (con `url`,
  `siteName`, `type` y la imagen de `opengraph-image.tsx`). Emite el JSON-LD `Organization`.
- **Next no fusiona objetos entre layout y página.** Si una página define `openGraph` (o `alternates`),
  sustituye al del layout entero. Por eso las páginas interiores usan `pageOpenGraph()`, que hereda
  `siteName`, `type` e imagen del layout y solo pisa título, descripción, locale y URL.
- **No** definir `twitter` en el layout: lo heredarían todas las páginas con el título de la home.
  `twitter:card` lo deriva Next (`summary_large_image` si hay imagen).
- Posicionamiento de la empresa en textos públicos: *startup europea de ciberseguridad industrial,
  redes OT/IoT, machine learning y asistente de IA*. LIVET no se menciona (ni navbar, ni footer, ni
  meta, ni JSON-LD, ni `/compania`).
- El JSON-LD es solo en español (vive en el layout y no depende del idioma).

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
| Formspree | Se cita como encargado del formulario de contacto y como transferencia a EE. UU. (apartados 10 y 12 de privacidad). No se afirma certificación DPF: «cuando el destinatario esté adherido… o, en su defecto, Cláusulas Contractuales Tipo» |
| Cookies | Sin Google Tag Manager (se carga `gtag.js` directo); la tabla incluye `_ga`, `_ga_<ID>` y la clave propia `ewala-cookie-consent` |
| Registro del consentimiento | ISN afirma conservarlo en servidor (art. 7.1 RGPD). Aquí se guarda solo en el navegador y el texto lo dice así; acreditarlo en servidor chocaría con la regla de cero servidor |
| Contenido que **no** se copió | El último párrafo de la política de cookies antigua («esta web no utiliza cookies») contradecía el resto del documento |

Mantenimiento: actualizar `legal.*.updated` (ES y EN) al cambiar un texto; revisar privacidad y cookies si
cambian proveedores, plazos o cookies; y pasar por asesoría jurídica antes de publicar cambios sustanciales.

## Consentimiento de cookies y GA4

Hay una única fuente de cookies no técnicas: Google Analytics 4. El diseño evita que ningún script o
cookie de Google exista **antes** de que el usuario consienta:

- `app/[locale]/layout.tsx` ya no inyecta `gtag.js`. Monta `CookieConsent` (isla cliente) solo si
  `GA_MEASUREMENT_ID` (de `lib/consent.ts`) no está vacío. Esa constante valida `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  con `/^G-[A-Z0-9]{4,}$/`: el valor acaba en una URL y en un script inline, así que un formato distinto
  se trata como «sin ID».
- `CookieConsent` lee el estado con `useSyncExternalStore(subscribe, readRawConsent, () => 'ssr')`. En el
  servidor y durante la hidratación no pinta nada (sin desajuste de hidratación y sin banner pre-renderizado
  en el HTML estático). Solo inyecta `next/script` con `gtag.js` cuando `analytics === true`.
- Persistencia: `localStorage['ewala-cookie-consent'] = {v:1, analytics, ts}`. Se considera inválido si
  falta, no es JSON, `v !== 1`, `analytics` no es booleano, `ts` es futuro o tiene más de 365 días; en todos
  esos casos (y si el almacenamiento lanza) se actúa como «sin consentimiento» y se vuelve a mostrar el banner.
- Retirada: `revokeAnalytics()` fija `window['ga-disable-<ID>']=true` y expira `_ga`, `_ga_*` y `_gid` en el
  dominio actual y en los dominios padre. Es idempotente.
- Accesibilidad: `role="dialog"` no modal, foco al abrir, Esc cierra **sin** consentir, botones aceptar y
  rechazar con idéntico estilo y tamaño, casilla de analítica sin premarcar.
- El footer reabre el panel con `window.dispatchEvent(new Event(OPEN_EVENT))`; el enlace solo se muestra
  si hay ID.

Comprobación mínima tras tocar esta zona: con `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST12345`, primera visita
sin ninguna petición a `googletagmanager.com`; rechazar no carga nada; aceptar sí; un registro caducado
vuelve a mostrar el banner. Sin la variable, `out/` no debe contener ni el ID ni etiquetas de Google.

## Interruptores por entorno

`lib/features.ts` centraliza los interruptores `NEXT_PUBLIC_*` de funcionalidad (se incrustan en build; un
único punto de lectura). Hoy: `SHOW_DEMO_CTA` (`NEXT_PUBLIC_SHOW_DEMO_CTA === 'true'`, **por defecto
oculto**), que gobierna «Solicitar demo» (navbar escritorio y móvil), «Solicita una demo» (hero), el botón
principal del CTA final (oculto → «Contáctanos»), los botones «Descargar cómo funciona una PoC» (que hoy
apuntan a `#`) y la opción «Demo SentryN3t» del selector del formulario. Se conservan las claves de texto
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
tenga el enlace entra. Si hiciera falta acceso restringido real, hay que ponerlo en el hosting
(Cloudflare Access, auth básica…); opcionalmente una cabecera `X-Robots-Tag: noindex` en el CDN refuerza
el `noindex`.

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
> En el export estático no hay redirects: si estuvo indexada, redirigir en el hosting.

## Carrusel de partners

`components/ewala/logo-carousel.tsx` (home y `/compania`) muestra solo partners: INCIBE, Centro de
Ciberseguridad Industrial, Industria 4.0 Asturias, Femetal Industry, Clúster TIC y AsturCON Tech. Los
logos se mapean por `name` en `SEAL_SRC`; texto, `href` y `alt` viven en `logoCarousel.seals`.
Implementación: dos `<ul>` idénticos dentro de un contenedor `w-max` animado a `-50%` (la copia
duplicada va con `aria-hidden` y `tabIndex=-1`); duración = 3 s × nº de logos; pausa con ratón y con
foco; con `prefers-reduced-motion` se detiene y se oculta la copia (`.logo-marquee` en `globals.css`).

## Seguridad — por qué estas reglas

El proyecto compila a HTML/CSS/JS estático; no hay servidor Node.js en producción. Mantenerlo así
elimina superficie de ataque entera (no hay endpoints, no hay secretos en runtime, no hay sesiones).

### Prohibiciones absolutas (revertir en cualquier PR que las introduzca)

| Prohibido | Motivo |
|---|---|
| `middleware.ts` | No existe runtime donde ejecutarlo |
| Imports de `next-intl/server` | Requieren Node.js por request |
| `getRequestConfig`, `getTranslations`, `getMessages` | APIs del server pipeline de next-intl |
| `createNextIntlPlugin` en `next.config.mjs` | Wrapper del server pipeline |
| Detección de idioma por `Accept-Language`/cookies | No determinista entre CDN/bot/navegador |
| `'use server'`, Server Actions, `headers()`, `cookies()` | Requieren runtime Node.js |
| `app/api/` routes | Incompatible con `output: 'export'` |
| `fetch()` con `{ cache: 'no-store' }` en componentes | Requiere runtime para revalidar |
| Dependencias de servidor (drivers BD, ORMs) | Rompen el build con `output: 'export'` |
| Secretos en código (API keys, tokens) | Todo el bundle es público |

### Permitido y seguro

- `fetch()` desde el cliente a servicios externos con CORS habilitado.
- Variables `NEXT_PUBLIC_*` para URLs/IDs públicos de terceros (no secretos): Formspree, GA4, `SITE_URL` e
  interruptores de funcionalidad.
- `localStorage` solo para el consentimiento de cookies (siempre con `try/catch`; nunca para datos de usuario).
- Scripts de terceros (GA4) únicamente tras consentimiento explícito.
- Formularios que envíen a un SaaS de email (Resend, Formspree, Web3Forms…).

## Formularios y envío de email

El formulario de contacto (`/{locale}/contacto`, `components/ewala/contact-form.tsx`) **no usa
una API Route propia**. Envía directamente desde el cliente (isla `"use client"`) a
**[Formspree](https://formspree.io/)** mediante un `POST` JSON a
`https://formspree.io/f/{NEXT_PUBLIC_FORMSPREE_FORM_ID}` — decisión ya tomada, no una opción
entre varias:

- El Form ID se lee de la variable pública `NEXT_PUBLIC_FORMSPREE_FORM_ID` (obligatoriamente
  `NEXT_PUBLIC_*`: no hay servidor que la mantenga en secreto, todo el bundle es público).
  Se documenta sin valor real en `.env.local.example`; el valor real vive solo en `.env.local`
  (gitignored) y en las env vars del CDN.
- Si la variable está vacía (aún no hay cuenta de Formspree creada), el formulario **sigue
  renderizando y validando con normalidad**, pero al enviar muestra un aviso discreto en la UI
  de que el envío no está configurado todavía — así se puede revisar y probar visualmente el
  formulario antes de tener el Form ID real. No se lanza ningún error de consola en producción
  por esto.
- Anti-spam con **honeypot** (`company_website`, oculto por posición absoluta fuera de pantalla,
  nunca `display:none`, con `aria-hidden` y `tabIndex={-1}` para no afectar a lectores de
  pantalla ni a la navegación por teclado). Si el bot lo rellena, el formulario simula un envío
  correcto sin hacer la petición real.
- Validación en cliente con `zod` + `react-hook-form` + `@hookform/resolvers` (ya en
  `dependencies`) antes de cualquier `fetch`.
- **Protección de datos:** Formspree (EE. UU.) recibe nombre, email, empresa, mensaje, etc., y actúa como
  encargado del tratamiento; consta en la política de privacidad (apartados 10 y 12) y en el bloque
  informativo del formulario (`contact.rail.dataProtection`, con enlace a `/privacidad`). Si se cambia de
  proveedor o se añaden campos, actualizar esos textos. La casilla «He leído y acepto la política de
  privacidad» enlaza a `/{locale}/privacidad`.
- La opción «Demo SentryN3t» del selector `need` y `?need=demo` dependen de `SHOW_DEMO_CTA`
  (`lib/features.ts`).

## Notas de configuración

- **`next.config.mjs`**: `output: 'export'` (HTML estático), `typescript.ignoreBuildErrors: true`
  (el build no garantiza tipos — ejecutar `pnpm exec tsc --noEmit` aparte, tras el build) e
  `images.unoptimized: true` (necesario para export estático).
- **`eslint.config.mjs`**: flat config con `eslint-config-next` (core-web-vitals + typescript). Ignora
  `.next`, `out`, `_livet-spa`, `src/generated` y `components/ui` (shadcn). Las reglas del React
  Compiler (`set-state-in-effect`, `immutability`, `purity`) están como aviso porque el proyecto no
  usa el compilador.
- **`pnpm-workspace.yaml`**: `allowBuilds` habilita `@parcel/watcher` y `@swc/core`, y desactiva
  el build nativo de `sharp` y de `unrs-resolver` (pnpm 12 bloquea los scripts de dependencias nuevas).
- **`postcss.config.mjs`**: único plugin `@tailwindcss/postcss` (Tailwind v4).
- **`tsconfig.json`**: alias `@/*` → raíz del proyecto. `target: ES6`, `strict: true`, `noEmit`.
- **`components.json`**: shadcn estilo `new-york`, `baseColor: neutral`, `cssVariables: true`,
  iconos `lucide`, `rsc: true`. Aliases `@/components`, `@/lib`, `@/components/ui`, `@/hooks`.
- **`next-intl.config.ts`**: remanente sin uso; candidato a borrar.
- **`styles/globals.css`**: remanente **no importado**; editar siempre `app/globals.css`.
- **`messages/es_old.json` / `en_old.json`**: históricos, no se importan.
- **`IMPLEMENTATION_PLAN.md`** y **`docs/guia-home-tabs-producto.md`**: documentos de planificación
  anteriores; describen el diseño con dos productos y pueden no reflejar el estado actual.
