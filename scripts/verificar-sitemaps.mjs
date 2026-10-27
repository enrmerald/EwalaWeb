#!/usr/bin/env node
/**
 * Auditoría de los sitemaps y de robots.txt del sitio exportado (out/). Sale con código 1 si hay problemas.
 *
 * Uso: pnpm build && pnpm verify:sitemap        (o: node --no-warnings scripts/verificar-sitemaps.mjs [carpeta])
 *
 * Comprueba, sobre `sitemap-google.xml` (mínimo) y `sitemap.xml` (completo):
 *  - Que existen, son XML bien formados (etiquetas cerradas, `&` escapados, sin BOM) y respetan los
 *    límites del protocolo (50.000 URL, 50 MiB).
 *  - Cada <loc>: host canónico, barra final, sin bloquear por robots.txt, con su index.html en out/,
 *    sin noindex y con canonical igual a la propia <loc>.
 *  - Completitud: toda página indexable de out/ está en el sitemap (y ninguna noindex).
 *  - Que ambos sitemaps contienen exactamente las mismas URL y el mismo lastmod.
 *  - Que el de Google es mínimo: sin xhtml:link, priority, changefreq ni image.
 *  - hreflang del sitemap completo: recíproco, con x-default y con los mismos enlaces que el hreflang
 *    del HTML de cada página. Las imágenes (image:loc) existen en out/.
 *  - lastmod con fecha real AAAA-MM-DD y no futura.
 *  - robots.txt: referencia ambos sitemaps con el host canónico (o, en un build de preview, está
 *    cerrado y no referencia ninguno).
 * Con `CONTEXT` distinto de `production` (previews de Netlify) no se exigen el noindex ausente, el
 * robots abierto ni la completitud: allí todo está cerrado a propósito.
 *
 * Sin dependencias: el XML lo genera scripts/generar-sitemaps.mjs con un formato fijo, así que bastan
 * expresiones regulares acotadas (como en verificar-seo.mjs). Se ejecuta con `--no-warnings` porque
 * importa lib/site.ts directamente (type stripping de Node 24).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { IS_PRODUCTION_DEPLOY, SITE_URL } from '../lib/site.ts'

const out = process.argv[2] ?? 'out'
const ORIGIN = new URL(SITE_URL).origin
const MAX_URLS = 50_000
const MAX_BYTES = 50 * 1024 * 1024
const GOOGLE = 'sitemap-google.xml'
const FULL = 'sitemap.xml'

const problems = []
const fail = (where, message) => problems.push(`[${where}] ${message}`)

// `&amp;` va el ÚLTIMO: si fuera el primero, `&amp;lt;` se desescaparía dos veces y acabaría en `<`.
const decode = (s) =>
  s.replace(/&apos;|&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : null)
const today = new Date().toISOString().slice(0, 10)
const isRealDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v

/** Bien formado: etiquetas anidadas y cerradas, y ningún `&` sin escapar. Devuelve el problema o null. */
function malformed(xml) {
  if (xml.charCodeAt(0) === 0xfeff) return 'empieza con BOM'
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) return 'falta la declaración XML UTF-8'
  if (/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-f]+;)/i.test(xml)) return 'hay un «&» sin escapar'
  const stack = []
  for (const m of xml.matchAll(/<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g)) {
    if (m[3]) continue
    if (!m[1]) stack.push(m[2])
    else if (stack.pop() !== m[2]) return `etiqueta de cierre inesperada </${m[2]}>`
  }
  return stack.length ? `etiquetas sin cerrar: ${stack.join(', ')}` : null
}

/** @returns {{ loc: string, lastmod: string, links: [string, string][], images: string[], xml: string }[]} */
function parseUrls(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: decode(block.match(/<loc>([^<]*)<\/loc>/)?.[1] ?? ''),
    lastmod: block.match(/<lastmod>([^<]*)<\/lastmod>/)?.[1] ?? '',
    links: [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]*)" \/>/g)].map((m) => [
      m[1],
      decode(m[2]),
    ]),
    images: [...block.matchAll(/<image:loc>([^<]*)<\/image:loc>/g)].map((m) => decode(m[1])),
    xml: block,
  }))
}

/** Metadatos del HTML exportado de una URL del sitemap (null si no existe el fichero). */
function pageInfo(loc) {
  const file = join(out, new URL(loc).pathname, 'index.html')
  const html = read(file)
  if (html === null) return null
  const robots = html.match(/<meta name="robots" content="([^"]*)"/g) ?? []
  return {
    noindex: robots.some((m) => /noindex/.test(m)),
    canonical: decode(html.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? ''),
    alternates: [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)].map(
      (m) => `${m[1]}|${decode(m[2])}`,
    ),
  }
}

