// Comprueba el saneado del Markdown del blog (scripts/lib/blog-markdown.mjs): ningún enlace ni imagen
// puede acabar siendo `javascript:`/`data:`/otro host, ni escrito a pelo ni con entidades HTML, y los
// enlaces legítimos siguen funcionando. El cuerpo se inyecta con dangerouslySetInnerHTML, así que una
// regresión aquí es un XSS almacenado.
//
// Uso: node scripts/verificar-saneado-blog.mjs   (pnpm verify:blog)

import { renderMarkdown } from './lib/blog-markdown.mjs'

/** Entidades numéricas y las más usadas con nombre, decodificadas como hace el navegador en un atributo. */
const NAMED = { colon: ':', tab: '\t', newline: '\n', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)

/** URLs que el navegador vería en los atributos href/src del HTML (tras decodificar entidades). */
function urlsOf(html) {
  const out = []
  for (const m of html.matchAll(/\b(?:href|src)\s*=\s*"([^"]*)"/gi)) out.push(decodeEntities(m[1]))
  return out
}

/** Esquema efectivo como lo interpreta el navegador: sin espacios ni caracteres de control. */
const schemeOf = (url) =>
  /^([a-z][a-z0-9+.-]*):/i.exec(url.replace(/[\u0000- \u007f-\u009f]/g, ''))?.[1]?.toLowerCase() ?? ''

const ALLOWED_SCHEMES = new Set(['', 'http', 'https', 'mailto'])

// Entradas hostiles: ningún href/src del HTML resultante puede tener un esquema fuera de la lista
// blanca ni ser una URL relativa al protocolo (//host), y ninguna etiqueta o evento en bruto sobrevive.
const HOSTILE = [
  '[x](javascript:alert(1))',
  '[x](JaVaScRiPt:alert(1))',
  '[x](java\tscript:alert(1))',
  '[x](<javascript:alert(1)>)',
  '[x](&#106;avascript:alert(1))',
  '[x](&#x6A;avascript:alert(1))',
  '[x](javascript&colon;alert(1))',
  '[x](&Tab;javascript:alert(1))',
  '[x](java&#9;script:alert(1))',
  '[x](%6Aavascript:alert(1))',
  '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  '[x](vbscript:msgbox(1))',
  '[x](//evil.example/)',
  '![i](javascript:alert(1))',
  '![i](&#106;avascript:alert(1))',
  '![i](data:image/svg+xml,<svg onload=alert(1)>)',
  '[ref]\n\n[ref]: &#106;avascript:alert(1)',
  '[ref]\n\n[ref]: javascript:alert(1)',
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
]

// Entradas legítimas: el HTML debe contener exactamente lo indicado.
const LEGIT = [
  ['[c](/es/contacto/)', '<a href="/es/contacto/">c</a>'],
  ['[c](/es/#showcase)', '<a href="/es/#showcase">c</a>'],
  ['[c](#seccion)', '<a href="#seccion">c</a>'],
  ['[c](https://example.com/?a=1&b=2)', 'href="https://example.com/?a=1&amp;b=2"'],
  ['[c](mailto:info@ewala.es)', '<a href="mailto:info@ewala.es">c</a>'],
  ['<https://example.com/>', 'href="https://example.com/"'],
  ['![logo](/ndr.webp)', '<img src="/ndr.webp" alt="logo">'],
]

const failures = []

for (const md of HOSTILE) {
  const { html } = renderMarkdown(md)
  for (const url of urlsOf(html)) {
    if (!ALLOWED_SCHEMES.has(schemeOf(url)) || url.replace(/[\u0000- \u007f-\u009f]/g, '').startsWith('//')) {
      failures.push(`URL peligrosa en el HTML de ${JSON.stringify(md)} → ${JSON.stringify(url)}`)
    }
  }
  if (/<(script|img|svg|iframe)\b/i.test(html.replace(/<img [^>]*\bsrc="[^"]*"[^>]*>/gi, ''))) {
    failures.push(`Etiqueta en bruto sin escapar en el HTML de ${JSON.stringify(md)} → ${JSON.stringify(html.trim())}`)
  }
}

for (const [md, expected] of LEGIT) {
  const { html } = renderMarkdown(md)
  if (!html.includes(expected)) {
    failures.push(`Enlace legítimo alterado: ${JSON.stringify(md)} → ${JSON.stringify(html.trim())} (esperaba ${JSON.stringify(expected)})`)
  }
}

if (failures.length > 0) {
  console.error(`[verify:blog] FALLO (${failures.length}):`)
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`[verify:blog] OK (${HOSTILE.length} entradas hostiles neutralizadas, ${LEGIT.length} legítimas intactas)`)
