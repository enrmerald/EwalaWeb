/**
 * Validación estricta del cuerpo de POST /api/contact, sin dependencias (la función no empaqueta
 * node_modules: arranca más rápido y no necesita enlaces simbólicos al servirse en local).
 *
 * Reglas: lista blanca de campos (cualquier campo extra se rechaza), tipos exactos, longitudes de
 * lib/contact.ts y sin caracteres de control en campos de una línea (anti inyección de cabeceras).
 */
import { CONTACT_LIMITS as L, MAX_ELAPSED_MS, NEED_VALUES, PHONE_PATTERN, type ContactRequest } from '../../lib/contact'

const SINGLE_LINE = /^[^\p{Cc}]*$/u
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Formato razonable de email (el navegador ya valida; aquí se evita basura y cabeceras).
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

const ALLOWED_KEYS = new Set<keyof ContactRequest>([
  'submissionId', 'locale', 'elapsedMs', 'firstName', 'lastName', 'company', 'email',
  'phone', 'role', 'need', 'message', 'privacy', 'marketing', 'website',
])

export type ValidationResult = { ok: true; data: ContactRequest } | { ok: false; fields: Record<string, string> }

export function validateContact(input: unknown): ValidationResult {
  const fields: Record<string, string> = {}
  const bad = (field: string) => { fields[field] = 'invalid' }

  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, fields: { form: 'invalid' } }
  const o = input as Record<string, unknown>
  for (const key of Object.keys(o)) if (!ALLOWED_KEYS.has(key as keyof ContactRequest)) bad(key)

  // Texto de una línea: recorta espacios y comprueba longitud y ausencia de caracteres de control.
  const line = (key: string, min: number, max: number, required: boolean): string | undefined => {
    const value = o[key]
    if (value === undefined && !required) return undefined
    if (typeof value !== 'string') { bad(key); return undefined }
    const v = value.trim()
    if ((required || v !== '') && (v.length < min || v.length > max)) bad(key)
    if (!SINGLE_LINE.test(v)) bad(key)
    return v
  }

  const submissionId = typeof o.submissionId === 'string' && UUID.test(o.submissionId) ? o.submissionId : (bad('submissionId'), '')
  const locale = o.locale === 'es' || o.locale === 'en' ? o.locale : (bad('locale'), 'es')
  const elapsedMs =
    typeof o.elapsedMs === 'number' && Number.isInteger(o.elapsedMs) && o.elapsedMs >= 0 && o.elapsedMs <= MAX_ELAPSED_MS
      ? o.elapsedMs
      : (bad('elapsedMs'), 0)

  const firstName = line('firstName', L.firstName.min, L.firstName.max, true) ?? ''
  const lastName = line('lastName', 0, L.lastName.max, false)
  const company = line('company', L.company.min, L.company.max, true) ?? ''
  const email = line('email', 3, L.email.max, true) ?? ''
  if (email && !EMAIL.test(email)) bad('email')
  const phone = line('phone', 0, L.phone.max, false)
  if (phone && !PHONE_PATTERN.test(phone)) bad('phone')
  const role = line('role', 0, L.role.max, false)

  const need = (NEED_VALUES as readonly unknown[]).includes(o.need) ? (o.need as ContactRequest['need']) : (bad('need'), 'other')

  // Mensaje multilínea: se permiten saltos de línea y tabuladores, ningún otro carácter de control.
  let message: string | undefined
  if (o.message !== undefined) {
    if (typeof o.message !== 'string') bad('message')
    else {
      message = o.message.replace(/\r\n/g, '\n').trim()
      if (message.length > L.message.max || !SINGLE_LINE.test(message.replace(/[\n\t]/g, ''))) bad('message')
    }
  }

  if (o.privacy !== true) bad('privacy')
  if (typeof o.marketing !== 'boolean') bad('marketing')
  if (typeof o.website !== 'string' || o.website.length > 200) bad('website')

  if (Object.keys(fields).length > 0) return { ok: false, fields }
  return {
    ok: true,
    data: {
      submissionId, locale, elapsedMs, firstName, lastName, company, email, phone, role, need, message,
      privacy: true, marketing: o.marketing as boolean, website: o.website as string,
    },
  }
}
