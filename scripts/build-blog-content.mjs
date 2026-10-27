// Script de pipeline de build (NO runtime): lee content/blog/{locale}/*.md, valida el front
// matter con zod, convierte Markdown -> HTML con marked y escribe src/generated/blog.json.
//
// Se ejecuta en Node del pipeline de build (predev/prebuild), nunca en producción — el proyecto
// exporta HTML estático (`output: 'export'`, ver next.config.mjs). src/generated/ no se versiona
// (ver .gitignore); blog.json se regenera en cada instalación/build.
//
// Uso: node scripts/build-blog-content.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'
import { z } from 'zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'blog')
const PUBLIC_DIR = path.join(ROOT, 'public')
const OUT_DIR = path.join(ROOT, 'src', 'generated')
const OUT_FILE = path.join(OUT_DIR, 'blog.json')

const LOCALES = ['es', 'en']
const WORDS_PER_MINUTE = 200

// Enum cerrado de categorías. Ampliar aquí si se añaden nuevas.
const CATEGORIES = ['nis2', 'ot-iot', 'mssp', 'idi']

/** `AAAA-MM-DD` y además una fecha real (rechaza 2026-02-31). El resto del código asume este formato. */
const isRealIsoDate = (value) => {
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/**
 * ¿Existe el fichero en public/ con EXACTAMENTE ese nombre (mayúsculas incluidas)? Netlify sirve desde
 * Linux, donde `/Foto.PNG` y `/foto.png` son ficheros distintos: en Windows una ruta con otra
 * capitalización «funcionaría» en local y daría 404 en producción.
 */
function existsInPublic(urlPath) {
  const parts = urlPath.slice(1).split('/')
  let dir = PUBLIC_DIR
  for (const [i, part] of parts.entries()) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return false
    }
    const entry = part ? entries.find((e) => e.name === part) : undefined
    if (!entry) return false
    if (i < parts.length - 1) {
      if (!entry.isDirectory()) return false
      dir = path.join(dir, part)
    } else if (!entry.isFile()) return false
  }
  return true
}

const frontMatterSchema = z.object({
  title: z.string().min(1, 'title es obligatorio'),
  titleSeo: z.string().min(1, 'titleSeo es obligatorio'),
  subtitle: z.string().optional(),
  description: z.string().min(1, 'description es obligatorio'),
  descriptionSeo: z.string().min(1, 'descriptionSeo es obligatorio'),
  // YAML convierte `date: 2026-10-03` (sin comillas) en un Date: se normaliza a AAAA-MM-DD.
  date: z.preprocess(
    (v) => (v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date debe tener el formato AAAA-MM-DD (p. ej. "2026-10-03")')
      .refine(isRealIsoDate, { message: 'date no es una fecha real del calendario' }),
  ),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()).default([]),
  // Ruta absoluta del sitio, solo ASCII (sin espacios, tildes ni ñ), de un fichero que exista en public/.
  image: z
    .string()
    .regex(
      /^\/[A-Za-z0-9][A-Za-z0-9._/-]*$/,
      'image debe ser una ruta absoluta ASCII, sin espacios ni tildes, p. ej. "/mi-imagen.webp"',
    )
    .refine(existsInPublic, { message: 'image no existe en public/ (¿mayúsculas distintas o falta el fichero?)' })
    .optional(),
  imageAlt: z.string().optional(),
  author: z.string().default('Ewala'),
  draft: z.boolean().optional().default(false),
})

function slugify(text) {
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

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/**
 * ¿Es seguro enlazar/cargar este destino? Solo http(s), mailto (enlaces) y rutas del propio sitio o
 * relativas. Rechaza `javascript:`, `data:`, `vbscript:`… y `//otro-host`. Antes de mirar el esquema se
 * quitan espacios y caracteres de control (`java\tscript:` lo interpretan los navegadores como
 * `javascript:`).
 */
function isSafeUrl(href, { allowMailto }) {
  const url = String(href).replace(/[\u0000- \u007f-\u009f]/g, '')
  if (url === '' || url.startsWith('//')) return false
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)?.[1]?.toLowerCase()
  if (!scheme) return true // ruta relativa, absoluta del sitio o ancla (#…)
  return scheme === 'https' || scheme === 'http' || (allowMailto && scheme === 'mailto')
}

/**
 * Renderiza Markdown -> HTML añadiendo `id` slugificado a cada heading (para anclas de TOC),
 * evitando colisiones de id dentro del mismo artículo.
 *
 * Seguridad: el HTML resultante se inyecta con dangerouslySetInnerHTML (components/ewala/blog-articulo.tsx).
 * Hoy el Markdown lo escribe el equipo, pero basta una contribución externa para convertirlo en XSS
 * almacenado en ewala.es, así que aquí se bloquea: el HTML en bruto se escapa (se ve como texto, para
 * que quien escribe lo note) y los enlaces/imágenes con esquemas peligrosos se reducen a su texto.
 */
function renderMarkdown(markdown) {
  const renderer = new marked.Renderer()
  const seenIds = new Map()
  const headings = [] // `##` del artículo, para el índice (TOC): { id, text }
  const base = new marked.Renderer()

  renderer.html = ({ text }) => escapeHtml(text)

  renderer.link = function link(token) {
    if (!isSafeUrl(token.href, { allowMailto: true })) return this.parser.parseInline(token.tokens)
    const out = base.link.call(this, token)
    // Enlaces a otros sitios: sin acceso a window.opener ni Referer completo.
    return /^https?:/i.test(token.href.trim()) ? out.replace('<a ', '<a rel="noopener noreferrer" ') : out
  }

  renderer.image = function image(token) {
    if (!isSafeUrl(token.href, { allowMailto: false })) return escapeHtml(token.text)
    return base.image.call(this, token)
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

function countWords(markdown) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_>`~-]/g, ' ')
    .trim()
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
}

function readPostsForLocale(locale) {
  const dir = path.join(CONTENT_DIR, locale)
  if (!fs.existsSync(dir)) {
    console.warn(`[build-blog-content] Aviso: no existe ${dir}, se omite.`)
    return []
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'))
  const posts = []

  for (const file of files) {
    const slug = file.replace(/\.md$/, '')
    const filePath = path.join(dir, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    const parsed = frontMatterSchema.safeParse(data)
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')
      throw new Error(`[build-blog-content] Front matter inválido en ${locale}/${file}:\n${issues}`)
    }

    const fm = parsed.data
    if (fm.draft) continue

    const words = countWords(content)
    const readingMinutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
    const { html, headings } = renderMarkdown(content)

    posts.push({
      slug,
      locale,
      title: fm.title,
      titleSeo: fm.titleSeo,
      subtitle: fm.subtitle ?? null,
      description: fm.description,
      descriptionSeo: fm.descriptionSeo,
      date: fm.date,
      category: fm.category,
      tags: fm.tags,
      image: fm.image ?? null,
      imageAlt: fm.imageAlt ?? null,
      author: fm.author,
      readingMinutes,
      headings,
      html,
    })
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return posts
}

function main() {
  const result = {}
  for (const locale of LOCALES) {
    result[locale] = readPostsForLocale(locale)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2) + '\n', 'utf-8')

  const counts = LOCALES.map((l) => `${l}: ${result[l].length}`).join(', ')
  console.log(`[build-blog-content] OK -> ${path.relative(ROOT, OUT_FILE)} (${counts})`)
}

main()
