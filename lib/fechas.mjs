/**
 * Utilidades de fechas `AAAA-MM-DD` compartidas por los scripts de build y verificación
 * (`scripts/build-blog-content.mjs`, `scripts/generar-sitemaps.mjs`, `scripts/verificar-sitemaps.mjs`).
 *
 * Es JavaScript puro (.mjs) a propósito, como `lib/sitemap-data.mjs`: lo ejecuta Node directamente en el
 * prebuild, sin transpilar ni resolver el alias `@/`.
 */

/** `AAAA-MM-DD` y además una fecha real del calendario (rechaza 2026-02-31). */
export const isRealIsoDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