// ── robots.txt ────────────────────────────────────────────────────────────────────────────────────
const robotsTxt = read(join(out, 'robots.txt'))
const disallows = []
const robotsSitemaps = []
if (robotsTxt === null) fail('robots.txt', 'no existe en out/')
else {
  for (const line of robotsTxt.split(/\r?\n/)) {
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    if (/^disallow$/i.test(key.trim()) && value) disallows.push(value)
    if (/^sitemap$/i.test(key.trim())) robotsSitemaps.push(value)
  }
  const expected = [`${ORIGIN}/${GOOGLE}`, `${ORIGIN}/${FULL}`]
  if (IS_PRODUCTION_DEPLOY) {
    for (const url of expected) if (!robotsSitemaps.includes(url)) fail('robots.txt', `falta «Sitemap: ${url}»`)
    for (const url of robotsSitemaps)
      if (!expected.includes(url)) fail('robots.txt', `«Sitemap: ${url}» no es ninguno de los sitemaps esperados (host ${ORIGIN})`)
    if (disallows.includes('/')) fail('robots.txt', 'bloquea todo el sitio («Disallow: /») en un build de producción')
  } else {
    // Preview de Netlify: cerrado a todos los robots y sin sitemaps (así lo genera app/robots.ts).
    if (!disallows.includes('/')) fail('robots.txt', 'un build que no es de producción debe cerrar el sitio («Disallow: /»)')
    if (robotsSitemaps.length) fail('robots.txt', 'un build que no es de producción no debe referenciar sitemaps')
  }
}

// ── Sitemaps ──────────────────────────────────────────────────────────────────────────────────────
/** @type {Record<string, ReturnType<typeof parseUrls>>} */
const sitemaps = {}
for (const name of [GOOGLE, FULL]) {
  const file = join(out, name)
  const xml = read(file)
  if (xml === null) {
    fail(name, `no existe en ${out}/ (¿se ejecutó pnpm build? lo genera scripts/generar-sitemaps.mjs)`)
    continue
  }
  const bytes = statSync(file).size
  if (bytes > MAX_BYTES) fail(name, `pesa ${bytes} B (máximo ${MAX_BYTES})`)
  const bad = malformed(xml)
  if (bad) {
    fail(name, `XML mal formado: ${bad}`)
    continue
  }
  if (!/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml))
    fail(name, 'el elemento raíz no es <urlset> del espacio de nombres sitemaps.org')
  const urls = parseUrls(xml)
  if (urls.length === 0) fail(name, 'no contiene ninguna <url>')
  if (urls.length > MAX_URLS) fail(name, `${urls.length} URL (máximo ${MAX_URLS})`)
  // `<image:loc>` no casa con `<loc>`: cada <url> debe aportar exactamente un <loc>.
  if (urls.length !== (xml.match(/<loc>/g) ?? []).length) fail(name, 'hay <loc> fuera de una <url> o <url> sin <loc>')
  sitemaps[name] = urls

  const seen = new Set()
  for (const u of urls) {
    const where = `${name} ${u.loc || '(sin loc)'}`
    if (!u.loc) {
      fail(name, 'una <url> no tiene <loc>')
      continue
    }
    if (seen.has(u.loc)) fail(where, '<loc> duplicada')
    seen.add(u.loc)
    if (!u.loc.startsWith(`${ORIGIN}/`)) fail(where, `no empieza por el host canónico ${ORIGIN}/`)
    if (!u.loc.endsWith('/')) fail(where, 'no termina en barra final (trailingSlash: true)')
    const path = new URL(u.loc).pathname
    // En un build de preview el cierre total y el noindex son intencionados: solo se exigen en producción.
    const blocked = IS_PRODUCTION_DEPLOY && disallows.find((d) => path.startsWith(d))
    if (blocked) fail(where, `robots.txt la bloquea (Disallow: ${blocked})`)
    if (!u.lastmod) fail(where, 'sin <lastmod>')
    else if (!isRealDate(u.lastmod)) fail(where, `lastmod «${u.lastmod}» no es una fecha real AAAA-MM-DD`)
    else if (u.lastmod > today) fail(where, `lastmod «${u.lastmod}» es futuro`)

    const page = pageInfo(u.loc)
    if (!page) fail(where, `no existe ${join(out, path, 'index.html')}`)
    else {
      if (page.noindex && IS_PRODUCTION_DEPLOY) fail(where, 'la página tiene noindex y no debe estar en el sitemap')
      if (page.canonical !== u.loc) fail(where, `canonical «${page.canonical}» distinto de la <loc>`)
    }
  }
}

const google = sitemaps[GOOGLE]
const full = sitemaps[FULL]

