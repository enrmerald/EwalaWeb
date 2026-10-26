import {
  ShieldCheck,
  Network,
  Lock,
  Users,
  BarChart3,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'

interface ProductCapabilitiesProps {
  t: ProductLanding['capabilities']
}

type CapItem = { title: string; description: string }

const BENTO_VISUAL = [
  {
    icon: ShieldCheck,
    iconColor: 'text-[var(--brand)]',
    span: 'lg:col-span-2',
    bg: 'bg-section-dark',
    textColor: 'text-white',
    descColor: 'text-white/75',
    minHeight: 'min-h-[240px]',
    hasCta: true,
    border: 'ring-1 ring-white/[0.08]',
  },
  {
    icon: Network,
    iconColor: 'text-[var(--brand)]',
    span: '',
    bg: 'bg-section-dark',
    textColor: 'text-white',
    descColor: 'text-white/75',
    minHeight: 'min-h-[180px]',
    border: 'ring-1 ring-[color-mix(in_oklab,var(--brand)_30%,transparent)]',
  },
  {
    icon: Lock,
    iconColor: 'text-[var(--brand)]',
    span: '',
    bg: 'bg-white',
    textColor: 'text-on-light',
    descColor: 'text-on-light-muted',
    minHeight: 'min-h-[180px]',
    border: 'shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.07]',
  },
  {
    icon: Users,
    iconColor: 'text-[var(--brand)]',
    span: '',
    bg: 'bg-white',
    textColor: 'text-on-light',
    descColor: 'text-on-light-muted',
    minHeight: 'min-h-[180px]',
    border: 'shadow-[0_2px_10px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.07]',
  },
  {
    icon: BarChart3,
    iconColor: 'text-[var(--brand)]',
    span: 'lg:col-span-2',
    bg: 'bg-[color-mix(in_oklab,var(--brand)_10%,white)]',
    textColor: 'text-on-light',
    descColor: 'text-on-light-muted',
    minHeight: 'min-h-[180px]',
    hasDecoration: true,
    border: 'shadow-[0_2px_10px_rgba(0,0,0,0.06)] ring-1 ring-[color-mix(in_oklab,var(--brand)_30%,transparent)]',
  },
  {
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    span: '',
    bg: 'bg-section-dark',
    textColor: 'text-white',
    descColor: 'text-white/75',
    minHeight: 'min-h-[180px]',
    border: 'ring-1 ring-white/[0.08]',
  },
]

export function ProductCapabilities({ t }: ProductCapabilitiesProps) {
  const capabilities = (t.items as CapItem[]).map((item, i) => ({
    ...BENTO_VISUAL[i],
    ...item,
  }))

  return (
    <section className="bg-slate-50 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs tracking-widest uppercase text-[var(--brand)] mb-3 block font-mono font-semibold">
            {t.sectionLabel}
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-on-light font-mono">
            {t.headline}
          </h2>
          <p className="text-on-light-muted max-w-2xl mx-auto mt-4">{t.subheadline}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className={`${cap.bg} ${cap.border} rounded-2xl p-6 lg:p-8 ${cap.minHeight} ${cap.span} flex flex-col justify-between relative overflow-hidden hover:scale-[1.01] transition-all duration-200`}
            >
              <div>
                <cap.icon className={`w-7 h-7 ${cap.iconColor} mb-4`} />
                <h3 className={`text-xl font-semibold ${cap.textColor}`}>{cap.title}</h3>
                <p className={`${cap.descColor} text-sm mt-2 leading-relaxed`}>{cap.description}</p>
              </div>

              {cap.hasCta && (
                <a
                  href="#showcase"
                  className="inline-flex items-center gap-1 text-[var(--brand)] text-sm font-medium mt-4 hover:gap-2 transition-all"
                >
                  {t.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}

              {cap.hasDecoration && (
                <svg className="absolute bottom-0 right-0 w-24 h-16 opacity-30" viewBox="0 0 80 50">
                  <rect x="0"  y="30" width="8" height="20" fill="var(--brand)" />
                  <rect x="12" y="20" width="8" height="30" fill="var(--brand)" />
                  <rect x="24" y="10" width="8" height="40" fill="var(--brand)" />
                  <rect x="36" y="25" width="8" height="25" fill="var(--brand)" />
                  <rect x="48" y="15" width="8" height="35" fill="var(--brand)" />
                  <rect x="60" y="5"  width="8" height="45" fill="var(--brand)" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
