import type esMessages from '../messages/es.json'
export type Messages = typeof esMessages

export type ProductId = 'sentryn3t'
export type ProductLanding = Messages['products']['sentryn3t']

/**
 * Páginas legales (`legal.*` en messages). El JSON infiere uniones laxas para los bloques, así que
 * las páginas castean con `as unknown as LegalDoc`. Marcado inline admitido en los textos:
 * `**negrita**` y `[etiqueta](href)`.
 */
export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'dl'; rows: { term: string; def: string }[] }
  | { type: 'table'; head: string[]; rows: string[][] }

export interface LegalSection {
  title: string
  blocks: LegalBlock[]
}

export interface LegalDoc {
  meta: { title: string; description: string }
  breadcrumb: string
  title: string
  subtitle: string
  updated: string
  sections: LegalSection[]
}

export interface LegalCommon {
  breadcrumbHome: string
  updatedLabel: string
  tocLabel: string
}
