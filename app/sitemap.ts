import type { MetadataRoute } from 'next'
import { locales, PAGES, localizedPath } from '@/i18n/config'
import { getAllPosts } from '@/lib/blog'
import { SITE_URL } from '@/lib/site'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = PAGES.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}${localizedPath(locale, page)}`,
      lastModified: new Date(),
    })),
  )

  const blogEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllPosts(locale).map((post) => ({
      url: `${SITE_URL}/${locale}/blog/${post.slug}/`,
      lastModified: new Date(post.date),
    })),
  )

  return [...staticEntries, ...blogEntries]
}
