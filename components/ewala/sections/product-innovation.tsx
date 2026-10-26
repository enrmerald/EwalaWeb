import { Globe, GraduationCap, Award, ArrowRight } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'

interface ProductInnovationProps {
  t: ProductLanding['innovation']
}

type ProofPoint = { title: string; description: string }

const PROOF_ICONS = [Globe, GraduationCap, Award]

function TerminalDisplay() {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 font-mono text-sm">
      <div className="text-[var(--brand)] mb-2">SENTRYN3T // AI ENGINE — ANOMALY DETECTION</div>
      {/* Separadores decorativos: opacidad baja intencional */}
      <div className="text-white/15 mb-4">─────────────────────────────────────────────</div>

      <div className="space-y-2 text-xs">
        <div className="flex">
          <span className="text-[var(--brand)] w-24">MODEL</span>
          <span className="text-white/70">Isolation Forest + LSTM + Behavioral GNN</span>
        </div>
        <div className="flex">
          <span className="text-[var(--brand)] w-24">INFERENCE</span>
          <span className="text-white/70">{'< 200ms per device'}</span>
        </div>
        <div className="flex">
          <span className="text-[var(--brand)] w-24">BASELINE</span>
          <span className="text-white/70">Adaptive (7-day rolling window)</span>
        </div>
        <div className="flex">
          <span className="text-[var(--brand)] w-24">EXPLAINER</span>
          <span className="text-white/70">Integrated (XAI evidence per alert)</span>
        </div>
      </div>

      <div className="text-white/15 my-4">─────────────────────────────────────────────</div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--brand)]">ACTIVE MODELS</span>
          <div className="flex gap-0.5">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="w-2 h-3 bg-[var(--brand)] rounded-sm" />
            ))}
          </div>
          <span className="text-white/65">847 devices</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[var(--brand)]">ANOMALY SCORE</span>
          <div className="flex gap-0.5">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className={`w-2 h-3 rounded-sm ${i < 8 ? 'bg-white/50' : 'bg-white/15'}`} />
            ))}
          </div>
          <span className="text-white/65">0.73 (medium)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[var(--brand)]">FALSE POSITIVE</span>
          <div className="flex gap-0.5">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className={`w-2 h-3 rounded-sm ${i < 1 ? 'bg-white/50' : 'bg-white/15'}`} />
            ))}
          </div>
          <span className="text-white/65">4.2% (last 30d)</span>
        </div>
      </div>

      <div className="text-white/15 my-4">─────────────────────────────────────────────</div>

      <div className="text-xs">
        <div className="flex items-center gap-2">
          <span className="text-green-400 animate-pulse">▶ LIVE</span>
          <span className="text-white/70">Analyzing segment OT-3...</span>
        </div>
        <div className="text-white/50 mt-1 ml-6">→ Device 192.168.10.47: deviation +2.1σ</div>
        <div className="text-white/50 ml-6">→ Alert queued: MEDIUM severity</div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
        <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
          Python · PyTorch · PostgreSQL
        </span>
        <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
          Time-Series · Graph Neural Networks
        </span>
        <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
          GDPR · NIS2 · ENS Compliant
        </span>
      </div>
    </div>
  )
}

function PanelDisplay({ t }: { t: ProductLanding['innovation'] }) {
  const proofPoints = (t.proofPoints as ProofPoint[]).map((point, i) => ({
    ...point,
    icon: PROOF_ICONS[i],
  }))

  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-[var(--brand)]" />
        <span className="text-sm font-mono text-[var(--brand)] uppercase tracking-widest">
          {t.sectionLabel}
        </span>
      </div>

      {proofPoints.map((point) => (
        <div key={point.title} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] border border-[color-mix(in_oklab,var(--brand)_20%,transparent)] flex items-center justify-center flex-shrink-0">
            <point.icon className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{point.title}</div>
            <div className="text-white/65 text-sm mt-1">{point.description}</div>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
            Seguridad by design
          </span>
          <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
            IoT modular
          </span>
          <span className="text-[10px] text-white/65 bg-white/[0.06] border border-white/10 px-2 py-1 rounded">
            Trazabilidad
          </span>
        </div>
      </div>
    </div>
  )
}

export function ProductInnovation({ t }: ProductInnovationProps) {
  const proofPoints = (t.proofPoints as ProofPoint[]).map((point, i) => ({
    ...point,
    icon: PROOF_ICONS[i],
  }))

  return (
    <section className="bg-black py-20 lg:py-28 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--brand) 6%, transparent), transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
          <div>
            <span className="text-xs tracking-widest uppercase text-[var(--brand)] mb-3 block font-mono font-semibold">
              {t.sectionLabel}
            </span>
            <h2 className="text-3xl font-semibold text-white font-mono">{t.headline}</h2>
            <p className="text-white/70 mt-4 leading-relaxed">{t.description1}</p>
            <p className="text-white/70 mt-4 leading-relaxed">{t.description2}</p>

            <div className="mt-8 space-y-4">
              {proofPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] border border-[color-mix(in_oklab,var(--brand)_20%,transparent)] flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-5 h-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{point.title}</div>
                    <div className="text-white/65 text-sm mt-0.5">{point.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 mt-8 border border-white/25 text-white hover:bg-white/[0.06] font-semibold px-6 py-3 rounded-xl text-sm transition-all"
            >
              {t.cta}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div>
            {t.variant === 'terminal' ? <TerminalDisplay /> : <PanelDisplay t={t} />}
          </div>
        </div>
      </div>
    </section>
  )
}
