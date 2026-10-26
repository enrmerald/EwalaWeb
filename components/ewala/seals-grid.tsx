import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import type { Messages } from '@/i18n/types'

// El src de cada imagen es un asset local (no traducible); se mapea por `id` sobre el contenido
// traducible que vive en messages/*.json → sellos.seals (mismo patrón que logo-carousel.tsx).
// `heightClass` fija la altura visual del logo; el ancho sale de su proporción.
interface SealImage {
  src: string
  width: number
  height: number
  heightClass: string
}

const SEAL_IMAGE: Record<string, SealImage> = {
  'pyme-innovadora': { src: '/sellos/pyme-innovadora-sello.jpg', width: 142, height: 153, heightClass: 'h-24' },
  'empresa-emergente': { src: '/sellos/enisa-empresa-emergente.webp', width: 1000, height: 731, heightClass: 'h-36' },
  'eibt': { src: '/team/EIBT.png', width: 570, height: 346, heightClass: 'h-36' },
  'spain-101': { src: '/sellos/top101-spain-up-nation-2025.svg', width: 305, height: 258, heightClass: 'h-36' },
  'igualdad': {
    src: '/team/LOG-0001-01-EWALA-Marca-Asturiana-de-igualdad-400.png',
    width: 400,
    height: 283,
    heightClass: 'h-36',
  },
  'premios-industria-40': { src: '/sellos/premios-industria-40-2025.png', width: 1122, height: 390, heightClass: 'h-36' },
}

// Escudo del Ministerio que acompaña al sello Pyme innovadora (así lo publica el registro oficial).
const PYME_EMBLEM = { src: '/sellos/pyme-innovadora-escudo.jpg', width: 238, height: 63 }

interface Seal {
  id: string
  name: string
  description: string
  alt: string
  validity?: string
  href?: string
  hrefLabel?: string
  emblemAlt?: string
}

interface SealsGridProps {
  t: Messages['sellos']
}

export function SealsGrid({ t }: SealsGridProps) {
  const seals = (t.seals as Seal[]).filter((seal) => Boolean(SEAL_IMAGE[seal.id]))

  return (
    <section className="bg-section-dark py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white font-mono">{t.sealsHeading}</h2>

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {seals.map((seal) => {
            const image = SEAL_IMAGE[seal.id]

            return (
              <li key={seal.id} className="flex">
                {/* Placa blanca: los logos oficiales están diseñados para fondo claro. */}
                <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex h-52 flex-col items-center justify-center gap-3 p-6">
                    <Image
                      src={image.src}
                      alt={seal.alt}
                      width={image.width}
                      height={image.height}
                      className={`${image.heightClass} w-auto max-w-full object-contain`}
                    />
                    {seal.id === 'pyme-innovadora' && (
                      <Image
                        src={PYME_EMBLEM.src}
                        alt={seal.emblemAlt ?? ''}
                        width={PYME_EMBLEM.width}
                        height={PYME_EMBLEM.height}
                        className="h-10 w-auto max-w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col border-t border-black/10 p-5">
                    <h3 className="font-mono text-sm font-semibold text-on-light">{seal.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-on-light-muted">{seal.description}</p>
                    {seal.validity && <p className="mt-2 text-xs text-on-light-subtle">{seal.validity}</p>}
                    {seal.href && seal.hrefLabel && (
                      <a
                        href={seal.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 self-start rounded text-sm font-medium text-on-light underline decoration-[var(--primary)] decoration-2 underline-offset-4 transition-colors hover:text-on-light-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
                      >
                        {seal.hrefLabel}
                        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
