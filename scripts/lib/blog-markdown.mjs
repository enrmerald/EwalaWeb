// Conversión Markdown -> HTML del blog con saneado. Vive aparte de build-blog-content.mjs para poder
// probarlo (scripts/verificar-saneado-blog.mjs) sin ejecutar el build completo.

import { marked } from 'marked'

export function slugify(text) {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

/** Texto plano de los tokens inline de un encabezado (sin marcado, HTML en bruto ni entidades). */
const plainTextOf = (tokens) =>
  tokens.map((t) => (t.type === 'html' ? '' : t.tokens ? plainTextOf(t.tokens) : (t.text ?? ''))).join('')

export const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/**
 * ¿Es seguro enlazar/cargar este destino? Solo http(s), mailto (enlaces) y rutas del propio sitio o
 * relativas. Rechaza `javascript:`, `data:`, `vbscript:`… y `//otro-host`. Antes de mirar el esquema se
 * quitan espacios y caracteres de control (`java\tscript:` lo interpretan los navegadores como
 * `javascript:`).
 *
 * El navegador decodifica las entidades HTML del atributo ANTES de leer la URL (`&#106;avascript:` es
 * `javascript:`), pero aquí el esquema se mira sobre el texto escrito. Sin una tabla de entidades
 * (incompleta por definición), se rechaza cualquier `&` en el tramo donde viviría el esquema, antes del
 * primer `/`, `?` o `#`: ningún enlace legítimo lo lleva. La defensa principal es `escapeAmpersands`.
 */
export function isSafeUrl(href, { allowMailto }) {
  const url = String(href).replace(/[\u0000- \u007f-\u009f]/g, '')
  if (url === '' || url.startsWith('//')) return false
  if (/^[^/?#]*&/.test(url)) return false
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase()
  if (!scheme) return true // ruta relativa, absoluta del sitio o ancla (#…)
  return scheme === 'https' || scheme === 'http' || (allowMailto && scheme === 'mailto')
}

/**
 * marked no escapa el `&` del `href`/`src` de los enlaces explícitos: `&#106;avascript:` llegaba tal cual
 * al HTML y el navegador lo leía como `javascript:`. Con `&amp;` el navegador decodifica a texto literal
 * (`&#106;avascript:`, una ruta relativa inerte) y las entidades dejan de poder formar un esquema.
 */
const escapeAmpersands = (token) => ({ ...token, href: token.href.replace(/&/g, '&amp;') })

/**
 * Renderiza Markdown -> HTML añadiendo `id` slugificado a cada heading (para anclas de TOC),
 * evitando colisiones de id dentro del mismo artículo.
 *
 * Seguridad: el HTML resultante se inyecta con dangerouslySetInnerHTML (components/ewala/blog-articulo.tsx).
 * Hoy el Markdown lo escribe el equipo, pero basta una contribución externa para convertirlo en XSS
 * almacenado en ewala.es, así que aquí se bloquea: el HTML en bruto se escapa (se ve como texto, para
 * que quien escribe lo note) y los enlaces/imágenes con esquemas peligrosos se reducen a su texto.
 */
export function renderMarkdown(markdown) {
  const renderer = new marked.Renderer()
  const seenIds = new Map()
  const headings = [] // `##` del artículo, para el índice (TOC): { id, text }
  const base = new marked.Renderer()

  renderer.html = ({ text }) => escapeHtml(text)

  renderer.link = function link(token) {
    if (!isSafeUrl(token.href, { allowMailto: true })) return this.parser.parseInline(token.tokens)
    const out = base.link.call(this, escapeAmpersands(token))
    // Enlaces a otros sitios: sin acceso a window.opener ni Referer completo.
    return /^https?:/i.test(token.href.trim()) ? out.replace('<a ', '<a rel="noopener noreferrer" ') : out
  }

  renderer.image = function image(token) {
    if (!isSafeUrl(token.href, { allowMailto: false })) return escapeHtml(token.text)
    return base.image.call(this, escapeAmpersands(token))
  }

  renderer.heading = function heading({ tokens, depth }) {
    const html = this.parser.parseInline(tokens)
    // Texto plano sacado de los tokens, no quitando etiquetas del HTML: sin entidades (`&#39;`) en el
    // índice ni en el id, y sin depender de una expresión regular sobre HTML.
    const text = plainTextOf(tokens).replace(/\s+/g, ' ').trim()
    let id = slugify(text)
    const count = seenIds.get(id) ?? 0
    seenIds.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`
    if (depth === 2) headings.push({ id, text })
    return `<h${depth} id="${id}">${html}</h${depth}>\n`
  }

  return { html: marked.parse(markdown, { renderer }), headings }
}
