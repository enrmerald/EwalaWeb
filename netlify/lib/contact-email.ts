/**
 * Correo interno que recibe Ewala (CONTACT_MAILBOX_TO) por cada envío del formulario de contacto.
 *
 * Mismo lenguaje visual que la web (negro y gris corporativos, acento verde, cabeceras en mono) pero
 * maquetado para correo, no con CSS de la web:
 *  - <table> y CSS en línea: Outlook (motor de Word) no entiende flex/grid y Gmail quita <style>.
 *  - 600 px de ancho. Fuentes del sistema (las web fonts las bloquean muchos clientes).
 *  - El logo es un PNG con URL absoluta (SVG no funciona en Gmail/Outlook) y tiene alt + fondo
 *    propios: si el cliente bloquea imágenes se lee «Ewala» igualmente.
 *  - TODO lo que viene del formulario pasa por esc(): un `<img onerror=…>` en el mensaje se
 *    ejecutaría en el cliente de correo de quien lo lee.
 */
import { SITE_URL } from '../../lib/site'

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

// Paleta corporativa (valores de app/globals.css, literales porque el correo no lee CSS).
const PAGE = '#000000' // --ewala-negro: fondo exterior y banda del logo
const BG = '#2f2f2f' // --ewala-gris-oscuro: tarjeta principal
const CARD = '#262626' // paneles internos
const BORDER = '#4d4d4d' // --ewala-gris-70
const TEXT = '#f2f2f2'
const MUTED = '#a3a3a3'
const GREEN = '#00e58d' // --ewala-verde
const ON_GREEN = '#0f0f0f' // texto sobre verde (--primary-foreground)

const FONT_MONO = "'Space Mono', 'Courier New', Consolas, monospace"
const FONT_BODY = "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"

/** Logo blanco (1000×318) a 2× para pantallas retina; se muestra a 132×42. */
const LOGO_URL = `${SITE_URL}/logo_ewala_blanco.png`

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
  const replySubject = `Re: Ref. ${data.reference} · SentryN3t`

  const rows = [
    row('Nombre', esc(name)),
    row('Empresa', esc(data.company)),
    row('Cargo', role ? esc(role) : muted(notGiven)),
    row('Email', link(`mailto:${data.email}`, data.email)),
    row('Teléfono', phone ? link(`tel:${phone.replace(/[^\d+]/g, '')}`, phone) : muted(notGiven)),
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
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>Nueva consulta sobre SentryN3t</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};color:${TEXT};" bgcolor="${PAGE}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(`${data.needLabel} · ${data.company} · Ref. ${data.reference}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background-color:${PAGE};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
<tr><td bgcolor="${PAGE}" style="padding:0 4px 20px 4px;background-color:${PAGE};">
<img src="${LOGO_URL}" alt="Ewala" width="132" height="42" style="display:block;border:0;outline:none;width:132px;height:42px;font-family:${FONT_MONO};font-size:20px;font-weight:bold;color:${TEXT};" />
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BG}" style="background-color:${BG};border:1px solid ${BORDER};border-top:3px solid ${GREEN};border-radius:10px;">
<tr><td style="padding:28px 28px 20px 28px;">
<p style="margin:0;font-family:${FONT_MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GREEN};">SentryN3t Protection · Contacto web</p>
<h1 style="margin:10px 0 0 0;font-family:${FONT_BODY};font-size:24px;line-height:1.25;font-weight:700;color:${TEXT};">Nueva consulta de ${esc(data.company)}</h1>
<p style="margin:12px 0 0 0;font-family:${FONT_BODY};font-size:15px;line-height:1.5;color:${MUTED};">Interés: <strong style="color:${TEXT};">${esc(data.needLabel)}</strong></p>
</td></tr>
<tr><td style="padding:0 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};border:1px solid ${BORDER};border-radius:8px;">
<tr><td style="padding:14px 16px;font-family:${FONT_BODY};font-size:13px;line-height:1.6;color:${MUTED};">
Referencia: <strong style="font-family:${FONT_MONO};font-size:15px;color:${GREEN};">${esc(data.reference)}</strong><br />
Recibido: ${esc(received)}
</td></tr>
</table>
</td></tr>
<tr><td style="padding:28px 28px 0 28px;">
${heading('Contacto')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
</td></tr>
<tr><td style="padding:28px 28px 0 28px;">
${heading('Mensaje')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CARD}" style="background-color:${CARD};border-left:3px solid ${GREEN};border-radius:4px;">
<tr><td style="padding:16px 18px;font-family:${FONT_BODY};font-size:15px;line-height:1.7;color:${message ? TEXT : MUTED};">${message ? esc(message).replace(/\r?\n/g, '<br />') : 'Sin mensaje.'}</td></tr>
</table>
</td></tr>
<tr><td style="padding:28px 28px 0 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${GREEN}" style="background-color:${GREEN};border-radius:6px;">
<a href="${esc(`mailto:${data.email}?subject=${encodeURIComponent(replySubject)}`)}" style="display:inline-block;padding:12px 22px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${ON_GREEN};text-decoration:none;">Responder a ${esc(data.firstName)}</a>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:28px 28px 0 28px;">
${heading('Consentimientos')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${consents}</table>
</td></tr>
<tr><td style="padding:28px;">
<p style="margin:0;padding-top:18px;border-top:1px solid ${BORDER};font-family:${FONT_BODY};font-size:12px;line-height:1.6;color:${TEXT};">También puedes responder a este correo: llegará directamente a la persona. La web promete respuesta en menos de 24 h laborables.</p>
<p style="margin:10px 0 0 0;font-family:${FONT_MONO};font-size:11px;line-height:1.6;color:${MUTED};">Envío ${esc(data.submissionId)} · entorno ${esc(data.environment)} · mensaje automático de ewala.es</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

  const text = [
    'NUEVA CONSULTA SOBRE SENTRYN3T',
    '',
    `Interés: ${data.needLabel}`,
    `Referencia: ${data.reference}`,
    `Recibido: ${received}`,
    '',
    '-- Contacto --',
    `Nombre: ${name}`,
    `Empresa: ${data.company}`,
    `Cargo: ${role ?? notGiven}`,
    `Email: ${data.email}`,
    `Teléfono: ${phone ?? notGiven}`,
    `Idioma de la web: ${data.locale.toUpperCase()}`,
    '',
    '-- Mensaje --',
    message ?? 'Sin mensaje.',
    '',
    '-- Consentimientos --',
    'Política de privacidad: Aceptada',
    `Comunicaciones comerciales: ${data.marketing ? 'Sí' : 'No'}`,
    '',
    'Responde a este correo para escribir directamente a la persona. La web promete respuesta en menos de 24 h laborables.',
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
