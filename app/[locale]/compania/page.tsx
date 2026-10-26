import type { Metadata, ResolvingMetadata } from 'next'
import { Globe, GraduationCap, Award } from 'lucide-react'
import { pageOpenGraph } from '@/lib/metadata'
import { getDictionary, alternatesFor } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { LogoCarousel } from '@/components/ewala/logo-carousel'
import { JsonLd } from '@/components/ewala/json-ld'
import { breadcrumbJsonLd } from '@/lib/jsonld'

const PROOF_ICONS = [Globe, GraduationCap, Award]

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ locale: Locale }>
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const alt = alternatesFor('/compania', locale)

  return {
    title: dict.company.meta.title,
    description: dict.company.meta.description,
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: await pageOpenGraph(parent, {
      title: dict.company.meta.title,
      description: dict.company.meta.description,
      locale,
      url: alt.canonical,
    }),
  }
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const c = dict.company
  const proofPoints = dict.products.sentryn3t.innovation.proofPoints as Array<{
    title: string
    description: string
  }>

  const breadcrumbs = [
    { label: c.breadcrumbHome, href: `/${locale}` },
    { label: c.breadcrumbCompany },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <Header locale={locale} />
      <HeroInterior
        locale={locale}
        breadcrumbs={breadcrumbs}
        title={c.heroTitle}
        titleHighlight={c.heroTitleHighlight}
        subtitle={c.heroSubtitle}
      />

      <section className="bg-section-light py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs uppercase tracking-widest text-[var(--primary)] font-mono font-semibold">
            {c.introSectionLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-on-light font-mono mt-3">{c.introHeadline}</h2>
          <p className="text-on-light-muted mt-6 leading-relaxed text-justify hyphens-auto">{c.intro1}</p>
          <p className="text-on-light-muted mt-4 leading-relaxed text-justify hyphens-auto">{c.intro2}</p>
        </div>
      </section>

      <section className="bg-section-dark py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs uppercase tracking-widest text-[var(--primary)] font-mono font-semibold">
            {c.proofPointsLabel}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            {proofPoints.map((point, i) => {
              const Icon = PROOF_ICONS[i] ?? Globe
              return (
                <div
                  key={point.title}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-5"
                >
                  <div className="w-9 h-9 rounded-lg bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-white font-semibold text-sm">{point.title}</h3>
                  <p className="text-white/65 text-sm mt-1.5 leading-relaxed text-justify hyphens-auto">{point.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-section-light pt-4">
        <p className="text-center text-xs uppercase tracking-widest text-on-light-subtle font-mono pt-8">
          {c.certificationsLabel}
        </p>
      </section>
      <LogoCarousel t={dict.logoCarousel} />

      <section className="bg-section-brand py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--primary-foreground)] font-mono">
            {c.ctaHeadline}
          </h2>
          <a
            href={`/${locale}/contacto`}
            className="inline-flex items-center justify-center gap-2 bg-[var(--primary-foreground)] text-[var(--primary)] font-bold px-8 py-4 rounded-xl text-base mt-6 hover:brightness-110 transition-all hover:scale-[1.02]"
          >
            {c.ctaButton}
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
