import Image from 'next/image'
import type { Messages } from '@/i18n/types'

interface Poster {
  src: string
  width: number
  height: number
  title: string
  alt: string
}

interface PostersGridProps {
  t: Messages['sellos']
}

export function PostersGrid({ t }: PostersGridProps) {
  const posters = t.posters as Poster[]

  if (posters.length === 0) return null

  return (
    <section className="bg-section-light py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-on-light font-mono">{t.postersHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-light-muted leading-relaxed">{t.postersIntro}</p>

        {/*
          Los 3 carteles miden lo mismo (1080×761, ver scripts/generar-carteles-recursos.py) y se pintan en una
          caja de proporción fija: misma altura y anchura sin huecos. Una columna bajo `lg` (con 2 columnas el
          3.º cartel quedaba solo en la segunda fila) y tres iguales desde `lg`.
        */}
        <ul className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
          {posters.map((poster) => (
            <li key={poster.src}>
              <figure>
                <div className="aspect-[1080/761] w-full overflow-hidden rounded-xl border border-black/10 bg-white">
                  <Image
                    src={poster.src}
                    alt={poster.alt}
                    width={poster.width}
                    height={poster.height}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 font-mono text-sm text-on-light-muted">{poster.title}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
