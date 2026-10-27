/**
 * Metadatos de SEO de cada página fija para los sitemaps (`scripts/generar-sitemaps.mjs`).
 *
 * Es JavaScript puro (.mjs) a propósito: lo ejecuta Node directamente en el prebuild, sin transpilar
 * ni resolver el alias `@/`. Los idiomas, la lista de páginas y `localizedPath()` NO se repiten aquí:
 * viven en `i18n/config.ts`, y el script los importa de allí. Las claves de `SITEMAP_PAGES` deben
 * coincidir exactamente con `PAGES`; el script falla el build si falta o sobra alguna.
 */

/**
 * @typedef {'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'} ChangeFreq
 * @typedef {{ lastmod: string | null, changefreq: ChangeFreq, priority: number }} SitemapPage
 */

/**
 * `lastmod` es la fecha de la última modificación REAL del contenido (AAAA-MM-DD). Se fija a mano y NO
 * con `new Date()`: si cambiara en cada build sin que cambie la página, Google dejaría de fiarse.
 * Al cambiar el contenido de una página fija, actualizar aquí su fecha.
 * `lastmod: null` en `/blog`: el script usa la fecha del artículo más reciente.
 * `priority` y `changefreq` solo los lee el sitemap completo (`sitemap.xml`); Google los ignora y por
 * eso `sitemap-google.xml` no los incluye.
 *
 * @type {Record<string, SitemapPage>}
 */
export const SITEMAP_PAGES = {
  '/': { lastmod: '2026-10-26', changefreq: 'weekly', priority: 1.0 },
  '/blog': { lastmod: null, changefreq: 'weekly', priority: 0.8 },
  '/compania': { lastmod: '2026-10-26', changefreq: 'monthly', priority: 0.7 },
  '/contacto': { lastmod: '2026-10-26', changefreq: 'yearly', priority: 0.6 },
  '/privacidad': { lastmod: '2026-10-26', changefreq: 'yearly', priority: 0.3 },
  '/aviso-legal': { lastmod: '2026-10-26', changefreq: 'yearly', priority: 0.3 },
  '/cookies': { lastmod: '2026-10-26', changefreq: 'yearly', priority: 0.3 },
}

/**
 * Valores del sitemap completo para los artículos del blog (su `lastmod` es el `date` del front matter).
 * @type {{ changefreq: ChangeFreq, priority: number }}
 */
export const SITEMAP_POST = { changefreq: 'monthly', priority: 0.6 }
