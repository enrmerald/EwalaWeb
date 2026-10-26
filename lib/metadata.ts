import type { Metadata, ResolvingMetadata } from 'next'

interface PageOpenGraph {
  title: string
  description: string
  locale: string
  /** Ruta relativa (se resuelve contra `metadataBase`), normalmente el canonical de la página. */
  url: string
}

/**
 * Next NO fusiona `openGraph` entre layout y página: si la página lo define, sustituye al del layout
 * entero y pierde `siteName`, `type` y la imagen social (`opengraph-image`). Con esto las páginas
 * interiores heredan lo común del layout y solo pisan lo suyo. `twitter:card` lo deriva Next solo:
 * `summary_large_image` si hay imagen, `summary` si no.
 */
export async function pageOpenGraph(
  parent: ResolvingMetadata,
  og: PageOpenGraph,
): Promise<Metadata['openGraph']> {
  const inherited = (await parent).openGraph
  return { ...inherited, ...og } as Metadata['openGraph']
}
