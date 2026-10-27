import Link from 'next/link'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/types'

interface ContactRailProps {
  t: Messages['contact']['rail']
  locale: Locale
}

type HoursPeriod = { period: string; detail: string }

export function ContactRail({ t, locale }: ContactRailProps) {
  const steps = t.whatHappensNext.steps
  const hours = t.directContact.hours as HoursPeriod[]

  return (
    <div className="space-y-6">
      {/* Contacto directo */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-white font-mono text-lg font-semibold mb-5">{t.directContact.title}</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-white/45">{t.directContact.emailLabel}</span>
              <a href={`mailto:${t.directContact.email}`} className="text-sm text-white/85 hover:text-white transition-colors">
                {t.directContact.email}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-white/45">{t.directContact.phoneLabel}</span>
              <a
                href={`tel:${t.directContact.phone.replace(/\s+/g, '')}`}
                className="text-sm text-white/85 hover:text-white transition-colors"
              >
                {t.directContact.phone}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-white/45">{t.directContact.addressLabel}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.directContact.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/85 hover:text-white transition-colors"
              >
                {t.directContact.address}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs text-white/45">{t.directContact.hoursLabel}</span>
              <dl className="mt-1 space-y-2">
                {hours.map((h) => (
                  <div key={h.period}>
                    <dt className="text-xs text-white/60">{h.period}</dt>
                    <dd className="text-sm text-white/85">{h.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        </ul>
      </div>

      {/* Qué pasa después */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-white font-mono text-lg font-semibold mb-5">{t.whatHappensNext.title}</h2>
        <ol className="relative">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-[15px] top-8 bottom-0 w-px bg-white/10" aria-hidden="true" />
              )}
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] flex items-center justify-center flex-shrink-0 text-[var(--primary)] font-mono text-xs font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">{step.title}</h3>
                <p className="text-white/65 text-xs mt-1 leading-relaxed text-justify hyphens-auto">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Protección de datos */}
      <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 group">
        <summary className="text-sm text-white/70 font-medium cursor-pointer select-none list-none flex items-center justify-between">
          {t.dataProtection.summary}
          <span className="text-white/40 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <ul className="mt-4 space-y-2 text-xs text-white/55 leading-relaxed">
          <li>{t.dataProtection.controller}</li>
          <li>{t.dataProtection.purpose}</li>
          <li>{t.dataProtection.legitimation}</li>
          <li>{t.dataProtection.recipients}</li>
          <li>{t.dataProtection.rights}</li>
          <li>
            <Link
              href={`/${locale}/privacidad/`}
              className="text-[var(--primary)] underline underline-offset-2 hover:text-white transition-colors"
            >
              {t.dataProtection.moreInfo}
            </Link>
          </li>
        </ul>
      </details>
    </div>
  )
}
