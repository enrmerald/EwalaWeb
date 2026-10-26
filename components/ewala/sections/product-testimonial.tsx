import type { ProductLanding } from '@/i18n/types'

interface ProductTestimonialProps {
  t: ProductLanding['testimonial']
}

export function ProductTestimonial({ t }: ProductTestimonialProps) {
  const badges = t.badges as string[]

  return (
    <section className="bg-white py-20 lg:py-24 relative">
      <div className="absolute top-4 left-8 text-[var(--brand)]/15 text-[200px] leading-none font-serif select-none hidden lg:block">
        &quot;
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="text-xs tracking-widest uppercase text-on-light-subtle mb-8 block font-mono">
          {t.sectionLabel}
        </span>

        <blockquote className="text-xl lg:text-2xl font-medium text-on-light leading-relaxed italic">
          {t.quote}
        </blockquote>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full bg-section-dark flex items-center justify-center text-white/80 font-bold text-lg">
            {t.authorInitials}
          </div>
          <div className="text-left">
            <div className="font-semibold text-on-light">{t.authorName}</div>
            <div className="text-sm text-on-light-subtle">{t.authorRole}</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {badges.map((badge) => (
            <span
              key={badge}
              className="bg-black/[0.05] border border-black/10 rounded-full px-4 py-2 text-xs font-medium text-on-light-muted"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
