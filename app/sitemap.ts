import type { MetadataRoute } from 'next'
import { locales, PAGES, localizedPath, defaultLocale } from '@/i18n/config'
import type { Page } from '@/i18n/config'
import { getAllPosts, getLocalesForSlug } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'

/**
 * Fecha de la última modificación real de cada página (formato AAAA-MM-DD). Se fija a mano y NO
 * con `new Date()`: si lastmod cambia en cada build sin que cambie el contenido, Google deja de
 * fiarse de él. Al cambiar el contenido de una página, actualizar aquí su fecha.
 * El listado del blog toma la fecha del artículo más reciente.
 */
const PAGE_LAST_MODIFIED: Record<Exclude<Page, '/blog'>, string> = {
  '/': '2026-10-26',
  '/contacto': '2026-10-26',
  '/compania': '2026-10-26',
  '/privacidad': '2026-10-26',
  '/aviso-legal': '2026-10-26',
  '/cookies': '2026-10-26',
}

const absolute = (path: string) => `${SITE_URL}${path}`

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPostDate = locales
    .flatMap((locale) => getAllPosts(locale).map((post) => post.date))
    .sort()
    .at(-1)

  const staticEntries: MetadataRoute.Sitemap = PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: absolute(localizedPath(locale, page)),
      lastModified: page === '/blog' ? latestPostDate : PAGE_LAST_MODIFIED[page],
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, absolute(localizedPath(l, page))])),
          'x-default': absolute(localizedPath(defaultLocale, page)),
        },
      },
    })),
  )

  const blogEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllPosts(locale).map((post) => {
      const available = getLocalesForSlug(post.slug)
      return {
        url: absolute(`/${locale}/blog/${post.slug}/`),
        lastModified: post.date,
        alternates: {
          languages: Object.fromEntries(available.map((l) => [l, absolute(`/${l}/blog/${post.slug}/`)])),
        },
      }
    }),
  )

  return [...staticEntries, ...blogEntries]
}