// Sitemap de Google: mínimo.
if (google) {
  const xml = read(join(out, GOOGLE))
  for (const tag of ['xhtml:link', 'priority', 'changefreq', 'image:image'])
    if (xml.includes(`<${tag}`)) fail(GOOGLE, `debe ser mínimo y contiene <${tag}`)
}

// Sitemap completo: hreflang e imágenes.
if (full) {
  const byLoc = new Map(full.map((u) => [u.loc, u]))
  for (const u of full) {
    const where = `${FULL} ${u.loc}`
    const xml = u.xml
    if (!/<changefreq>[a-z]+<\/changefreq>/.test(xml)) fail(where, 'sin <changefreq>')
    const priority = Number(xml.match(/<priority>([^<]*)<\/priority>/)?.[1])
    if (!(priority >= 0 && priority <= 1)) fail(where, 'priority ausente o fuera de 0.0–1.0')
    if (!u.links.some(([l]) => l === 'x-default')) fail(where, 'sin hreflang x-default')
    // Reciprocidad y autorreferencia se miden solo con enlaces de idioma: un `x-default` que apunta a
    // la misma URL no cuenta como enlace de vuelta.
    const linksTo = (url, loc) => url.links.some(([lang, h]) => lang !== 'x-default' && h === loc)
    if (!linksTo(u, u.loc)) fail(where, 'su hreflang no se incluye a sí misma')
    for (const [lang, href] of u.links) {
      const target = byLoc.get(href)
      if (!target) fail(where, `hreflang ${lang} apunta a ${href}, que no está en el sitemap`)
      else if (lang !== 'x-default' && !linksTo(target, u.loc))
        fail(where, `hreflang ${lang} no es recíproco: ${href} no enlaza de vuelta`)
    }
    // Lo que dice el sitemap tiene que coincidir con lo que dice la propia página.
    const page = pageInfo(u.loc)
    if (page) {
      const fromSitemap = u.links.map(([l, h]) => `${l}|${h}`).sort().join(' ')
      const fromHtml = [...page.alternates].sort().join(' ')
      if (fromSitemap !== fromHtml) fail(where, `hreflang distinto del HTML\n      sitemap: ${fromSitemap}\n      html:    ${fromHtml}`)
    }
    for (const image of u.images) {
      if (!image.startsWith(`${ORIGIN}/`)) fail(where, `image:loc fuera del host canónico: ${image}`)
      else if (!existsSync(join(out, decodeURIComponent(new URL(image).pathname)))) fail(where, `image:loc no existe en ${out}/: ${image}`)
    }
  }
}

// Mismas URL y mismo lastmod en los dos.
if (google && full) {
  const g = new Map(google.map((u) => [u.loc, u.lastmod]))
  const f = new Map(full.map((u) => [u.loc, u.lastmod]))
  for (const loc of g.keys()) if (!f.has(loc)) fail(GOOGLE, `${loc} no está en ${FULL}`)
  for (const loc of f.keys()) if (!g.has(loc)) fail(FULL, `${loc} no está en ${GOOGLE}`)
  for (const [loc, lastmod] of g) if (f.has(loc) && f.get(loc) !== lastmod) fail(loc, `lastmod distinto: ${GOOGLE}=${lastmod} ${FULL}=${f.get(loc)}`)
}

// Completitud: toda página indexable exportada debe estar en el sitemap.
const IGNORED = new Set(['index.html', '404.html', '410.html', '404/index.html', '_not-found/index.html'])
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const inSitemap = new Set((full ?? google ?? []).map((u) => u.loc))
if (IS_PRODUCTION_DEPLOY && (full ?? google) && existsSync(out)) {
  for (const file of walk(out)) {
    const rel = relative(out, file).split(sep).join('/')
    if (!rel.endsWith('.html') || rel.startsWith('_next/') || IGNORED.has(rel)) continue
    const html = readFileSync(file, 'utf8')
    const noindex = (html.match(/<meta name="robots" content="([^"]*)"/g) ?? []).some((m) => /noindex/.test(m))
    if (noindex) continue
    const loc = `${ORIGIN}/${rel.replace(/index\.html$/, '')}`
    if (!inSitemap.has(loc)) fail('completitud', `${loc} es indexable pero no está en el sitemap`)
  }
}

// ── Resultado ─────────────────────────────────────────────────────────────────────────────────────
for (const [name, urls] of Object.entries(sitemaps)) console.log(`${name}: ${urls.length} URL`)
console.log(`robots.txt: ${robotsSitemaps.length} Sitemap, ${disallows.length} Disallow · host ${ORIGIN}`)
if (problems.length) {
  console.error(`\nProblemas en sitemaps: ${problems.length}\n` + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log('Sitemaps · 0 problemas')
