# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar en este repositorio. Resumen operativo; el detalle y
el «por qué» están en [`docs/arquitectura.md`](docs/arquitectura.md) (**lectura obligatoria antes de
tocar código**).

## Qué es esto

Web corporativa de **Ewala IT Services** (`https://ewala.es`): **Next.js 16 (App Router) + React 19 +
Tailwind v4 + shadcn/ui**, exportada a **HTML estático** (`output: 'export'` → `out/`) y desplegada en
**Netlify** junto a dos **Netlify Functions** (`/api/contact`, `/api/csp-report`). Bilingüe `/es/` y `/en/`.

Producto en la home: **SentryN3t Protection** (NDR de ciberseguridad industrial OT/IoT con machine
learning y asistente de IA). Posicionamiento: **startup europea de ciberseguridad industrial**. LIVET
**no** está en la web (contenido archivado fuera del repo).

Páginas: home, `/compania`, `/blog` (+ artículos), `/contacto`, legales (`/aviso-legal`, `/privacidad`,
`/cookies`) y una página oculta (`/sellos-y-reconocimientos`, `noindex`, ver `docs/arquitectura.md`).

> Este repositorio sustituyó en 2026 a la web antigua (HTML/Bootstrap + blog Hugo). La web antigua
> completa está en la rama `backup-web-antigua`. Sus URLs se redirigen (301) o se retiran (410) en
> `netlify.toml`.

## Comandos

Gestor de paquetes: **pnpm 12** (versión fijada en `package.json` → `packageManager`). Node **24.18**
(`.nvmrc`).

```bash
pnpm install              # dependencias
pnpm dev                  # desarrollo en http://localhost:3000 (sin redirecciones ni funciones)
pnpm build                # build estático → out/ (comprueba tipos)
pnpm lint                 # ESLint 9 (eslint.config.mjs)
pnpm typecheck            # tipos sin hacer build (incluye netlify/**/*.mts)
pnpm verify:seo           # auditoría SEO de out/ (tras pnpm build)
pnpm verify:redirects     # URLs antiguas → 301/410, rutas nuevas → 200 (contra http://localhost:8888)

# Probar como en producción (redirecciones, cabeceras y funciones de netlify.toml):
pnpm build && pnpm dlx --package=netlify-cli netlify dev --dir out --offline   # http://localhost:8888
```

No hay tests unitarios. **Cómo comprobar un cambio:** `pnpm lint` (0 errores; hay 6 avisos previos
conocidos, sobre todo reglas del React Compiler, que el proyecto no usa), `pnpm typecheck`, `pnpm build`, `pnpm verify:seo` y, si
tocas `netlify.toml` o funciones, `netlify dev` + `pnpm verify:redirects`.

Avisos de entorno (Windows + OneDrive):
- Si `pnpm build` falla con `EPERM … .next`, es OneDrive bloqueando la caché: borrar `.next/` y repetir.
- `corepack enable` (lo usa el build de Netlify) necesita administrador en Windows; en local no hace falta.
- En PowerShell 5.1, `curl.exe --data '{"a":1}'` pierde las comillas: enviar JSON desde fichero
  (`--data-binary @fichero.json`).

## Regla nº1: Next.js sin servidor

El CDN sirve `out/` tal cual. **Prohibido** en código de Next: API Routes (`app/api/`), `'use server'` /
Server Actions, `headers()`, `cookies()`, `middleware.ts`, `next-intl/server`, dependencias de servidor y
`redirects/rewrites/headers` en `next.config` (no existen con export: van en `netlify.toml`).

- **Código de servidor = solo Netlify Functions** en `netlify/functions/*.mts`. Extensión **`.mts`
  obligatoria** (con `.ts` Netlify las trata como CommonJS con la firma antigua de Lambda y no reciben un
  `Request`). Helpers en `netlify/lib/` (fuera de `functions/` para que no se desplieguen como funciones).
  **Sin dependencias de `node_modules`** en `netlify/` y solo rutas relativas (no `@/`).
