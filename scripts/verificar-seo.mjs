#!/usr/bin/env node
/**
 * Auditoría SEO del sitio exportado (out/). Una fila por página HTML con los atributos clave y
 * los problemas detectados. Sale con código 1 si hay problemas en alguna página indexable.
 *
 * Uso: pnpm build && pnpm verify:seo        (o: node scripts/verificar-seo.mjs [carpeta])
 *
 * Comprueba: lang, title (≤ 60), meta description (70-160), un único <h1>, JSON-LD válido, <img>
 * con alt y, en páginas indexables, canonical, hreflang con x-default, Open Graph, Twitter y manifest.
 * La raíz (out/index.html) se ignora: es un respaldo que Netlify nunca sirve (301 → /es/).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
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

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const meta = (h, attr, key) => {
  const m = h.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))
  return m ? decode(m[1]) : ''
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

console.table(rows)
console.log(`Páginas: ${rows.length} · problemas en páginas indexables: ${problems}`)
process.exit(problems > 0 ? 1 : 0)
