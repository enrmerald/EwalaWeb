import type { ProductLanding } from '@/i18n/types'

interface ProductMetricsProps {
  t: ProductLanding['metrics']
}

export function ProductMetrics({ t }: ProductMetricsProps) {
  const items = t.items as Array<{ value: string; label: string }>

  return (
    <section className="bg-white border-y border-black/[0.06] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 items-center">
          {items.map((metric, i) => (
            <div
              key={metric.label}
              className={`flex flex-col items-center text-center ${
                i < items.length - 1 ? 'lg:border-r lg:border-black/10' : ''
              }`}
            >
              <span className="text-3xl lg:text-4xl font-bold text-on-light font-mono text-balance">
                {metric.value}
              </span>
              <span className="text-sm text-on-light-subtle mt-2 max-w-[220px] leading-snug text-center">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 pt-8 border-t border-black/[0.06]">
          <p className="text-sm text-on-light-subtle italic max-w-2xl mx-auto">{t.quote}</p>
        </div>
      </div>
    </section>
  )
}
