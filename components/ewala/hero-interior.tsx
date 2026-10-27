import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Locale } from '@/i18n/config'

export interface Breadcrumb {
  label: string
  href?: string
}

interface HeroInteriorProps {
  locale: Locale
  breadcrumbs: Breadcrumb[]
  title: string
  titleHighlight?: string
  subtitle?: string
  /** Etiqueta corta opcional sobre el título, ej. "Blog". */
  kicker?: string
}

/**
 * Hero reutilizable para páginas interiores (Blog, Contacto, artículo individual…).
 * Regla: un solo <h1> por página — este componente es siempre el que lo aporta.
 */
export function HeroInterior({ locale, breadcrumbs, title, titleHighlight, subtitle, kicker }: HeroInteriorProps) {
  return (
    <section className="relative overflow-hidden bg-section-dark pt-28 pb-14 lg:pt-32 lg:pb-20 border-b border-white/[0.06]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-[var(--primary)]/15 blur-[100px]"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-white/45">
            {breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-white/25" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white/70" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {kicker && (
          <div className="mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--primary)]">{kicker}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-mono leading-tight">
          {title}
          {titleHighlight && <span className="text-[var(--primary)]"> {titleHighlight}</span>}
        </h1>

        {subtitle && (
          <p className="text-white/70 text-base lg:text-lg mt-4 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
      </div>
    </section>
  )
}
