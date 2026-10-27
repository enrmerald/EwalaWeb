import blogData from '@/src/generated/blog.json'
import type { Locale } from '@/i18n/config'

/**
 * Datos del blog: se leen de `src/generated/blog.json`, generado en build time por
 * `scripts/build-blog-content.mjs` a partir de `content/blog/{locale}/*.md`.
 * `src/generated/` no se versiona — se regenera en cada `predev`/`prebuild` (ver package.json).
 */

export type BlogCategory = 'nis2' | 'ot-iot' | 'mssp' | 'idi'

export interface BlogPost {
  slug: string
  locale: Locale
  title: string
  titleSeo: string
  subtitle: string | null
  description: string
  descriptionSeo: string
  date: string
  category: BlogCategory
  tags: string[]
  image: string | null
  imageAlt: string | null
  author: string
  readingMinutes: number
  /** `##` del artículo (id del ancla y texto plano), generados en build para el índice (TOC). */
  headings: Heading[]
  html: string
}

type BlogDataShape = Record<Locale, BlogPost[]>

const data = blogData as unknown as BlogDataShape

/** Todos los posts publicados (sin drafts) de un locale, más recientes primero. */
export function getAllPosts(locale: Locale): BlogPost[] {
  return data[locale] ?? []
}

export function getPostBySlug(locale: Locale, slug: string): BlogPost | undefined {
  return getAllPosts(locale).find((p) => p.slug === slug)
}

/** El artículo destacado es siempre el más reciente — regla automática, sin campo manual. */
export function getFeaturedPost(locale: Locale): BlogPost | undefined {
  return getAllPosts(locale)[0]
}

export function getGridPosts(locale: Locale): BlogPost[] {
  return getAllPosts(locale).slice(1)
}

export function getCategories(locale: Locale): BlogCategory[] {
  const set = new Set<BlogCategory>()
  for (const post of getAllPosts(locale)) set.add(post.category)
  return Array.from(set)
}

/** Artículos relacionados: misma categoría primero, rellenando con los más recientes si faltan. */
export function getRelatedPosts(post: BlogPost, count = 3): BlogPost[] {
  const others = getAllPosts(post.locale).filter((p) => p.slug !== post.slug)
  const sameCategory = others.filter((p) => p.category === post.category)
  const rest = others.filter((p) => p.category !== post.category)
  return [...sameCategory, ...rest].slice(0, count)
}

/** Locales donde existe un slug concreto — para construir `alternates.languages` del artículo. */
export function getLocalesForSlug(slug: string): Locale[] {
  const result: Locale[] = []
  for (const locale of Object.keys(data) as Locale[]) {
    if (data[locale].some((p) => p.slug === slug)) result.push(locale)
  }
  return result
}

/** Formatea una fecha ISO (YYYY-MM-DD) en UTC para evitar desfases de zona horaria en build. */
export function formatBlogDate(locale: Locale, isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  )
}

export interface Heading {
  id: string
  text: string
}

