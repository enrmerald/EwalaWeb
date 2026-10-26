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
const OUT_DIR = path.join(ROOT, 'src', 'generated')
const OUT_FILE = path.join(OUT_DIR, 'blog.json')

const LOCALES = ['es', 'en']
const WORDS_PER_MINUTE = 200

// Enum cerrado de categorías. Ampliar aquí si se añaden nuevas.
const CATEGORIES = ['nis2', 'ot-iot', 'mssp', 'idi']

const frontMatterSchema = z.object({
  title: z.string().min(1, 'title es obligatorio'),
  titleSeo: z.string().min(1, 'titleSeo es obligatorio'),
  subtitle: z.string().optional(),
  description: z.string().min(1, 'description es obligatorio'),
  descriptionSeo: z.string().min(1, 'descriptionSeo es obligatorio'),
  date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'date debe ser una fecha ISO 8601 válida' }),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
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

/**
 * Renderiza Markdown -> HTML añadiendo `id` slugificado a cada heading (para anclas de TOC),
 * evitando colisiones de id dentro del mismo artículo.
 */
function renderMarkdown(markdown) {
  const renderer = new marked.Renderer()
  const seenIds = new Map()

  renderer.heading = function heading({ tokens, depth }) {
    const html = this.parser.parseInline(tokens)
    const plainText = html.replace(/<[^>]+>/g, '')
    let id = slugify(plainText)
    const count = seenIds.get(id) ?? 0
    seenIds.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`
    return `<h${depth} id="${id}">${html}</h${depth}>\n`
  }

  return marked.parse(markdown, { renderer })
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
    const html = renderMarkdown(content)

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
