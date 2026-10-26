import { GTM_ID } from '@/lib/analytics'

/**
 * Carga de GTM (public/gtm.js). React 19 sube los <script async src> al <head> y los deduplica,
 * así que queda «lo más arriba posible del head», como pide Google, aunque se declare en el body.
 */
export function GtmScript() {
  return <script async src="/gtm.js" />
}

/** Respaldo sin JavaScript: debe ir justo después de abrir <body>. */
export function GtmNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
