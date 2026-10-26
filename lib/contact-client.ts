import { CONTACT_ENDPOINT, MIN_FILL_SECONDS, type ContactRequest, type ContactResponse } from './contact'

/** UUID v4. `crypto.randomUUID` solo existe en contextos seguros (HTTPS/localhost): respaldo manual. */
export function newSubmissionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Si una persona rellena el formulario (por autocompletado) en menos del tiempo mínimo antispam,
 * se espera lo que falta en vez de dejar que el servidor descarte el envío.
 */
export async function waitForMinimumFillTime(renderedAt: number): Promise<void> {
  const remaining = MIN_FILL_SECONDS * 1000 + 250 - (Date.now() - renderedAt)
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
}

export async function submitContact(payload: ContactRequest): Promise<ContactResponse> {
  let response: Response
  try {
    response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return { ok: false, error: 'network' }
  }
  if (response.status === 429) return { ok: false, error: 'rateLimited' }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    return { ok: false, error: 'generic' }
  }
  const body = (typeof data === 'object' && data !== null ? data : {}) as Partial<ContactResponse> & Record<string, unknown>
  if (response.ok && body.ok === true && typeof body.reference === 'string') {
    return { ok: true, reference: body.reference, delivery: body.delivery === 'sent' ? 'sent' : 'skipped' }
  }
  const known = ['validation', 'rateLimited', 'unavailable', 'generic'] as const
  const error = known.find((code) => code === body.error) ?? 'generic'
  const fields = body.fields && typeof body.fields === 'object' ? (body.fields as Record<string, string>) : undefined
  return { ok: false, error, ...(fields ? { fields } : {}) }
}
