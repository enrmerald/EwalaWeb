/**
 * `POST /api/csp-report` (netlify.toml lo reescribe a esta función) · sumidero de informes de la CSP.
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

const asText = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined)

/** Deja solo origen + ruta. Valores como 'inline', 'eval' o 'data' no son URL y se recortan tal cual. */
function withoutQuery(value: unknown): string | undefined {
  const raw = asText(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return `${url.origin}${url.pathname}`
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

export default async function handler(request: Request): Promise<Response> {
  // Siempre 204: el navegador no espera respuesta y no puede hacer nada con un error.
  const noContent = () =>
    new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })

  if (request.method !== 'POST') return noContent()

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) return noContent()

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return noContent()

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
