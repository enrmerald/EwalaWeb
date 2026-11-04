/**
 * Envío de correo con Microsoft Graph (https://learn.microsoft.com/graph/api/user-sendmail) desde un
 * buzón compartido del tenant de Microsoft 365 de Ewala. Se usa fetch directamente, sin SDK ni
 * @azure/identity: sin dependencias de node_modules (regla de netlify/) y control total de timeouts.
 *
 * Variables de entorno (Netlify → Site configuration → Environment variables, scope «Functions»):
 *   MS_TENANT_ID      GUID del tenant (Directory ID).
 *   MS_CLIENT_ID      GUID de la app de Entra ID «Web Ewala - Contacto» (Application ID).
 *   MS_CLIENT_SECRET  Secreto de cliente de esa app. SECRETO: nunca se registra ni se devuelve.
 *   MS_SENDER         Buzón remitente (compartido, sin login), p. ej. web@ewala.es. La app solo debe poder
 *                     enviar como ESTE buzón (RBAC for Applications de Exchange); ver docs/arquitectura.md.
 *
 * Presupuesto de una función síncrona de Netlify (10 s): token 2000 ms + envío 2800 ms + espera 400 ms +
 * reintento 2800 ms = 8000 ms, y quedan 2 s para validar y responder.
 *
 * Graph NO tiene clave de idempotencia: por eso solo se reintenta (una vez) cuando es seguro que el mensaje
 * NO se aceptó: un 429 (Graph limita antes de procesar) o un 503 con `Retry-After` explícito y ≤ 1 s.
 * Nunca ante otros 5xx (un 500/502/504 del front-door puede llegar después de encolar el mensaje) ni tras un
 * timeout o un error de red: duplicarían el correo.
 */
import { EMAIL } from './contact-validation'

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SCOPE = 'https://graph.microsoft.com/.default'

const TOKEN_TIMEOUT_MS = 2000
const SEND_TIMEOUT_MS = 2800
const SEND_ATTEMPTS = 2
const RETRY_DELAY_MS = 400
const MAX_RETRY_AFTER_S = 1
/** Un token cacheado se reutiliza mientras le queden más de 5 minutos de vida. */
const TOKEN_MARGIN_MS = 5 * 60 * 1000

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  replyTo?: string
  /** Identificador del envío; va en la cabecera X-Ewala-Submission para localizar duplicados. */
  reference: string
  /** Entorno (production, preview…); va en la cabecera X-Ewala-Environment. */
  environment: string
}

/** `code`: código AADSTS de Entra ID (token) o código de error de Graph. Nunca el cuerpo de la respuesta. */
export type SendResult = { ok: true } | { ok: false; status: number; code?: string }

type TokenResult = { ok: true; token: string } | { ok: false; status: number; code?: string }

interface GraphConfig {
  tenant: string
  clientId: string
  secret: string
  sender: string
}

/** Elimina caracteres de control: segunda barrera contra la inyección de cabeceras (CRLF). */
const singleLine = (value: string) => value.replace(/[\p{Cc}]+/gu, ' ').trim()

/** Token en memoria del módulo: lo aprovechan las invocaciones «calientes»; una función fría pide uno nuevo. */
let cached: { token: string; expiresAt: number } | null = null

function readConfig(): GraphConfig | null {
  const tenant = process.env.MS_TENANT_ID?.trim() ?? ''
  const clientId = process.env.MS_CLIENT_ID?.trim() ?? ''
  const secret = process.env.MS_CLIENT_SECRET?.trim() ?? ''
  const sender = process.env.MS_SENDER?.trim() ?? ''
  if (!GUID.test(tenant) || !GUID.test(clientId) || !secret || !EMAIL.test(sender)) return null
  return { tenant, clientId, secret, sender }
}

export function isEmailConfigured(): boolean {
  return readConfig() !== null
}

