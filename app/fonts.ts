import { Space_Mono, Noto_Sans } from 'next/font/google'

// Fuentes auto-alojadas por next/font (se sirven desde /_next/static/media, sin peticiones a
// Google). Compartidas por el layout de idioma y la página 404 global.
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans',
})
