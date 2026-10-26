import { ArrowRight, Network, Cpu, Database, Bell, Users, ShieldCheck } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'
import type { Locale } from '@/i18n/config'
import { SHOW_DEMO_CTA } from '@/lib/features'

interface ProductShowcaseProps {
  t: ProductLanding['showcase']
  locale: Locale
}

type CardItem = { title: string; description: string }

// El orden debe coincidir 1:1 con el orden de `cards` en messages/*.json (mapeo posicional).
const BENTO_CARDS_VISUAL = [
  { icon: Network,     border: 'border-black/10',                                           colSpan: 'col-span-2', hasSvg: true },
  { icon: Cpu,         border: 'border-[color-mix(in_oklab,var(--brand)_25%,transparent)]', colSpan: '',           hasSvg: false },
  { icon: Database,    border: 'border-black/10',                                           colSpan: '',           hasSvg: false },
  { icon: Bell,        border: 'border-black/10',                                           colSpan: 'col-span-2', hasSvg: false, iconColor: 'text-amber-400' },
  { icon: Users,       border: 'border-black/10',                                           colSpan: '',           hasSvg: false },
  { icon: ShieldCheck, border: 'border-[color-mix(in_oklab,var(--brand)_25%,transparent)]', colSpan: '',           hasSvg: false },
]

function ShowcaseBento({ t, locale }: { t: ProductLanding['showcase']; locale: Locale }) {
  const tags = t.tags as string[]
  const cards = (t.cards as CardItem[]).map((card, i) => ({
    ...card,
    ...BENTO_CARDS_VISUAL[i],
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-start">
      <div>
        <span className="inline-flex items-center gap-1.5 bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] border border-[color-mix(in_oklab,var(--brand)_25%,transparent)] text-[var(--brand)] text-xs px-3 py-1 rounded-full mb-6 font-medium">
          {t.eyebrow}
        </span>

        <h3 className="text-2xl lg:text-3xl font-semibold text-white">{t.headline}</h3>
        <p className="text-white/75 mt-4 leading-relaxed text-justify hyphens-auto">{t.description}</p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={`/${locale}/contacto/`}
            className="bg-[var(--brand)] text-[var(--brand-foreground)] font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-[color-mix(in_oklab,var(--brand)_20%,transparent)] transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
          >
            {t.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </a>
          {/* Descarga de PoC sin destino todavía (href="#"): oculta junto con la demo. */}
          {SHOW_DEMO_CTA && (
            <a
              href="#"
              className="text-white/70 hover:text-white font-medium px-6 py-3 text-sm transition-colors inline-flex items-center gap-2"
            >
              {t.ctaSecondary}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-white/65 bg-white/[0.07] border border-white/10 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 auto-rows-fr">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.colSpan} bg-white border ${card.border} rounded-2xl p-5 min-h-[80px] relative overflow-hidden shadow-sm`}
          >
            <card.icon className={`w-5 h-5 ${card.iconColor ?? 'text-[var(--brand)]'} mb-3`} />
            <h4 className="text-on-light font-semibold text-sm">{card.title}</h4>
            <p className="text-on-light-muted text-xs mt-1">{card.description}</p>
            {card.hasSvg && (
              <svg className="absolute bottom-0 right-0 w-32 h-20 opacity-30" viewBox="0 0 100 60">
                <path d="M0 50 Q 25 30, 50 35 T 100 25" stroke="var(--brand)" fill="none" strokeWidth="2" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ShowcaseFlow({ t, locale }: { t: ProductLanding['showcase']; locale: Locale }) {
  const tags = t.tags as string[]
  const cards = t.cards as CardItem[]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 items-start">
      <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          {cards.map((card, i) => (
            <div key={card.title} className="w-full">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <div className="w-8 h-8 rounded-lg bg-[color-mix(in_oklab,var(--brand)_15%,transparent)] border border-[color-mix(in_oklab,var(--brand)_25%,transparent)] flex items-center justify-center flex-shrink-0 text-[var(--brand)] font-mono text-xs font-bold">
                  {i + 1}
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{card.title}</div>
                  <div className="text-white/75 text-xs mt-0.5">{card.description}</div>
                </div>
              </div>
              {i < cards.length - 1 && (
                <div className="w-px h-3 bg-[color-mix(in_oklab,var(--brand)_30%,transparent)] mx-auto" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="inline-flex items-center gap-1.5 bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] border border-[color-mix(in_oklab,var(--brand)_25%,transparent)] text-[var(--brand)] text-xs px-3 py-1 rounded-full mb-6 font-medium">
          {t.eyebrow}
        </span>

        <h3 className="text-2xl lg:text-3xl font-semibold text-white">{t.headline}</h3>
        <p className="text-white/75 mt-4 leading-relaxed text-justify hyphens-auto">{t.description}</p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <a
            href={`/${locale}/contacto/`}
            className="bg-[var(--brand)] text-[var(--brand-foreground)] font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-[color-mix(in_oklab,var(--brand)_20%,transparent)] transition-all hover:scale-[1.02] inline-flex items-center justify-center gap-2"
          >
            {t.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </a>
          {/* Descarga de PoC sin destino todavía (href="#"): oculta junto con la demo. */}
          {SHOW_DEMO_CTA && (
            <a
              href="#"
              className="text-white/70 hover:text-white font-medium px-6 py-3 text-sm transition-colors inline-flex items-center gap-2"
            >
              {t.ctaSecondary}
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-white/65 bg-white/[0.07] border border-white/10 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductShowcase({ t, locale }: ProductShowcaseProps) {
  return (
    <section id="showcase" className="bg-section-dark py-20 lg:py-28 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {t.variant === 'bento' ? <ShowcaseBento t={t} locale={locale} /> : <ShowcaseFlow t={t} locale={locale} />}
      </div>
    </section>
  )
}
