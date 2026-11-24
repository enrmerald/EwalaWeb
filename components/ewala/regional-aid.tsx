import Image from 'next/image'
import type { Messages } from '@/i18n/types'

type Props = {
  t: Messages['sellos']['regionalAid']
}

export function RegionalAid({ t }: Props) {
  const { poster } = t

  return (
    <section className="bg-section-light pb-16 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-on-light font-mono">{t.heading}</h2>
        <p className="mt-3 max-w-2xl text-on-light-muted leading-relaxed">{t.intro}</p>

        {/*
          El cartel mide 1142×764 (no 1080×761 como los europeos): se pinta a su proporción natural, sin
          `object-cover`, que recortaría el marco verde. Su texto legal es pequeño, así que en pantallas
          estrechas la placa se desplaza en horizontal en vez de encoger la imagen.
        */}
        <figure className="mt-10 max-w-3xl overflow-x-auto rounded-xl border border-black/10 bg-white">
          <Image
            src={poster.src}
            alt={poster.alt}
            width={poster.width}
            height={poster.height}
            className="h-auto w-full min-w-[560px]"
          />
          <figcaption className="border-t border-black/10 p-4 text-sm text-on-light-muted">
            <span className="block font-mono">{poster.title}</span>
            <span className="mt-1 block leading-relaxed">{poster.caption}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
