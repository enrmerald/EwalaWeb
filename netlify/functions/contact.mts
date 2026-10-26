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
import esMessages from '../../messages/es.json'
import { MIN_FILL_SECONDS, type NeedValue } from '../../lib/contact'
import { fail, json, log, readJsonRequest } from '../lib/http'
import { isEmailConfigured, sendEmail } from '../lib/resend'
import { contactEmail, contactSubject } from '../lib/contact-email'
import { validateContact } from '../lib/contact-validation'

const NEED_LABELS = esMessages.contact.form.need.options as Record<NeedValue, string>

/** Referencia corta y legible para que la persona pueda citarla (8 caracteres del UUID). */
const shortReference = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

export default async function handler(request: Request): Promise<Response> {
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
  // para no dar pistas al bot. (Si el reloj del cliente va adelantado, la diferencia es negativa:
  // no se puede comprobar y se deja pasar.)
  const elapsedSeconds = (Date.now() - data.renderedAt) / 1000
  if (data.website.trim() !== '' || (elapsedSeconds >= 0 && elapsedSeconds < MIN_FILL_SECONDS)) {
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
    idempotencyKey: `ewala/${environment}/contact/${data.submissionId}`,
    tags: { type: 'contact', environment, need: data.need },
  })

  if (!result.ok) {
    trace(`email_failed_${result.status}`)
    return fail('unavailable', 503)
  }
  trace('sent')
  return json({ ok: true, reference, delivery: 'sent' })
}
