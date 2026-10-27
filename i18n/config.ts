import type { Messages } from './types'

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

// Next.js tipa los segmentos dinámicos como `string`; esto los acota a un Locale soportado.
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export const PAGES = [
  '/',
  '/blog',
  '/contacto',
  '/compania',
  '/privacidad',
  '/aviso-legal',
  '/cookies',
] as const
export type Page = (typeof PAGES)[number]

export async function getDictionary(locale: Locale): Promise<Messages> {
  if (locale === 'en') {
    return (await import('../messages/en.json')).default as Messages
  }
  return (await import('../messages/es.json')).default as Messages
}

export function localizedPath(locale: Locale, path: Page = '/'): string {
  // Con barra final: coincide con las URLs servidas (trailingSlash: true) y las canónicas.
  return `/${locale}${path === '/' ? '' : path}/`
}

/**
 * `canonical` es autorreferenciado: cada idioma se declara canónico a sí mismo (si /en apuntara a /es,
 * Google trataría la versión inglesa como duplicado y podría no indexarla). `languages` lista todas
 * las versiones (hreflang) y `x-default` apunta al idioma por defecto.
 */
export function alternatesFor(path: Page, locale: Locale) {
  return {
    canonical: localizedPath(locale, path),
    languages: Object.fromEntries([
      ...locales.map((l) => [l, localizedPath(l, path)]),
      ['x-default', localizedPath(defaultLocale, path)],
    ]) as Record<string, string>,
  }
}