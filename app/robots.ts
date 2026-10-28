import type { MetadataRoute } from 'next'
import { SITE_URL, IS_PRODUCTION_DEPLOY } from '@/lib/site'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  // Previews y ramas de Netlify (*.netlify.app): cerrado a todos los robots.
  if (!IS_PRODUCTION_DEPLOY) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Páginas de error y contenido retirado: no aportan nada al índice.
      disallow: ['/404/', '/404.html', '/410.html'],
    },
    // Los genera scripts/generar-sitemaps.mjs. El de Google (mínimo) va primero: es el que se envía a
    // Search Console; el completo (hreflang, imágenes) queda para Bing y herramientas SEO.
    sitemap: [`${SITE_URL}/sitemap-google.xml`, `${SITE_URL}/sitemap.xml`],
  }
}
