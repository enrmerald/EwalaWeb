#!/usr/bin/env node
/**
 * Genera los dos sitemaps del sitio en `public/` (Next los copia tal cual a `out/`):
 *
 *  - `sitemap-google.xml`: mínimo (`loc` + `lastmod`). Es el que se envía a Search Console: Google ya
 *    lee el hreflang del <link rel="alternate"> de cada página e ignora `priority` y `changefreq`.
 *  - `sitemap.xml`: completo (`lastmod`, `changefreq`, `priority`, hreflang `xhtml:link` e
 *    `image:image`) para Bing, Yandex y herramientas SEO. Se conserva la URL ya publicada.
 *
 * Se ejecuta en `predev`/`prebuild`, después de `content:build` (necesita `src/generated/blog.json`).
 * Es un script de build, no código de servidor: no rompe la regla de «Next sin servidor».
 *
 * Fuentes únicas (no se repiten aquí): `i18n/config.ts` (idiomas, páginas, `localizedPath`),
 * `lib/site.ts` (`SITE_URL`) y `lib/sitemap-data.mjs` (lastmod, changefreq y priority por página).
 * Node 24 importa los .ts directamente (type stripping); por eso se ejecuta con `--no-warnings`
 * (package.json), para silenciar el aviso de módulo sin tipo del `package.json`.
 *
 * Falla (código 1) si: las claves de `SITEMAP_PAGES` no coinciden con `PAGES`, falta `blog.json`, una
 * fecha no es una fecha real `AAAA-MM-DD` o es futura, hay `<loc>` duplicadas o no sale ninguna URL.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defaultLocale, locales, localizedPath, PAGES } from '../i18n/config.ts'
import { SITE_URL as RAW_SITE_URL } from '../lib/site.ts'
import { SITEMAP_PAGES, SITEMAP_POST } from '../lib/sitemap-data.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '')
const absolute = (path) => `${SITE_URL}${path}`

const errors = []
const fail = (message) => errors.push(message)

/** Fecha real AAAA-MM-DD (rechaza 2026-02-31) y no posterior a hoy (UTC). */
function checkDate(value, origin) {
  const real =
    /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  if (!real) return fail(`${origin}: «${value}» no es una fecha real AAAA-MM-DD`)
  if (value > new Date().toISOString().slice(0, 10)) fail(`${origin}: «${value}» es una fecha futura`)
}

// --- Datos de entrada ---------------------------------------------------------------------------

const missing = PAGES.filter((p) => !(p in SITEMAP_PAGES))
const extra = Object.keys(SITEMAP_PAGES).filter((p) => !PAGES.includes(p))
if (missing.length) fail(`lib/sitemap-data.mjs: faltan páginas de PAGES: ${missing.join(', ')}`)
if (extra.length) fail(`lib/sitemap-data.mjs: páginas que no están en PAGES: ${extra.join(', ')}`)

const blogPath = join(root, 'src', 'generated', 'blog.json')
if (!existsSync(blogPath)) {
  console.error('[generar-sitemaps] Falta src/generated/blog.json. Ejecuta antes: pnpm content:build')
  process.exit(1)
}
const blog = JSON.parse(readFileSync(blogPath, 'utf8'))
const postsOf = (locale) => blog[locale] ?? []

// `lastmod` del listado del blog: el artículo más reciente de cualquier idioma.
const latestPostDate = locales
  .flatMap((locale) => postsOf(locale).map((post) => post.date))
  .sort()
  .at(-1)

// --- Entradas -----------------------------------------------------------------------------------

/** @type {{ loc: string, lastmod?: string, changefreq: string, priority: number, alternates: [string, string][], image?: string }[]} */
const entries = []

for (const page of PAGES) {
  const meta = SITEMAP_PAGES[page]
  if (!meta) continue
  const lastmod = page === '/blog' ? latestPostDate : meta.lastmod
  if (lastmod) checkDate(lastmod, `lastmod de ${page}`)
  const alternates = [
    ...locales.map((l) => [l, absolute(localizedPath(l, page))]),
    ['x-default', absolute(localizedPath(defaultLocale, page))],
  ]
  for (const locale of locales) {
    entries.push({
      loc: absolute(localizedPath(locale, page)),
      lastmod: lastmod ?? undefined,
      changefreq: meta.changefreq,
      priority: meta.priority,
      alternates,
    })
  }
}

for (const locale of locales) {
  for (const post of postsOf(locale)) {
    checkDate(post.date, `date del artículo ${locale}/${post.slug}`)
    // Solo se anuncian los idiomas donde el artículo existe: una traducción sin publicar sería un 404.
    const available = locales.filter((l) => postsOf(l).some((p) => p.slug === post.slug))
    // Misma regla que app/[locale]/blog/[slug]/page.tsx: x-default → idioma por defecto si existe; si
    // no, el primero disponible. El sitemap tiene que coincidir con el hreflang del propio HTML.
    const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0]
    const alternates = [
      ...available.map((l) => [l, absolute(`/${l}/blog/${post.slug}/`)]),
      ['x-default', absolute(`/${xDefault}/blog/${post.slug}/`)],
    ]
    entries.push({
      loc: absolute(`/${locale}/blog/${post.slug}/`),
      lastmod: post.date,
      ...SITEMAP_POST,
      alternates,
      // Solo imágenes locales (el build de blog ya exige ruta ASCII que exista en public/).
      image: typeof post.image === 'string' && post.image.startsWith('/') ? absolute(post.image) : undefined,
    })
  }
}

const seen = new Set()
for (const { loc } of entries) {
  if (seen.has(loc)) fail(`<loc> duplicada: ${loc}`)
  seen.add(loc)
}
if (entries.length === 0) fail('no hay ninguna URL que incluir en el sitemap')

if (errors.length) {
  console.error('[generar-sitemaps] ERROR:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}

// --- XML ----------------------------------------------------------------------------------------

// `&amp;` va el PRIMERO al escapar (al revés que al decodificar): si fuera después, escaparía dos veces.
const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

const googleXml =
  XML_HEAD +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries
    .map(
      (e) =>
        `<url>\n<loc>${escapeXml(e.loc)}</loc>\n` + (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>\n` : '') + '</url>\n',
    )
    .join('') +
  '</urlset>\n'

const fullXml =
  XML_HEAD +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" ' +
  'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  entries
    .map(
      (e) =>
        `<url>\n<loc>${escapeXml(e.loc)}</loc>\n` +
        (e.lastmod ? `<lastmod>${e.lastmod}</lastmod>\n` : '') +
        `<changefreq>${e.changefreq}</changefreq>\n` +
        `<priority>${e.priority.toFixed(1)}</priority>\n` +
        e.alternates
          .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />\n`)
          .join('') +
        (e.image ? `<image:image>\n<image:loc>${escapeXml(e.image)}</image:loc>\n</image:image>\n` : '') +
        '</url>\n',
    )
    .join('') +
  '</urlset>\n'

const publicDir = join(root, 'public')
mkdirSync(publicDir, { recursive: true })
writeFileSync(join(publicDir, 'sitemap-google.xml'), googleXml, 'utf8')
writeFileSync(join(publicDir, 'sitemap.xml'), fullXml, 'utf8')

console.log(`[generar-sitemaps] OK · ${entries.length} URL en sitemap-google.xml y sitemap.xml (${SITE_URL})`)
