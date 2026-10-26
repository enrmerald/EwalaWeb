import type { ProductLanding } from '@/i18n/types'

interface ProductHowItWorksProps {
  t: ProductLanding['howItWorks']
}

type Step = { title: string; description: string }

export function ProductHowItWorks({ t }: ProductHowItWorksProps) {
  const steps = t.steps as Step[]

  return (
    <section className="bg-section-light py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-[var(--primary)] font-mono font-semibold">
            {t.sectionLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-on-light font-mono mt-3">{t.headline}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 sm:text-center">
              <div className="w-10 h-10 rounded-full bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] flex items-center justify-center flex-shrink-0 text-[var(--primary)] font-mono text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="text-on-light font-semibold text-base">{step.title}</h3>
                <p className="text-on-light-muted text-sm mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
