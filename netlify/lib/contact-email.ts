/**
 * Correo interno que recibe Ewala (CONTACT_MAILBOX_TO) por cada envío del formulario de contacto.
 *
 * Reglas de maquetación de correo (no se parece a la web a propósito):
 *  - <table> y CSS en línea: Outlook (motor de Word) no entiende flex/grid y Gmail quita <style>.
 *  - 600 px de ancho, sin imágenes ni fuentes web (muchos clientes las bloquean).
 *  - TODO lo que viene del formulario pasa por esc(): un `<img onerror=…>` en el mensaje se
 *    ejecutaría en el cliente de correo de quien lo lee.
 */

export interface ContactEmailData {
  reference: string
  submissionId: string
  locale: 'es' | 'en'
  receivedAt: Date
  environment: string
  firstName: string
  lastName?: string
  company: string
  email: string
  phone?: string
  role?: string
  needLabel: string
  message?: string
  marketing: boolean
}

// Colores corporativos (mismos valores que app/globals.css, literales porque el correo no lee CSS).
const BG = '#2f2f2f'
const PANEL = '#262626'
const CARD = '#1f1f1f'
const BORDER = '#3d3d3d'
const TEXT = '#f2f2f2'
const MUTED = '#a3a3a3'
const GREEN = '#00e58d'

const FONT_MONO = "'Courier New', Consolas, monospace"
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

export function contactSubject(data: ContactEmailData): string {
  const prefix = data.environment === 'production' ? '' : `[${data.environment.toUpperCase()}] `
  return `${prefix}Contacto web · ${data.needLabel} · Ref. ${data.reference}`
}

export function contactEmail(data: ContactEmailData): { html: string; text: string } {
  const name = `${data.firstName} ${data.lastName ?? ''}`.trim()
  const received = `${new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(data.receivedAt)} (hora peninsular)`
  const phone = data.phone?.trim() || null
  const role = data.role?.trim() || null
  const message = data.message?.trim() || null
  const notGiven = 'No indicado'

  const rows = [
    row('Nombre', esc(name)),
    row('Empresa', esc(data.company)),
    row('Cargo', role ? esc(role) : muted(notGiven)),
    row('Email', link(`mailto:${data.email}`, data.email)),
    row('Teléfono', phone ? link(`tel:${phone.replace(/[^\d+]/g, '')}`, phone) : muted(notGiven)),
    row('Necesidad', esc(data.needLabel)),
    row('Idioma de la web', data.locale.toUpperCase()),
  ].join('')

  const consents = [
    row('Política de privacidad', `<span style="color:${GREEN};">Aceptada</span>`),
    row('Comunicaciones comerciales', data.marketing ? `<span style="color:${GREEN};">Sí</span>` : muted('No')),
  ].join('')

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<title>Nueva consulta desde la web</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};color:${TEXT};" bgcolor="${BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(`Nueva consulta · ${data.needLabel} · ${data.company}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background-color:${BG};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${PANEL}" style="width:600px;max-width:100%;background-color:${PANEL};border:1px solid ${BORDER};border-top:4px solid ${GREEN};border-radius:8px;">
<tr><td style="padding:24px 28px 16px 28px;border-bottom:1px solid ${BORDER};">
<p style="margin:0;font-family:${FONT_MONO};font-size:20px;font-weight:bold;color:${TEXT};">ewala</p>
<p style="margin:12px 0 0 0;font-family:${FONT_MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${GREEN};">Formulario de contacto</p>
<h1 style="margin:6px 0 0 0;font-family:${FONT_MONO};font-size:20px;line-height:1.3;color:${TEXT};">Nueva consulta desde la web</h1>
</td></tr>
<tr><td style="padding:18px 28px 0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:8px;">
<tr><td style="padding:14px 16px;font-family:${FONT_BODY};font-size:13px;color:${MUTED};">
Referencia: <strong style="font-family:${FONT_MONO};font-size:15px;color:${GREEN};">${esc(data.reference)}</strong><br />
Recibido: ${esc(received)}
</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 28px 0 28px;">
${heading('Contacto')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
</td></tr>
<tr><td style="padding:24px 28px 0 28px;">
${heading('Mensaje')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:8px;">
<tr><td style="padding:16px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${message ? TEXT : MUTED};">${message ? esc(message).replace(/\r?\n/g, '<br />') : 'Sin mensaje.'}</td></tr>
</table>
</td></tr>
<tr><td style="padding:24px 28px 0 28px;">
${heading('Consentimientos')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${consents}</table>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0;padding-top:16px;border-top:1px solid ${BORDER};font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:${TEXT};">Responde a este correo para escribir directamente a la persona.</p>
<p style="margin:6px 0 0 0;font-family:${FONT_BODY};font-size:12px;color:${MUTED};">La web promete respuesta en menos de 24 h laborables.</p>
<p style="margin:12px 0 0 0;font-family:${FONT_MONO};font-size:11px;color:${MUTED};">Envío ${esc(data.submissionId)} · entorno ${esc(data.environment)} · mensaje automático de ewala.es</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    'NUEVA CONSULTA DESDE LA WEB',
    '',
    `Referencia: ${data.reference}`,
    `Recibido: ${received}`,
    '',
    '-- Contacto --',
    `Nombre: ${name}`,
    `Empresa: ${data.company}`,
    `Cargo: ${role ?? notGiven}`,
    `Email: ${data.email}`,
    `Teléfono: ${phone ?? notGiven}`,
    `Necesidad: ${data.needLabel}`,
    `Idioma de la web: ${data.locale.toUpperCase()}`,
    '',
    '-- Mensaje --',
    message ?? 'Sin mensaje.',
    '',
    '-- Consentimientos --',
    'Política de privacidad: Aceptada',
    `Comunicaciones comerciales: ${data.marketing ? 'Sí' : 'No'}`,
    '',
    'Responde a este correo para escribir directamente a la persona.',
    `Envío ${data.submissionId} · entorno ${data.environment} · mensaje automático de ewala.es`,
  ].join('\n')

  return { html, text }
}

const heading = (label: string) =>
  `<p style="margin:0 0 10px 0;font-family:${FONT_MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};">${esc(label)}</p>`

const row = (label: string, value: string) => `<tr>
<td width="34%" style="padding:6px 12px 6px 0;vertical-align:top;font-family:${FONT_BODY};font-size:13px;color:${MUTED};">${esc(label)}</td>
<td style="padding:6px 0;vertical-align:top;font-family:${FONT_BODY};font-size:15px;color:${TEXT};">${value}</td>
</tr>`

const muted = (value: string) => `<span style="color:${MUTED};">${esc(value)}</span>`

const link = (href: string, label: string) =>
  `<a href="${esc(href)}" style="color:${GREEN};text-decoration:underline;">${esc(label)}</a>`

/** Escapado HTML de todo dato que venga del formulario. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
