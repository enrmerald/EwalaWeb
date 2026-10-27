#!/usr/bin/env node
/**
 * Comprueba que messages/es.json y messages/en.json tienen exactamente las mismas claves
 * (CLAUDE.md: TypeScript solo valida es.json, la simetría con en.json no la comprueba nadie más).
 * Sin dependencias: solo Node. Sale con código 1 si hay claves que faltan en algún idioma.
 *
 * Uso: pnpm verify:i18n
 */
import { readFileSync } from 'node:fs'

const leer = (idioma) => JSON.parse(readFileSync(new URL(`../messages/${idioma}.json`, import.meta.url), 'utf8'))

// Claves en notación de puntos; los arrays cuentan por índice (una lista más corta es una asimetría).
const claves = (valor, prefijo = '') =>
  valor !== null && typeof valor === 'object'
    ? Object.entries(valor).flatMap(([k, v]) => claves(v, `${prefijo}${k}.`))
    : [prefijo.slice(0, -1)]

const es = new Set(claves(leer('es')))
const en = new Set(claves(leer('en')))
const soloEs = [...es].filter((k) => !en.has(k))
const soloEn = [...en].filter((k) => !es.has(k))

if (soloEs.length || soloEn.length) {
  for (const k of soloEs) console.error(`Falta en en.json: ${k}`)
  for (const k of soloEn) console.error(`Falta en es.json: ${k}`)
  process.exit(1)
}
console.log(`i18n simétrico: ${es.size} claves en es.json y en.json`)
