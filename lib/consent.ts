/**
 * Consentimiento de cookies de analítica (GA4). Utilidad pura, sin React: la usan el banner
 * (`components/ewala/cookie-consent.tsx`) y el footer (enlace «Preferencias de cookies»).
 *
 * La elección vive solo en `localStorage` del navegador (no hay servidor en producción) y caduca a
 * los 12 meses, como declara la Política de Cookies. Todo acceso al almacenamiento va en `try/catch`
 * (modo privado, datos de sitio bloqueados…): si falla, se comporta como «sin consentimiento».
 */

const RAW_GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''

/** ID de medición de GA4. Solo se acepta el formato `G-XXXXXXXX`: el valor acaba dentro de una URL y de un script inline. */
export const GA_MEASUREMENT_ID = /^G-[A-Z0-9]{4,}$/.test(RAW_GA_ID) ? RAW_GA_ID : ''

export const CONSENT_KEY = 'ewala-cookie-consent'
/** Evento para reabrir el panel de preferencias (lo lanza el footer). */
export const OPEN_EVENT = 'ewala:open-cookie-settings'
/** Evento interno: la elección cambió en esta pestaña (`storage` solo salta en otras). */
export const CONSENT_EVENT = 'ewala:consent-change'

const CONSENT_VERSION = 1
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export interface ConsentRecord {
  v: number
  analytics: boolean
  ts: number
}

/** Valor crudo guardado si es válido y vigente; `null` si falta, está corrupto, es de otra versión o caducó. */
export function readRawConsent(): string | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    return parseConsent(raw) ? raw : null
  } catch {
    return null
  }
}

export function parseConsent(raw: string | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<ConsentRecord>
    if (
      data.v !== CONSENT_VERSION ||
      typeof data.analytics !== 'boolean' ||
      typeof data.ts !== 'number' ||
      Date.now() - data.ts > MAX_AGE_MS ||
      data.ts > Date.now() + 60_000
    ) {
      return null
    }
    return { v: data.v, analytics: data.analytics, ts: data.ts }
  } catch {
    return null
  }
}

export function readConsent(): ConsentRecord | null {
  return parseConsent(readRawConsent())
}

export function writeConsent(analytics: boolean): void {
  try {
    const record: ConsentRecord = { v: CONSENT_VERSION, analytics, ts: Date.now() }
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
  } catch {
    // Sin almacenamiento no se puede recordar la elección: el banner volverá a mostrarse.
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

function setGaDisabled(disabled: boolean) {
  if (!GA_MEASUREMENT_ID) return
  ;(window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled
}

/** Reactiva el envío de GA4 tras un consentimiento (puede haberse desactivado antes en la misma sesión). */
export function enableAnalytics() {
  setGaDisabled(false)
}

function expireCookie(name: string) {
  const parts = window.location.hostname.split('.')
  const domains = new Set<string>([''])
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join('.')
    domains.add(domain)
    domains.add(`.${domain}`)
  }
  for (const domain of domains) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${
      domain ? `; domain=${domain}` : ''
    }`
  }
}

/** Retira el consentimiento: corta el envío de GA4 y borra sus cookies (`_ga`, `_ga_*`). Idempotente. */
export function revokeAnalytics() {
  setGaDisabled(true)
  try {
    document.cookie
      .split(';')
      .map((c) => c.split('=')[0].trim())
      .filter((name) => /^_ga(_|$)/.test(name) || name === '_gid')
      .forEach(expireCookie)
  } catch {
    // Sin acceso a document.cookie no hay nada que borrar.
  }
}