async function getToken(cfg: GraphConfig): Promise<TokenResult> {
  if (cached && cached.expiresAt - Date.now() > TOKEN_MARGIN_MS) return { ok: true, token: cached.token }

  let response: Response
  try {
    response = await fetch(`https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.secret,
        scope: SCOPE,
        grant_type: 'client_credentials',
      }),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, status: 0 }
  }

  if (!response.ok) {
    // Solo el código AADSTS (p. ej. 7000215 secreto incorrecto, 7000222 secreto caducado), nunca el cuerpo.
    let code: string | undefined
    try {
      const err = (await response.json()) as { error_codes?: unknown }
      const first = Array.isArray(err.error_codes) ? err.error_codes[0] : undefined
      if (typeof first === 'number' && Number.isInteger(first) && first > 0) code = `AADSTS${first}`
    } catch {
      /* cuerpo no JSON: se queda solo con el estado */
    }
    return { ok: false, status: response.status, ...(code ? { code } : {}) }
  }

  try {
    const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown }
    if (typeof data.access_token !== 'string' || !data.access_token) return { ok: false, status: response.status }
    const seconds = typeof data.expires_in === 'number' ? data.expires_in : 3600
    cached = { token: data.access_token, expiresAt: Date.now() + seconds * 1000 }
    return { ok: true, token: data.access_token }
  } catch {
    return { ok: false, status: response.status }
  }
}

export async function sendEmail(email: OutgoingEmail): Promise<SendResult> {
  const cfg = readConfig()
  if (!cfg) return { ok: false, status: 0 }

  const tokenResult = await getToken(cfg)
  if (!tokenResult.ok) return tokenResult

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(cfg.sender)}/sendMail`
  const body = JSON.stringify({
    message: {
      subject: singleLine(email.subject),
      body: { contentType: 'HTML', content: email.html },
      toRecipients: [{ emailAddress: { address: singleLine(email.to) } }],
      ...(email.replyTo ? { replyTo: [{ emailAddress: { address: singleLine(email.replyTo) } }] } : {}),
      internetMessageHeaders: [
        { name: 'X-Ewala-Submission', value: singleLine(email.reference) },
        { name: 'X-Ewala-Environment', value: singleLine(email.environment) },
      ],
    },
    // No se guarda otra copia de datos personales en el buzón remitente.
    saveToSentItems: false,
  })

  let last: SendResult = { ok: false, status: 0 }
  for (let attempt = 0; attempt < SEND_ATTEMPTS; attempt++) {
    const { result, retryAfter } = await post(url, body, tokenResult.token)
    last = result
    if (last.ok) return last
    if (!isSafeToRetry(last.status, retryAfter)) return last
    if (attempt < SEND_ATTEMPTS - 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  }
  return last
}

/**
 * ¿Se puede repetir el POST sin riesgo de duplicar el correo? Solo si Graph respondió y todo indica que NO
 * procesó el mensaje: 429 (límite, se emite antes de procesar) o 503 con `Retry-After` explícito. Con
 * `Retry-After` > 1 s no se espera (presupuesto de la función). Estado 0 (timeout o red caída) y el resto de
 * 5xx: NO, el mensaje pudo haberse aceptado ya. `retryAfter` es `null` si la cabecera falta o no es numérica.
 */
export function isSafeToRetry(status: number, retryAfter: number | null): boolean {
  if (retryAfter !== null && retryAfter > MAX_RETRY_AFTER_S) return false
  if (status === 429) return true
  return status === 503 && retryAfter !== null
}

async function post(url: string, body: string, token: string): Promise<{ result: SendResult; retryAfter: number | null }> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
  } catch {
    return { result: { ok: false, status: 0 }, retryAfter: null }
  }

  // Éxito = 202 Accepted con cuerpo vacío.
  if (response.status === 202) return { result: { ok: true }, retryAfter: null }

  // Token revocado o inválido: se descarta la caché y no se reintenta en esta petición.
  if (response.status === 401) cached = null

  // `null` si la cabecera falta o no es un número de segundos (p. ej. una fecha HTTP).
  const header = response.headers.get('Retry-After')
  const seconds = header === null || header.trim() === '' ? NaN : Number(header)
  const retryAfter = Number.isFinite(seconds) && seconds >= 0 ? seconds : null
  let code: string | undefined
  try {
    const err = (await response.json()) as { error?: { code?: unknown } }
    const value = err.error?.code
    if (typeof value === 'string' && /^[A-Za-z]{1,64}$/.test(value)) code = value
  } catch {
    /* cuerpo no JSON: se queda solo con el estado */
  }
  return {
    result: { ok: false, status: response.status, ...(code ? { code } : {}) },
    retryAfter,
  }
}
