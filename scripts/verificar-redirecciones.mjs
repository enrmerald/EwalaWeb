#!/usr/bin/env node
/**
 * Comprueba que ninguna URL de la web antigua da 404 y que las rutas nuevas responden 200.
 * Sigue cada redirección hasta el final y cuenta los saltos (más de uno es un problema de SEO).
 *
 * Uso:
 *   Local (aplica netlify.toml):  pnpm build
 *                                 pnpm dlx --package=netlify-cli netlify dev --dir out --offline
 *                                 pnpm verify:redirects                       (http://localhost:8888)
 *   Preview o producción:         pnpm verify:redirects https://ewala.es
 *
 * El inventario de URLs antiguas sale de la rama backup-web-antigua (sitemap.xml, HTML de la raíz y
 * carpetas de posts de Hugo). Requiere `git fetch` previo si la rama no está en local.
 */
import { execSync } from 'node:child_process'

const base = (process.argv[2] ?? 'http://localhost:8888').replace(/\/$/, '')
const backup = process.env.BACKUP_REF ?? 'origin/backup-web-antigua'
const git = (cmd) => execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })

// ── Casos: ruta → estados finales aceptados ────────────────────────────────────────────────────
const LEGACY_OK = [200, 410] // una URL antigua puede acabar en contenido (200 tras 301) o retirada (410)
const cases = new Map()
const add = (path, expected) => cases.set(path, expected)

try {
  const sitemap = git(`show ${backup}:sitemap.xml`)
  for (const m of sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const path = new URL(m[1]).pathname || '/'
    add(path, path === '/404' ? [404] : LEGACY_OK)
  }
  for (const file of git(`ls-tree --name-only ${backup}`).split('\n').filter((f) => f.endsWith('.html'))) {
    const expected = file === '404.html' ? [404] : LEGACY_OK
    add(`/${file}`, expected)
    add(`/${file.replace(/\.html$/, '')}`, expected)
  }
  for (const dir of git(`ls-tree -d --name-only ${backup}:build/docs/posts`).split('\n').filter(Boolean)) {
    add(`/blog/posts/${dir}/`, LEGACY_OK)
  }
} catch {
  console.warn(`⚠️  No se pudo leer ${backup}: solo se comprueban los casos fijos (haz git fetch).`)
}

// Casos fijos: taxonomías y restos del blog, ficheros internos antiguos y rutas nuevas.
for (const p of ['/blog/tags/soc/', '/blog/categories/ciberseguridad/', '/blog/page/2/', '/blog/admin/', '/blog/index.xml',
  '/assets/img/favicon.png', '/particles/particles.js', '/docs/README.md', '/README.md', '/CLAUDE.md']) add(p, [410])
for (const p of ['/es/', '/en/', '/es/blog/', '/en/blog/', '/es/compania/', '/es/contacto/', '/en/contacto/', '/es/privacidad/',
  '/es/aviso-legal/', '/es/cookies/', '/sitemap.xml', '/robots.txt', '/favicon/favicon.ico', '/es/opengraph-image', '/gtm.js',
  '/COE-0001-02-CODIGO_ETICO.pdf']) add(p, [200])
add('/no-existe-esta-ruta/', [404])

// ── Ejecución ──────────────────────────────────────────────────────────────────────────────────
const results = []
for (const [path, expected] of cases) {
  let url = base + path
  let hops = 0
  let status = 0
  const chain = []
  for (;;) {
    const res = await fetch(url, { redirect: 'manual' }).catch(() => null)
    // Consumir siempre el cuerpo: si no, Node (undici) puede abortar cuando el servidor cierra la conexión.
    await res?.arrayBuffer().catch(() => null)
    status = res?.status ?? 0
    const location = res?.headers.get('location')
    if (status >= 300 && status < 400 && location && hops < 5) {
      hops++
      url = new URL(location, url).href
      chain.push(url.replace(base, ''))
      continue
    }
    break
  }
  const ok = expected.includes(status) && hops <= 1
  results.push({ ok: ok ? 'OK' : 'XX', ruta: path, final: status, saltos: hops, destino: chain.join(' → ') })
}

const failed = results.filter((r) => r.ok !== 'OK')
console.table(failed.length ? failed : results)
const byStatus = Object.groupBy ? Object.groupBy(results, (r) => r.final) : {}
console.log(`Base: ${base} · URLs: ${results.length} · por estado: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v.length}`).join(', ')}`)
console.log(failed.length ? `❌ ${failed.length} fallo(s)` : '✅ Todas las URLs responden como se espera (≤ 1 salto)')
process.exit(failed.length ? 1 : 0)
