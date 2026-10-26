import { Factory, Leaf, Zap, HeartPulse, Truck, Landmark, Banknote, ArrowRight } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'

interface ProductSectorsProps {
  t: ProductLanding['sectors']
}

type SectorItem = { name: string; tag?: string; problem: string }

// Maquetación de iconos alineada
const SECTOR_VISUAL = [
  { icon: Factory },
  { icon: Leaf },
  { icon: Zap },
  { icon: HeartPulse },
  { icon: Truck },
  { icon: Landmark },
  { icon: Banknote },
]

export function ProductSectors({ t }: ProductSectorsProps) {
  const items = (t.items as SectorItem[]).map((item, i) => ({
    ...item,
    ...SECTOR_VISUAL[i],
  }))

  return (
    <section id="sectors" className="bg-section-dark py-20 lg:py-28 scroll-mt-24 relative overflow-hidden">
      {/* Halo de luz ambiental inferior en concordancia con el Hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in oklab, var(--brand) 15%, transparent), transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white font-mono tracking-tight">
            {t.headline}
          </h2>
          <p className="text-white/75 max-w-2xl mx-auto mt-4 text-base leading-relaxed">
            {t.subheadline}
          </p>
        </div>

        {/* Grid Bento / Sector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((sector) => {
            const Icon = sector.icon
            return (
              <div
                key={sector.name}
                className="group relative flex flex-col justify-between bg-white/[0.04] border border-white/10 hover:border-[color-mix(in_oklab,var(--brand)_35%,transparent)] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_50px_color-mix(in_oklab,var(--brand)_10%,transparent)] overflow-hidden"
              >
                {/* Resplandor superior en Hover */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                  style={{
                    background:
                      'radial-gradient(circle, color-mix(in oklab, var(--brand) 30%, transparent), transparent 70%)',
                  }}
                />

                <div>
                  {/* Fila Superior: Contenedor del Icono + Badge Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] border border-[color-mix(in_oklab,var(--brand)_25%,transparent)] flex items-center justify-center text-[var(--brand)] transition-transform duration-300 group-hover:scale-105">
                      <Icon className="w-5 h-5" />
                    </div>

                    {sector.tag && (
                      <span className="text-[10px] font-mono tracking-wider text-white/75 bg-white/[0.07] border border-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        {sector.tag}
                      </span>
                    )}
                  </div>

                  {/* Textos */}
                  <h3 className="text-white text-base font-semibold tracking-tight">
                    {sector.name}
                  </h3>
                  <p className="text-white/65 text-sm mt-2 leading-relaxed line-clamp-3">
                    {sector.problem}
                  </p>
                </div>

                {/* Call To Action inferior */}
                <div className="pt-5 mt-4 border-t border-white/[0.08]">
                  <a
                    href="#showcase"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] group-hover:text-white transition-colors"
                  >
                    <span>{t.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}