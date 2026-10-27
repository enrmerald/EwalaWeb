#!/usr/bin/env node
/**
 * Auditoría SEO del sitio exportado (out/). Una fila por página HTML con los atributos clave y
 * los problemas detectados. Sale con código 1 si hay problemas en alguna página indexable.
 *
 * Uso: pnpm build && pnpm verify:seo        (o: node scripts/verificar-seo.mjs [carpeta])
 *
 * Comprueba: lang, title (≤ 60), meta description (70-160), un único <h1>, JSON-LD válido, <img>
 * con alt y, en páginas indexables, canonical, hreflang con x-default, Open Graph, Twitter y manifest.
 * También que toda URL interna lleve barra final (`trailingSlash: true`): sin ella cada clic cuesta un
 * 301 de Netlify y, en la home, un ancla recarga la página en vez de desplazarse. Se mira el HTML
 * exportado y, además, el código fuente (app/, components/, lib/, i18n/): los menús desplegables y el
 * móvil no se renderizan en el HTML, así que ahí un enlace mal escrito solo se ve en el fuente.
 * La raíz (out/index.html) se ignora: es un respaldo que Netlify nunca sirve (301 → /es/).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const out = process.argv[2] ?? 'out'
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
const pages = walk(out).filter(
  (f) => f.endsWith('.html') && !f.includes(`${sep}_next${sep}`) && !f.endsWith('410.html') && relative(out, f) !== 'index.html',
)

// `&amp;` va el ÚLTIMO: si fuera el primero, `&amp;lt;` se desescaparía dos veces y acabaría en `<`.
const decode = (s) =>
  s.replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const meta = (h, attr, key) => {
  const m = h.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))
  return m ? decode(m[1]) : ''
}

/** ¿Es una ruta interna de página sin barra final? (se ignoran ficheros con extensión y `//host`). */
const missingSlash = (href) => {
  if (!href.startsWith('/') || href.startsWith('//')) return false
  const path = href.split(/[?#]/)[0]
  return !path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)
}

const rows = []
let problems = 0
for (const file of pages) {
  const h = readFileSync(file, 'utf8')
  const route = '/' + relative(out, file).split(sep).join('/').replace(/index\.html$/, '')
  const title = decode(h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
  const desc = meta(h, 'name', 'description')
  const noindex = /noindex/.test(meta(h, 'name', 'robots'))
  const canonical = h.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? ''
  const hreflang = [...h.matchAll(/hrefLang="([^"]+)"/g)].map((m) => m[1])
  const lang = h.match(/<html[^>]*\blang="([^"]+)"/)?.[1] ?? ''
  const h1 = (h.match(/<h1[\s>]/g) ?? []).length
  const ldTypes = []
  let ldInvalid = 0
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      ldTypes.push(JSON.parse(m[1])['@type'])
    } catch {
      ldInvalid++
    }
  }
  const imgsNoAlt = [...h.matchAll(/<img\b[^>]*>/g)].filter((m) => !/\balt="/.test(m[0])).length

  const issues = []
  if (!lang) issues.push('sin lang')
  if (!title) issues.push('sin title')
  if (title.length > 60) issues.push(`title ${title.length}c`)
  if (!desc) issues.push('sin description')
  else if (desc.length > 160 || desc.length < 70) issues.push(`description ${desc.length}c`)
  if (h1 !== 1) issues.push(`${h1} h1`)
  if (ldInvalid) issues.push(`${ldInvalid} JSON-LD inválido`)
  if (imgsNoAlt) issues.push(`${imgsNoAlt} img sin alt`)
  const noSlash = [...new Set([...h.matchAll(/\bhref="([^"]*)"/g)].map((m) => decode(m[1])).filter(missingSlash))]
  if (noSlash.length) issues.push(`enlaces sin barra final: ${noSlash.slice(0, 3).join(' ')}`)
  if (!noindex) {
    if (!canonical) issues.push('sin canonical')
    if (!hreflang.includes('x-default')) issues.push('sin x-default')
    if (!meta(h, 'property', 'og:title') || !meta(h, 'property', 'og:image') || !meta(h, 'property', 'og:url'))
      issues.push('Open Graph incompleto')
    if (meta(h, 'name', 'twitter:card') !== 'summary_large_image' || !meta(h, 'name', 'twitter:image'))
      issues.push('Twitter incompleto')
    if (!/rel="manifest"/.test(h)) issues.push('sin manifest')
    problems += issues.length
  }
  rows.push({
    ruta: route,
    lang,
    title: title.length,
    desc: desc.length,
    h1,
    index: noindex ? 'no' : 'sí',
    jsonld: ldTypes.join('+'),
    problemas: issues.join('; ') || 'OK',
  })
}

// ── Código fuente: rutas internas con prefijo de idioma sin barra final ────────────────────────────
// Literales como `/${locale}#sectors` o `/${locale}/contacto`. Se omiten las líneas que ya pasan por
// withTrailingSlash() (lib/jsonld.ts) y components/ui (shadcn).
const SOURCE_DIRS = ['app', 'components', 'lib', 'i18n']
const SOURCE_RX = /[`"'](\/(?:\$\{[A-Za-z.]+\}|es|en)(?:\/[^`"'?#\s]*)?)(?=[?#`"'])/g
const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? ['ui', 'node_modules'].includes(e.name)
        ? []
        : sourceFiles(join(dir, e.name))
      : /\.(tsx?|mjs)$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  )
const sourceHits = []
for (const dir of SOURCE_DIRS.filter((d) => existsSync(d))) {
  for (const file of sourceFiles(dir)) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (line.includes('withTrailingSlash(')) return
        for (const m of line.matchAll(SOURCE_RX))
          if (!m[1].endsWith('/')) sourceHits.push(`${file.split(sep).join('/')}:${i + 1}  ${m[1]}`)
      })
  }
}
if (sourceHits.length) {
  console.log('\nRutas internas sin barra final en el código (añade «/» antes de ?, # o del cierre):')
  for (const hit of sourceHits) console.log(`  ✘ ${hit}`)
  problems += sourceHits.length
}

console.table(rows)
console.log(`Páginas: ${rows.length} · problemas en páginas indexables: ${problems}`)
process.exit(problems > 0 ? 1 : 0)
