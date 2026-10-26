/**
 * Envío de correo con la API REST de Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Se usa fetch directamente, sin el SDK: una dependencia menos y control total de timeouts y reintentos.
 *
 * Variables de entorno (Netlify → Site configuration → Environment variables, scope «Functions»):
 *   RESEND_API_KEY   Clave con permiso «Sending access» limitada al dominio de envío. SECRETO.
 *   RESEND_FROM      Remitente verificado en Resend, p. ej. «Web Ewala <web@notify.ewala.es>».
 */

const RESEND_URL = 'https://api.resend.com/emails'

/** Presupuesto: 2 intentos × 3,5 s + 0,4 s de espera = 7,4 s, por debajo de los 10 s de una función. */
const ATTEMPT_TIMEOUT_MS = 3500
const ATTEMPTS = 2
const RETRY_DELAY_MS = 400

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Mismo valor ⇒ Resend no envía dos veces (doble clic, reintento del navegador…). */
  idempotencyKey: string
  tags?: Record<string, string>
}

export type SendResult = { ok: true; id: string } | { ok: false; status: number }

/** Elimina caracteres de control: impide la inyección de cabeceras (CRLF) en asunto y Reply-To. */
const singleLine = (value: string) => value.replace(/[\p{Cc}]+/gu, ' ').trim()

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)
}

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  if (!apiKey || !from) return { ok: false, status: 0 }

  const body = JSON.stringify({
    from,
    to: [email.to],
    subject: singleLine(email.subject),
    html: email.html,
    text: email.text,
    ...(email.replyTo ? { reply_to: singleLine(email.replyTo) } : {}),
    // Los tags de Resend solo admiten [A-Za-z0-9_-].
    ...(email.tags
      ? { tags: Object.entries(email.tags).map(([name, value]) => ({ name, value: value.replace(/[^\w-]/g, '_') })) }
      : {}),
  })

  let last: SendResult = { ok: false, status: 0 }
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    last = await attempt_(body, apiKey, email.idempotencyKey)
    if (last.ok) return last
    // Solo se reintenta lo transitorio: red caída (0), límite de Resend (429) o error suyo (5xx).
    const transient = last.status === 0 || last.status === 429 || last.status >= 500
    if (!transient) return last
    if (attempt < ATTEMPTS - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  }
  return last
}

async function attempt_(body: string, apiKey: string, idempotencyKey: string): Promise<SendResult> {
  let response: Response
  try {
    response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body,
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, status: 0 }
  }
  if (!response.ok) return { ok: false, status: response.status }
  try {
    const data = (await response.json()) as { id?: unknown }
    return typeof data.id === 'string' ? { ok: true, id: data.id } : { ok: false, status: response.status }
  } catch {
    return { ok: false, status: response.status }
  }
}
