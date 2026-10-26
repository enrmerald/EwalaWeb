// Dominio de producción. Se puede sobrescribir con NEXT_PUBLIC_SITE_URL (p. ej. en previews de Netlify).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ewala.es'

// Perfiles oficiales confirmados por Ewala (footer y, más adelante, `sameAs` del JSON-LD).
export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/e-wala-it-services',
  github: 'https://github.com/EwalaIT',
} as const

/**
 * Añade la barra final a una ruta interna (trailingSlash: true en next.config.mjs), respetando
 * ?query y #ancla. No toca rutas de fichero (/doc.pdf, /sitemap.xml).
 * Necesario donde Next no normaliza solo: sitemap, JSON-LD y <a> nativos (<Link> ya lo hace).
 */
export function withTrailingSlash(path: string): string {
  const match = path.match(/^([^?#]*)(.*)$/)
  const [pathname, suffix] = match ? [match[1], match[2]] : [path, '']
  if (pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname)) return path
  return `${pathname}/${suffix}`
}
