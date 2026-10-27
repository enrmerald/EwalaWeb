import Image from 'next/image'
import type { Messages } from '@/i18n/types'

type Props = {
  t: Messages['sellos']['fundingBanner']
}

interface Logo {
  src: string
  alt: string
  width: number
  height: number
}

export function FundingBanner({ t }: Props) {
  const logos = t.logos as Logo[]

  return (
    <section className="bg-section-dark border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-base font-mono font-semibold text-white mb-3">
          {t.headline}
        </h2>
        <p className="text-sm text-white/60 max-w-2xl leading-relaxed mb-10 text-justify hyphens-auto">
          {t.description}
        </p>
        {logos.length > 0 && (
          <div className="flex flex-col gap-4">
            {logos.map((logo) => (
              // Los logos oficiales están pensados para fondo claro: placa blanca. En móvil la placa
              // se desplaza en horizontal para que el texto de los logos siga siendo legible.
              <div key={logo.src} className="overflow-x-auto rounded-xl bg-white p-4">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width}
                  height={logo.height}
                  className="h-auto w-full min-w-[640px] max-w-5xl"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
