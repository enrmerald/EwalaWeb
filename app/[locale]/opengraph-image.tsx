import { ImageResponse } from 'next/og'
import { locales } from '@/i18n/config'

// Requerido por `output: 'export'`: fuerza que la ruta se genere una vez en build.
export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

// Imagen OG genérica de marca, generada en build (compatible con output: 'export').
// TODO: sustituir por un diseño final del equipo de marketing si se desea algo más elaborado.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 56, fontWeight: 700, color: '#ffffff' }}>
          <span style={{ color: '#00e58d' }}>E</span>wala
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 34, color: '#ffffff', maxWidth: 900, lineHeight: 1.3 }}>
          Ciberseguridad OT/IoT con IA | SentryN3t NDR
        </div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 22, color: '#94a3b8' }}>ewala.es</div>
      </div>
    ),
    { ...size }
  )
}
