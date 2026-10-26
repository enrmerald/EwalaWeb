import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
