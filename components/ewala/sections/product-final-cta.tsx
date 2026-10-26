import { ArrowRight } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'
import type { Locale } from '@/i18n/config'
import { SHOW_DEMO_CTA } from '@/lib/features'

interface ProductFinalCtaProps {
  t: ProductLanding['finalCta']
  locale: Locale
}

export function ProductFinalCta({ t, locale }: ProductFinalCtaProps) {
  const checks = t.checks as string[]

  return (
    <section className="bg-section-dark py-20 lg:py-28 relative overflow-hidden">
      {/* Glow de acento */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, color-mix(in oklab, var(--brand) 8%, transparent), transparent)',
        }}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl lg:text-5xl font-bold text-white font-mono leading-tight">
          {t.headline}
        </h2>
        <p className="text-white/70 text-lg mt-5 leading-relaxed">{t.description}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <a
            href={`/${locale}/contacto/`}
            className="bg-[var(--brand)] text-[var(--brand-foreground)] font-bold px-8 py-4 rounded-xl text-base shadow-[0_8px_32px_color-mix(in_oklab,var(--brand)_30%,transparent)] hover:brightness-110 transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
          >
            {/* Sin demo activa, el botón principal pasa a «Contáctanos» (mismo destino). */}
            {SHOW_DEMO_CTA ? t.ctaPrimary : t.ctaContact}
            <ArrowRight className="w-5 h-5" />
          </a>
          {/* Descarga de PoC sin destino todavía (href="#"): oculta junto con la demo. */}
          {SHOW_DEMO_CTA && (
            <a
              href="#"
              className="border border-white/30 text-white hover:bg-white/[0.06] hover:border-white/50 font-semibold px-8 py-4 rounded-xl text-base transition-all inline-flex items-center justify-center"
            >
              {t.ctaSecondary}
            </a>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          {checks.map((check) => (
            <span key={check} className="text-sm text-white/60 flex items-center gap-1.5">
              <span className="text-[var(--brand)]">✓</span> {check}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
