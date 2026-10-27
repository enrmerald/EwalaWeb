/**
 * `POST /api/contact` (netlify.toml la reescribe aquí) · formulario de contacto → correo vía Resend.
 *
 * Flujo: comprobaciones HTTP → validación estricta (netlify/lib/contact-validation.ts, sin
 * dependencias externas para no empaquetar node_modules) → antispam (honeypot + tiempo mínimo) →
 * correo a CONTACT_MAILBOX_TO con Reply-To del visitante → respuesta con número de referencia.
 *
 * Variables de entorno (Netlify, scope «Functions»):
 *   RESEND_API_KEY, RESEND_FROM   ver netlify/lib/resend.ts
 *   CONTACT_MAILBOX_TO            buzón que recibe las consultas (p. ej. info@ewala.es)
 *   MAIL_ENVIRONMENT              "production" en producción; otro valor añade [VALOR] al asunto
 * Si falta alguna, la función entra en MODO PRUEBA: valida, no envía y responde delivery "skipped"
 * (el formulario lo indica). Nunca responde éxito si el correo real ha fallado (503).
 *
 * Extensión .mts: ver la nota de netlify/functions/csp-report.mts.
 */
import { createHash } from 'node:crypto'
import esMessages from '../../messages/es.json'
import { MIN_FILL_SECONDS, type ContactRequest, type NeedValue } from '../../lib/contact'
import { fail, json, log, readJsonRequest } from '../lib/http'
import { IDEMPOTENT_CONFLICT, isEmailConfigured, sendEmail } from '../lib/resend'
import { contactEmail, contactSubject } from '../lib/contact-email'
import { validateContact } from '../lib/contact-validation'

const NEED_LABELS = esMessages.contact.form.need.options as Record<NeedValue, string>

/** Referencia corta y legible para que la persona pueda citarla (8 caracteres del UUID). */
const shortReference = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

/**
 * Huella del CONTENIDO enviado (no incluye la hora de recepción). Resend exige que una misma
 * Idempotency-Key lleve siempre el mismo cuerpo; como el correo incluye la hora, la clave se ata al
 * contenido: reintentar lo mismo es idempotente y editar el mensaje genera un envío nuevo.
 */
const contentHash = (d: ContactRequest) =>
  createHash('sha256')
    .update(JSON.stringify([d.locale, d.firstName, d.lastName, d.company, d.email, d.phone, d.role, d.need, d.message, d.marketing]))
    .digest('hex')
    .slice(0, 16)

/** Ruta pública del formulario. Netlify la sirve por `config.path` y por la regla de netlify.toml. */
const CONTACT_PATH = '/api/contact'

/**
 * Límite de envíos en el borde de Netlify, ANTES de ejecutar la función. Va aquí (y no solo en la
 * regla de redirección de netlify.toml) porque Netlify aplica los límites de funciones a la ruta de la
 * función. Debe ser un literal: Netlify lo lee del código sin ejecutarlo. El plan Free admite 2 reglas.
 */
export const config = {
  path: '/api/contact',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}

export default async function handler(request: Request): Promise<Response> {
  // La función sigue siendo alcanzable en /.netlify/functions/contact, donde no aplica la regla de
  // redirección de netlify.toml. Solo se atiende la ruta pública; el resto se trata como inexistente.
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '')
  if (pathname !== CONTACT_PATH) return fail('generic', 404)

  const started = Date.now()
  const pre = await readJsonRequest(request)
  if ('response' in pre) return pre.response

  const parsed = validateContact(pre.body)
  // Solo los nombres de campo con error (nunca los valores): el cliente los marca en rojo.
  if (!parsed.ok) return fail('validation', 400, parsed.fields)
  const data = parsed.data
  const reference = shortReference(data.submissionId)
  const environment = process.env.MAIL_ENVIRONMENT ?? 'development'
  const trace = (status: string) =>
    log({ type: 'contact', submissionId: data.submissionId, locale: data.locale, status, ms: Date.now() - started })

  // Antispam: honeypot relleno o envío más rápido que una persona. Se responde éxito igualmente
  // para no dar pistas al bot. El tiempo lo mide el navegador con un reloj monotónico (elapsedMs):
  // no se compara con la hora del servidor, así que un reloj desajustado no descarta envíos reales.
  if (data.website.trim() !== '' || data.elapsedMs < MIN_FILL_SECONDS * 1000) {
    trace('discarded_antispam')
    return json({ ok: true, reference, delivery: 'skipped' })
  }

  const mailbox = process.env.CONTACT_MAILBOX_TO
  if (!isEmailConfigured() || !mailbox) {
    trace('test_mode')
    return json({ ok: true, reference, delivery: 'skipped' })
  }

  const emailData = {
    reference,
    submissionId: data.submissionId,
    locale: data.locale,
    receivedAt: new Date(),
    environment,
    firstName: data.firstName,
    lastName: data.lastName,
    company: data.company,
    email: data.email,
    phone: data.phone,
    role: data.role,
    needLabel: NEED_LABELS[data.need],
    message: data.message,
    marketing: data.marketing,
  }
  const { html, text } = contactEmail(emailData)

  const result = await sendEmail({
    to: mailbox,
    subject: contactSubject(emailData),
    html,
    text,
    replyTo: data.email,
    idempotencyKey: `ewala/${environment}/contact/${data.submissionId}/${contentHash(data)}`,
    tags: { type: 'contact', environment, need: data.need },
  })

  // 409 invalid_idempotent_request: la misma clave (mismo envío y mismo contenido) ya la aceptó
  // Resend en un intento anterior cuya respuesta no llegó a la persona. El correo ya salió.
  if (!result.ok && result.code === IDEMPOTENT_CONFLICT) {
    trace('sent_idempotent')
    return json({ ok: true, reference, delivery: 'sent' })
  }
  if (!result.ok) {
    trace(`email_failed_${result.status}`)
    return fail('unavailable', 503)
  }
  trace('sent')
  return json({ ok: true, reference, delivery: 'sent' })
}
