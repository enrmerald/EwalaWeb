import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { locales, isLocale, defaultLocale } from '@/i18n/config'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Ewala · SentryN3t Protection'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const COPY = {
  es: {
    headline: 'Ciberseguridad industrial OT/IoT con IA',
    sub: 'SentryN3t Protection · NDR para redes industriales',
  },
  en: {
    headline: 'Industrial OT/IoT cybersecurity with AI',
    sub: 'SentryN3t Protection · NDR for industrial networks',
  },
} as const

// Imagen social de marca (1200×630) generada en build: colores corporativos (gris #2f2f2f,
// verde #00e58d) y logo real desde public/. Es la que muestran LinkedIn, WhatsApp, X, etc.
export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : defaultLocale
  const copy = COPY[locale]
  const logo = await readFile(join(process.cwd(), 'public', 'logo_ewala_blanco.png'))
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#2f2f2f',
          padding: '72px 80px',
          borderTop: '12px solid #00e58d',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo admite <img> */}
        <img src={logoSrc} width={330} height={105} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: '#ffffff', lineHeight: 1.15, maxWidth: 1000 }}>
            {copy.headline}
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 32, color: '#00e58d' }}>{copy.sub}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.6)' }}>ewala.es</div>
      </div>
    ),
    { ...size },
  )
}
