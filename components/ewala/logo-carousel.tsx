import Image from "next/image"
import type { CSSProperties } from "react"
import type { Messages } from "@/i18n/types"

// El src de cada logo es un asset local (no traducible); se mapea por `name` sobre el contenido
// { name, href, alt } que sí vive en messages/*.json. Aquí solo van los partners (carrusel de la
// home y de /compania); los sellos y reconocimientos viven en la página /sellos-y-reconocimientos.
const SEAL_SRC: Record<string, string> = {
  "INCIBE": "/team/incibe.png",
  "CCI": "/team/cci.png",
  "Industria 4.0": "/team/industria.png",
  "Femetal Industry": "/team/femetalindustry-logo.png",
  "Cluster TIC Asturias": "/team/clustertic_asturias.png",
  // Versión sin el margen vacío del original (asturcon.tech.png, 400×400): a la misma altura se ve del tamaño de los demás.
  "AsturCon Tech": "/team/asturcon-tech-recortado.png",
}

// Segundos por logo: la velocidad del carrusel se mantiene constante aunque cambie el número de partners.
const SECONDS_PER_LOGO = 3

interface Seal {
  name: string
  href: string
  alt: string
}

interface LogoCarouselProps {
  t: Messages["logoCarousel"]
}

function LogoLink({ seal, focusable }: { seal: Seal; focusable: boolean }) {
  return (
    <a
      href={seal.href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={focusable ? undefined : -1}
      className="flex-shrink-0 h-16 md:h-20 px-8 bg-white border border-black/10 rounded-lg flex items-center justify-center grayscale opacity-50 hover:opacity-85 hover:grayscale-0 focus-visible:opacity-85 focus-visible:grayscale-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60 transition-all duration-300"
    >
      <Image
        src={SEAL_SRC[seal.name]}
        alt={seal.alt}
        width={180}
        height={80}
        className="object-contain h-12 w-auto md:h-14 lg:h-16 transition-all duration-300"
      />
    </a>
  )
}

export function LogoCarousel({ t }: LogoCarouselProps) {
  const seals = (t.seals as Seal[]).filter((seal) => Boolean(SEAL_SRC[seal.name]))
  const marqueeStyle = { "--marquee-duration": `${seals.length * SECONDS_PER_LOGO}s` } as CSSProperties

  return (
    <section className="bg-white border-y border-black/[0.06] py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 lg:gap-12">

        <span className="hidden lg:block text-xs tracking-widest uppercase text-on-light-subtle w-32 flex-shrink-0">
          {t.trusted}
        </span>

        {/* Con "reducir movimiento" el carrusel se detiene, se oculta la copia duplicada y se puede desplazar a mano. */}
        <div className="flex-1 overflow-hidden motion-reduce:overflow-x-auto relative">
          {/* Dos copias del mismo set: -50% desplaza exactamente un set, de modo que el bucle no tiene saltos.
              Cada logo lleva su propio margen derecho (en vez de `gap`) para que las dos mitades midan lo mismo. */}
          <div className="logo-marquee flex w-max" style={marqueeStyle}>
            <ul className="flex flex-shrink-0 [&>li]:mr-12">
              {seals.map((seal) => (
                <li key={seal.name}>
                  <LogoLink seal={seal} focusable />
                </li>
              ))}
            </ul>
            <ul className="flex flex-shrink-0 [&>li]:mr-12 motion-reduce:hidden" aria-hidden="true">
              {seals.map((seal) => (
                <li key={seal.name}>
                  <LogoLink seal={seal} focusable={false} />
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  )
}
