/**
 * Contrato del formulario de contacto, compartido por el navegador
 * (components/ewala/contact-form.tsx) y la Netlify Function (netlify/functions/contact.mts).
 *
 * ⚠️ Sin imports con alias "@/": la función se empaqueta con esbuild fuera de Next y solo
 * resuelve rutas relativas.
 */

export const CONTACT_ENDPOINT = '/api/contact'

/** Valores de «¿Qué necesitas?». Las etiquetas viven en messages/*.json → contact.form.need.options. */
export const NEED_VALUES = ['demo', 'pricing', 'integration', 'compliance', 'other'] as const
export type NeedValue = (typeof NEED_VALUES)[number]

/** Límites de longitud: el cliente los valida para dar feedback y el servidor los impone. */
export const CONTACT_LIMITS = {
  firstName: { min: 2, max: 40 },
  lastName: { max: 60 },
  company: { min: 2, max: 80 },
  email: { max: 160 },
  phone: { max: 32 },
  role: { max: 80 },
  message: { max: 1000 },
} as const

/** Teléfono: dígitos, espacios, +, paréntesis, puntos y guiones. */
export const PHONE_PATTERN = /^[+\d\s().-]*$/

/** Tiempo mínimo entre que se pinta el formulario y se envía: por debajo, casi seguro es un bot. */
export const MIN_FILL_SECONDS = 3

/** Tope razonable de `elapsedMs` (24 h): un valor mayor no lo envía un navegador real. */
export const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000

/** Cuerpo JSON que el navegador envía a CONTACT_ENDPOINT. */
export interface ContactRequest {
  submissionId: string
  locale: 'es' | 'en'
  /**
   * Milisegundos entre que se montó el formulario y se envió, medidos en el navegador con un reloj
   * monotónico (`performance.now()`). No es una hora absoluta: así no depende de que el reloj del
   * visitante coincida con el del servidor.
   */
  elapsedMs: number
  firstName: string
  lastName?: string
  company: string
  email: string
  phone?: string
  role?: string
  need: NeedValue
  message?: string
  /**
   * Confirma que la persona ha leído la política de privacidad (casilla «He leído la…»). No es un consentimiento
   * al tratamiento —la base es la aplicación de medidas precontractuales—; el nombre se mantiene por
   * compatibilidad con el contrato cliente/función. El único consentimiento real es `marketing`.
   */
  privacy: true
  marketing: boolean
  /** Honeypot: campo invisible para personas. Si llega con contenido, es un bot. */
  website: string
}

export type ContactErrorCode = 'validation' | 'rateLimited' | 'network' | 'unavailable' | 'generic'

export type ContactResponse =
  | { ok: true; reference: string; delivery: 'sent' | 'skipped' }
  | { ok: false; error: ContactErrorCode; fields?: Record<string, string> }
