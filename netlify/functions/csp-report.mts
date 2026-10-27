/**
 * `POST /api/csp-report` (ruta propia de la función, ver `config` más abajo; netlify.toml NO la reescribe)
 * · sumidero de informes de la CSP.
 *
 * La CSP va en modo `Report-Only`: no bloquea nada, solo informa. Sin un sumidero, el navegador
 * detecta las infracciones y no las manda a ninguna parte, y nunca podríamos pasar la política a
 * bloqueo con seguridad. Con esto, los logs de la función (Netlify → Logs → Functions → csp-report)
 * dicen exactamente qué orígenes faltan en la política (p. ej. al instalar Cookiebot).
 *
 * Extensión .mts (módulo ES) obligatoria: package.json no declara "type": "module" y, con .ts,
 * Netlify la trataría como CommonJS con la firma antigua de Lambda (event, context) en vez de
 * recibir un Request. Así está documentado en https://ntl.fyi/functions-runtime.
 *
 * Abuso: la ruta es pública y sin autenticación (la llaman los navegadores de cualquier visitante), así
 * que el freno es un límite de peticiones en el borde de Netlify (`config.rateLimit`, antes de ejecutar
 * la función) y un tope de tamaño, de informes por petición y de longitud de cada campo registrado.
 *
 * Privacidad: NO se registra el informe entero. Puede incluir `script-sample` (un trozo de código) y
 * la URL completa con su query, que podría llevar datos de quien navegaba. Solo se guarda la
 * directiva, el origen bloqueado y la RUTA del documento, sin query ni fragmento.
 */

interface ClassicReport {
  'csp-report'?: {
    'violated-directive'?: unknown
    'effective-directive'?: unknown
    'blocked-uri'?: unknown
    'document-uri'?: unknown
  }
}

interface ReportingApiReport {
  type?: unknown
  body?: { effectiveDirective?: unknown; blockedURL?: unknown; documentURL?: unknown }
}

interface Violation {
  directive: string
  blocked: string
  document: string
}

/** Un informe legítimo no se acerca ni de lejos a este tamaño. */
const MAX_BODY_BYTES = 16 * 1024

/** Informes registrados como máximo por petición: un lote `report-to` de 16 KB podría traer cientos. */
const MAX_VIOLATIONS = 20

/** Longitud máxima de cada campo registrado. */
const MAX_FIELD_LENGTH = 200

/** Tipos con los que los navegadores envían informes CSP (`report-uri`, `report-to` y `fetch` genérico). */
const REPORT_CONTENT_TYPES = ['application/csp-report', 'application/reports+json', 'application/json']

/** Ruta pública de la función: la sirve Netlify por `config.path`, sin regla en netlify.toml. */
const CSP_REPORT_PATH = '/api/csp-report'

/**
 * Ruta y límite de peticiones en el borde de Netlify, ANTES de ejecutar la función (no gasta
 * invocaciones). Con `path`, la función deja de servirse en /.netlify/functions/csp-report, y una regla de
 * reescritura de netlify.toml hacia esa ruta daría 404 (ver la nota de contact.mts), por eso no existe.
 * Debe ser un literal: Netlify lo lee del código sin ejecutarlo. Un informe es una petición por
 * infracción, así que el margen es mayor que el del formulario; al superarlo Netlify responde 429, que el
 * navegador ignora. El plan Free admite 2 reglas de límite: esta es la segunda (la otra es contact.mts).
 */
export const config = {
  path: '/api/csp-report',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}

const asText = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value.slice(0, MAX_FIELD_LENGTH) : undefined

/** Deja solo origen + ruta. Valores como 'inline', 'eval' o 'data' no son URL y se recortan tal cual. */
function withoutQuery(value: unknown): string | undefined {
  const raw = asText(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`.slice(0, MAX_FIELD_LENGTH)
  } catch {
    return raw.slice(0, 80)
  }
}

/** Normaliza el formato clásico (`report-uri`) y el de la Reporting API (`report-to`, en lote). */
function normalize(body: unknown): Violation[] {
  const out: Violation[] = []
  const add = (directive?: string, blocked?: string, document?: string) =>
    out.push({ directive: directive ?? 'unknown', blocked: blocked ?? 'unknown', document: document ?? 'unknown' })

  if (Array.isArray(body)) {
    for (const report of body as ReportingApiReport[]) {
      if (out.length >= MAX_VIOLATIONS) break
      if (report?.type !== 'csp-violation') continue
      add(asText(report.body?.effectiveDirective), withoutQuery(report.body?.blockedURL), withoutQuery(report.body?.documentURL))
    }
    return out
  }

  const classic = (body as ClassicReport)?.['csp-report']
  if (classic) {
    add(
      asText(classic['effective-directive']) ?? asText(classic['violated-directive']),
      withoutQuery(classic['blocked-uri']),
      withoutQuery(classic['document-uri']),
    )
  }
  return out
}

/**
 * Lee el cuerpo sin pasar de MAX_BODY_BYTES: `Content-Length` puede faltar (transferencia fragmentada) o
 * mentir, así que se cuenta lo que llega y se corta al superar el tope. `undefined` = demasiado grande.
 */
async function readBoundedText(request: Request): Promise<string | undefined> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > MAX_BODY_BYTES) {
      await reader.cancel()
      return undefined
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

export default async function handler(request: Request): Promise<Response> {
  // Siempre 204: el navegador no espera respuesta y no puede hacer nada con un error.
  const noContent = () =>
    new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

  // Defensa en profundidad: solo se atiende la ruta pública (la única con límite de peticiones).
  const pathname = new URL(request.url).pathname.replace(/\/+$/, '')
  if (pathname !== CSP_REPORT_PATH) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })

  if (request.method !== 'POST') return noContent()

  const type = (request.headers.get('content-type') ?? '').toLowerCase()
  if (!REPORT_CONTENT_TYPES.some((accepted) => type.startsWith(accepted))) return noContent()

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) return noContent()

  const raw = await readBoundedText(request)
  if (raw === undefined) return noContent()

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return noContent()
  }

  for (const v of normalize(body)) {
    // Una línea JSON por infracción: se puede filtrar en los logs de Netlify por "csp-violation".
    console.log(JSON.stringify({ type: 'csp-violation', ...v, at: new Date().toISOString() }))
  }
  return noContent()
}
