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

/**
 * Fecha de «hoy» (AAAA-MM-DD) en Europe/Madrid. Netlify construye en UTC: entre las 00:00 y las 02:00
 * (CEST) o 01:00 (CET) de España, `new Date().toISOString()` aún devuelve el día anterior y rechazaría
 * como «futuro» un artículo fechado hoy. `en-CA` formatea directamente como AAAA-MM-DD.
 */
export const todayInMadrid = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now)

/** ¿Es `value` (AAAA-MM-DD, ya validada) posterior a hoy en Europe/Madrid? Las cadenas ISO se ordenan como fechas. */
export const isFutureDate = (value, now = new Date()) => value > todayInMadrid(now)