- **Secretos** solo en variables de entorno de Netlify con scope «Functions» (p. ej. `RESEND_API_KEY`);
  nunca en código ni en `NEXT_PUBLIC_*` (todo lo `NEXT_PUBLIC_*` acaba en el bundle público).
- `useSearchParams()` necesita `<Suspense>` en export; el formulario lee `window.location` en un efecto.

## Arquitectura (mapa)

```
app/
  layout.tsx              ← raíz transparente (devuelve children; el <html> lo pone cada idioma)
  page.tsx                ← respaldo: redirect('/es/') (en producción responde antes un 301 de Netlify)
  not-found.tsx           ← 404 global (out/404.html) con su propio <html lang="es">, noindex
  fonts.ts                ← next/font (Noto Sans, Space Mono), compartido por layout y 404
  sitemap.ts, robots.ts   ← estáticos; robots y noindex cambian si el build no es de producción
  [locale]/
    layout.tsx            ← <html lang>, metadatos comunes, JSON-LD Organization + WebSite, GTM, I18nProvider
    page.tsx              ← home (SentryN3t + partners + sellos)
    compania/ blog/ blog/[slug]/ contacto/ aviso-legal/ privacidad/ cookies/ sellos-y-reconocimientos/
    opengraph-image.tsx   ← imagen social 1200×630 por idioma (colores y logo corporativos)
  globals.css             ← Tailwind v4 + tema

i18n/        config.ts (locales, PAGES, isLocale, localizedPath, alternatesFor) · client.tsx · types.ts
lib/
  site.ts               ← SITE_URL, IS_PRODUCTION_DEPLOY (CONTEXT de Netlify), SOCIAL_LINKS, withTrailingSlash
  jsonld.ts             ← Organization, WebSite, BreadcrumbList, BlogPosting (enlazados por @id)
  metadata.ts           ← pageOpenGraph(): hereda el openGraph del layout
  analytics.ts          ← GTM_ID (debe coincidir con public/gtm.js)
  contact.ts            ← contrato del formulario (límites, NEED_VALUES, tipos) — cliente y función
  contact-client.ts     ← envío a /api/contact desde el navegador
  blog.ts, products.ts, features.ts (SHOW_DEMO_CTA), utils.ts
netlify/
  functions/contact.mts     ← formulario → Resend
  functions/csp-report.mts  ← sumidero de informes CSP (registra sin datos personales)
  lib/                      ← http, validación, Resend, plantilla de correo
messages/{es,en}.json   ← TODOS los textos (es.json es la fuente de verdad del tipo)
content/blog/{es,en}/*.md ← artículos (ver «Blog»)
public/                 ← se publica tal cual: PDFs institucionales, gtm.js, 410.html, imágenes, favicon/
scripts/                ← build-blog-content.mjs (build), verificar-*.mjs, generar-*.py (manuales)
components/ewala/       ← componentes propios (sections/ = Server Components de la landing)
components/ui/          ← shadcn/ui: no editar a mano (excluido del lint)
docs/                   ← arquitectura.md + documentación interna (no se publica)
netlify.toml            ← build, funciones, redirecciones 301/410, cabeceras de seguridad y caché
```

## Netlify (`netlify.toml`)

- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build`, publica `out/`,
  `NETLIFY_NEXT_PLUGIN_SKIP=true` (impide que el plugin convierta la web en SSR).
- **Las reglas `[[redirects]]` se evalúan de arriba abajo**: las concretas antes que los comodines y la
  regla `/*` → `/404.html` (404) **siempre la última**. Nunca `force = true` en una regla `/x` → `/x/` (bucle).
- Redirecciones de la web antigua: legales → `/es/…`, 4 posts conservados → `/es/blog/<slug>/`, el resto de
  `/blog/*`, landings kit-digital/kit-consulting/grc y restos antiguos → **410** (`public/410.html`).
  Inventario: `git show origin/backup-web-antigua:sitemap.xml`. Tras tocarlas: `pnpm verify:redirects`.
- Cabeceras: HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP y
  **CSP en `Report-Only`** (informes en Netlify → Logs → Functions → `csp-report`). Caché inmutable solo en
  `/_next/static/*`; **nunca** `Cache-Control` en `/*` (Netlify concatena cabeceras).
- `netlify dev` en local **no** emula `Cache-Control` ni `Content-Type` personalizados: comprobarlos en el
  deploy de la rama.

## Formulario de contacto (Resend)

`contact-form.tsx` → `POST /api/contact` → `netlify/functions/contact.mts` → API de Resend → buzón de Ewala.
Validación en cliente (zod) **y** en servidor (`netlify/lib/contact-validation.ts`, sin dependencias),
honeypot + tiempo mínimo de 3 s, `Idempotency-Key`, rate limit de 10/min/IP en Netlify, todo escapado
en la plantilla. Variables (Netlify, scope Functions): `RESEND_API_KEY`, `RESEND_FROM`,
`CONTACT_MAILBOX_TO`, `MAIL_ENVIRONMENT`. Sin ellas → **modo prueba** (no envía y lo avisa). Si Resend
falla → 503. Ver `.env.local.example`.

## Analítica y cookies

Solo se carga **GTM `GTM-KG3ZWVWW`** (`public/gtm.js`, con **Consent Mode v2 todo denegado por defecto**).
GA4 y el banner **Cookiebot** se configuran **en el contenedor GTM**, no en el código; no añadir `gtag.js`
directo ni otros scripts de terceros fuera de GTM. El footer muestra «Preferencias de cookies» solo si
Cookiebot está cargado (`Cookiebot.renew()`). Si cambian cookies o proveedores, actualizar
`legal.cookies` / `legal.privacy` en ambos idiomas (y su `updated`) y la tabla de cookies.

## SEO (reglas)

- Canonical **autorreferenciado por idioma** + hreflang `es`/`en`/`x-default` (`alternatesFor`). No
  apuntar el canonical de `/en` a `/es`.
- `trailingSlash: true`: toda URL interna termina en `/`. En `<a>` nativos, sitemap y JSON-LD usar
  `localizedPath()` / `withTrailingSlash()`; `<Link>` ya la añade.
- Next no fusiona `openGraph` entre layout y página: las páginas interiores usan `pageOpenGraph()`. El
  layout define `twitter` **solo** con `card`.
- Un único `<h1>` por página (lo pone `HeroInterior` en las interiores). `alt` en todas las imágenes.
- Title ≤ 60 caracteres, meta description 120–160. Comprobar con `pnpm verify:seo`.
- Sitemap: al cambiar el contenido de una página fija, actualizar su fecha en `PAGE_LAST_MODIFIED`
  (`app/sitemap.ts`); los posts usan su `date`.
- JSON-LD: solo datos reales (empresa, perfiles de `SOCIAL_LINKS`). No inventar autores, reseñas ni ratings.
- Previews de Netlify: `noindex` + `robots.txt` cerrado automáticamente (`IS_PRODUCTION_DEPLOY`).

## Blog

Artículos en `content/blog/{es,en}/<slug>.md` (mismo slug en ambos idiomas). `scripts/build-blog-content.mjs`
los valida y genera `src/generated/blog.json` en `predev`/`prebuild` (no se versiona). URL:
`/{locale}/blog/<slug>/`. Imágenes en `public/` con nombres **ASCII** en minúscula con guiones (sin tildes,
ñ ni espacios).

Front matter:

```yaml
title: "Título visible (H1 de la página)"
titleSeo: "Title SEO"            # <title> y og:title
subtitle: "Subtítulo"            # opcional
description: "Descripción corta" # entradilla y JSON-LD
descriptionSeo: "Meta description"
date: "AAAA-MM-DD"
category: "ot-iot"               # cerrada: nis2 | ot-iot | mssp | idi (ampliar en build-blog-content.mjs)
tags: ["ndr", "nis2"]
image: "/nombre-imagen.webp"     # opcional
imageAlt: "Texto alternativo"
author: "Ewala"
draft: false                     # opcional
```

- **Nunca `#` (H1) en el cuerpo**: el `title` ya se pinta como `<h1>`. El cuerpo empieza con párrafo o
  `##`, y la jerarquía es `##` → `###` → `####` sin saltar niveles.
- Enlaces internos **relativos** y con barra final (`/es/blog/ndr-en-ot/`, `/es/contacto/`), nunca
  `https://ewala.es/...` ni rutas de la web antigua (`/blog/posts/...`). No enlazar ni recomendar artículos
  que no existan.

### Metadatos SEO/SEM de un post (cuando el usuario los pida)

Adoptar el rol de **experto en marketing digital SEO/SEM con conocimiento profundo de ciberseguridad**.
Entregar **siempre los cuatro, en este orden**, con el conteo real de caracteres:

1. **Title SEO** (`titleSeo`) — **máximo 47 caracteres** (con espacios). Incluye al menos una keyword.
2. **Metadescripción** (`descriptionSeo`) — **máximo 160 caracteres**: keyword principal, beneficio/hook y,
   si encaja, CTA suave.
3. **Subtítulo** (`subtitle`) — alineado con el **título principal** (no con el Title SEO); humano, no SEO.
4. **Descripción corta** (`description`) — 1-2 frases, tono editorial.

Validar el conteo antes de entregar; si se pasa, reescribir. Formato:

```
Title SEO (43/47): SOC vs MDR: qué elegir en ciberseguridad
Metadescripción (152/160): Descubre cuándo conviene un SOC interno o un MDR gestionado 24/7…
Subtítulo: Cuándo externalizar tu centro de operaciones de seguridad
Descripción corta: Comparativa práctica entre SOC y MDR…
```

Keywords de referencia: ciberseguridad industrial, OT/IoT, NDR, SentryN3t, NIS2, ENS, IEC 62443,
convergencia IT/OT, SOC, MDR, SIEM, XDR, detección de amenazas, Ewala IT Services. Reutilizar las
categorías existentes (`nis2`, `ot-iot`, `mssp`, `idi`) y tags ya usados antes de crear nuevos (justificar
si se propone uno nuevo).

## i18n

- Implementación propia en `i18n/` (sin `next-intl`). Server Components leen su slice de `Messages`; islas
  cliente usan `useTranslations('namespace')` → `t('clave')` / `t.raw('clave')`.
- `t()` solo resuelve claves **planas**: `t('social.linkedin')` no funciona; usar `t.raw('social')`.
- **Simetría ES/EN**: `en.json` debe tener exactamente las mismas claves que `es.json` (TypeScript no lo
  comprueba). Todo texto visible sale de `messages/*.json`, nunca escrito en componentes.
- No importar `i18n/config` en componentes cliente (arrastra los diccionarios al bundle).

## Páginas legales y PDFs

- Textos en `messages/{es,en}.json` → `legal.{common,notice,privacy,cookies}` como bloques tipados; los
  pinta `legal-document.tsx` (sin `dangerouslySetInnerHTML`). Actualizar `updated` (ES y EN) al cambiar un
  texto y pasar por asesoría antes de publicar cambios sustanciales.
- Los 6 PDFs institucionales están en `public/` con su **nombre original** (es su URL pública desde la web
  antigua): no renombrarlos. Se enlazan desde la columna «Políticas» del footer (`footer.sections`).

## Estilos y convenciones

- Tailwind v4 configurado en `app/globals.css` (no hay `tailwind.config.js`). Paleta: verde `#00e58d`
  (`--primary`), gris `#2f2f2f` (`bg-section-dark`). Diseño oscuro forzado. `styles/globals.css` no se usa.
- Fuentes: `font-sans` Noto Sans, `font-mono` Space Mono (`app/fonts.ts`).
- Alias `@/*` → raíz. Named exports en secciones. Server Components por defecto; `"use client"` solo si
  hace falta estado/efectos.
- Imágenes con `next/image` y `width`/`height` reales.
- Interruptor de demo: `NEXT_PUBLIC_SHOW_DEMO_CTA=true` (por defecto oculto; se incrusta en build).

## Idioma

Todo el contenido de usuario, los comentarios de código y los mensajes de commit en **español**.
