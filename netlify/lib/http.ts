/**
 * Utilidades HTTP comunes de las Netlify Functions. Viven fuera de netlify/functions/ para que
 * Netlify no las despliegue como funciones: se empaquetan dentro de cada función que las importa.
 */
import type { ContactErrorCode } from '../../lib/contact'

/** Tope del cuerpo de una petición del formulario (un envío legítimo ocupa ~2 KB). */
export const MAX_BODY_BYTES = 32 * 1024

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
} as const

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, ...extra } })
}

export function fail(error: ContactErrorCode, status: number, fields?: Record<string, string>): Response {
  return json({ ok: false, error, ...(fields ? { fields } : {}) }, status)
}

/**
 * Comprobaciones previas a leer el cuerpo: método, tipo, tamaño y origen.
 * `Sec-Fetch-Site` lo pone el navegador y no se puede falsificar desde JavaScript: si existe y no
 * es "same-origin", la petición viene de otra web (CSRF). Las herramientas como curl no lo envían.
 */
export async function readJsonRequest(request: Request): Promise<{ response: Response } | { body: unknown }> {
  if (request.method !== 'POST') {
    return { response: json({ ok: false, error: 'generic' }, 405, { Allow: 'POST' }) }
  }
  const type = (request.headers.get('content-type') ?? '').toLowerCase()
  if (!type.includes('application/json')) return { response: fail('validation', 415) }

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) return { response: fail('validation', 413) }

  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return { response: fail('generic', 403) }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return { response: fail('validation', 413) }

  try {
    return { body: JSON.parse(raw) }
  } catch {
    return { response: fail('validation', 400) }
  }
}

/** Registro estructurado SIN datos personales (solo identificadores técnicos y resultado). */
export function log(entry: { type: string; submissionId: string; locale: string; status: string; ms: number }): void {
  console.log(JSON.stringify({ ...entry, at: new Date().toISOString() }))
}
