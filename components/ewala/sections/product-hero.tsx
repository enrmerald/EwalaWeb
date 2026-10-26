import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'
import type { Locale } from '@/i18n/config'
import { SHOW_DEMO_CTA } from '@/lib/features'
import { HeroScreenshotCarousel } from '../hero-screenshot-carousel'

interface ProductHeroProps {
  t: ProductLanding['hero']
  active: boolean
  locale: Locale
}

// En sentrynet-horizontal-dark.svg el nombre «SentryN3t» empieza al ~21% del ancho (tras el icono):
// el lema se alinea con el nombre, no con el icono.
const WORDMARK_OFFSET = '20.9%'

/**
 * Logo horizontal de SentryN3t como antetítulo del hero, con el lema («Network Detection &
 * Response») debajo del nombre: Space Mono en mayúsculas espaciadas, iniciales en verde de marca.
 */
function ProductLockup({ t }: { t: ProductLanding['hero'] }) {
  const words = t.logoTagline.split(' ')
  return (
    <div className="w-56 sm:w-64 xl:w-72">
      <Image
        src="/sentrynet-horizontal-dark.svg"
        alt={t.logoAlt}
        width={871}
        height={145}
        priority
        className="block w-full h-auto"
      />
      <p
        className="mt-1.5 font-mono uppercase whitespace-nowrap text-[10px] sm:text-[11px] xl:text-xs tracking-[0.2em] text-white/60"
        style={{ paddingLeft: WORDMARK_OFFSET }}
      >
        {words.map((word, i) => (
          <span key={i}>
            {i > 0 && ' '}
            {/^[a-z]/i.test(word) ? <span className="text-[var(--brand)] font-bold">{word[0]}</span> : word[0]}
            {word.slice(1)}
          </span>
        ))}
      </p>
    </div>
  )
}

export function ProductHero({ t, active, locale }: ProductHeroProps) {
  const stats = t.stats as Array<{ value: string; label: string }>
  const parts = t.headlineParts as string[]
  const Heading = active ? 'h1' : 'p'

  return (
    <section className="bg-section-dark relative overflow-hidden">
      {/* Ambient green glow top-right */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--brand) 10%, transparent), transparent 70%)',
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-36 pb-14 lg:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-14 items-center">
          {/* Texto: marca de producto → titular → descripción → acciones */}
          <div>
            <ProductLockup t={t} />

            <Heading className="mt-6 lg:mt-8 text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] font-bold leading-[1.08] tracking-tight font-mono text-white">
              {parts[0]} {parts[1]} <span className="text-[var(--brand)]">{parts[2]}</span>
            </Heading>

            <p className="text-base lg:text-lg text-white/75 max-w-xl leading-relaxed mt-6">{t.description}</p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 whitespace-nowrap">
              <a
                href={`/${locale}/contacto`}
                className="bg-[var(--brand)] text-[var(--brand-foreground)] font-semibold px-8 py-4 rounded-xl text-base shadow-xl shadow-[color-mix(in_oklab,var(--brand)_25%,transparent)] hover:shadow-[color-mix(in_oklab,var(--brand)_40%,transparent)] transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2.5"
              >
                {t.ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </a>
              {/* Lleva al formulario con «Demo SentryN3t» preseleccionado (ContactForm lee ?need=). Oculto hasta que la demo esté activa. */}
              {SHOW_DEMO_CTA && (
                <a
                  href={`/${locale}/contacto?need=demo`}
                  className="border border-white/20 text-white hover:bg-white/[0.06] hover:border-white/30 font-semibold px-8 py-4 rounded-xl text-base transition-all inline-flex items-center justify-center gap-2"
                >
                  {t.ctaSecondary}
                </a>
              )}
            </div>
          </div>

          <div>
            <HeroScreenshotCarousel t={t.carousel} />
          </div>
        </div>

        {/* Franja de cifras a todo el ancho: cierra el hero y da a cada cifra espacio para una sola fila */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 mt-14 lg:mt-16 border-t border-white/10">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`pt-6 lg:pt-8 ${i % 2 === 1 ? 'pl-4 sm:pl-6' : ''} ${i > 0 ? 'lg:pl-8 lg:border-l lg:border-white/10' : ''} ${i < 2 ? 'pb-2 lg:pb-0' : ''}`}
            >
              <dt className="text-xl sm:text-2xl xl:text-3xl font-bold text-white font-mono sm:whitespace-nowrap">{stat.value}</dt>
              <dd className="text-sm text-white/65 mt-1.5 leading-snug max-w-[240px]">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
