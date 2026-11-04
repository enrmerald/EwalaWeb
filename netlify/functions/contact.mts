/**
 * `POST /api/contact` (ruta propia de la función, ver `config` más abajo; netlify.toml NO la reescribe)
 * · formulario de contacto → correo vía Microsoft Graph.
 *
 * Flujo: comprobaciones HTTP → validación estricta (netlify/lib/contact-validation.ts, sin
 * dependencias externas para no empaquetar node_modules) → antispam (honeypot + tiempo mínimo) →
 * correo a CONTACT_MAILBOX_TO con Reply-To del visitante → respuesta con número de referencia.
 *
 * Variables de entorno (Netlify, scope «Functions»):
 *   MS_TENANT_ID, MS_CLIENT_ID,
 *   MS_CLIENT_SECRET, MS_SENDER   ver netlify/lib/graph-mail.ts
 *   CONTACT_MAILBOX_TO            buzón que recibe las consultas (un único correo, p. ej. info@ewala.es)
 *   MAIL_ENVIRONMENT              "production" en producción; otro valor añade [VALOR] al asunto
 * Si falta alguna (o CONTACT_MAILBOX_TO no es un único correo válido), la función entra en MODO PRUEBA:
 * valida, no envía y responde delivery "skipped" (el formulario lo indica). Nunca responde éxito si el correo real ha fallado (503).
 *
 * Extensión .mts: ver la nota de netlify/functions/csp-report.mts.
 */
import esMessages from '../../messages/es.json'
import { MIN_FILL_SECONDS, type NeedValue } from '../../lib/contact'
import { fail, json, log, readJsonRequest } from '../lib/http'
import { isEmailConfigured, readRecipient, sendEmail } from '../lib/graph-mail'
import { contactEmail, contactSubject } from '../lib/contact-email'
import { validateContact } from '../lib/contact-validation'

const NEED_LABELS = esMessages.contact.form.need.options as Record<NeedValue, string>

/** Referencia corta y legible para que la persona pueda citarla (8 caracteres del UUID). */
const shortReference = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

/** Ruta pública del formulario: la sirve Netlify por `config.path`, sin regla en netlify.toml. */
const CONTACT_PATH = '/api/contact'

/**
 * Ruta y límite de envíos en el borde de Netlify, ANTES de ejecutar la función. Con `path`, la función
 * deja de servirse en /.netlify/functions/contact. Una regla de reescritura de netlify.toml hacia esa
 * ruta (que tiene prioridad) apuntaría a algo inexistente y daría 404, por eso no existe. Debe ser un
 * literal: Netlify lo lee del código sin ejecutarlo. El plan Free admite 2 reglas de límite.
 */
export const config = {
  path: '/api/contact',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}

export default async function handler(request: Request): Promise<Response> {
  // Defensa en profundidad: solo se atiende la ruta pública; cualquier otra (p. ej. si algún día se
  // vuelve a servir en /.netlify/functions/contact, sin el límite) se trata como inexistente.
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

  const recipient = readRecipient()
  if (!isEmailConfigured() || !recipient.ok) {
    // Un destinatario mal escrito se distingue de «no configurado» para localizarlo en los logs
    // (nunca se registra el valor de la variable, solo el motivo).
    trace(isEmailConfigured() && !recipient.ok && recipient.reason === 'invalid' ? 'test_mode_recipient_invalid' : 'test_mode')
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
  const { html } = contactEmail(emailData)

  const result = await sendEmail({
    to: recipient.address,
    subject: contactSubject(emailData),
    html,
    replyTo: data.email,
    reference: data.submissionId,
    environment,
  })

  if (!result.ok) {
    // `code` ya viene saneado (AADSTS… o código de Graph): nunca datos personales.
    trace(`email_failed_${result.status}${result.code ? `_${result.code}` : ''}`)
    return fail('unavailable', 503)
  }
  trace('sent')
  return json({ ok: true, reference, delivery: 'sent' })
}
