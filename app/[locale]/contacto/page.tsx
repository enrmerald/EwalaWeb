import { Suspense } from 'react'
import type { Metadata, ResolvingMetadata } from 'next'
import { pageOpenGraph } from '@/lib/metadata'
import { getDictionary, alternatesFor, localizedPath } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { ContactForm } from '@/components/ewala/contact-form'
import { ContactRail } from '@/components/ewala/contact-rail'
import { JsonLd } from '@/components/ewala/json-ld'
import { breadcrumbJsonLd } from '@/lib/jsonld'

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
  const alt = alternatesFor('/contacto', locale)

  return {
    title: dict.contact.meta.title,
    description: dict.contact.meta.description,
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: await pageOpenGraph(parent, {
      title: dict.contact.meta.title,
      description: dict.contact.meta.description,
      locale,
      url: alt.canonical,
    }),
  }
}

export default async function ContactoPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const breadcrumbs = [
    { label: dict.contact.breadcrumbHome, href: localizedPath(locale, '/') },
    { label: dict.contact.breadcrumbContact },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <Header locale={locale} />

      <HeroInterior
        locale={locale}
        breadcrumbs={breadcrumbs}
        title={dict.contact.heroTitle}
        titleHighlight={dict.contact.heroTitleHighlight}
        subtitle={dict.contact.heroSubtitle}
      />

      <section className="bg-section-dark py-16 lg:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
          <div className="lg:col-span-3">
            <span className="text-xs uppercase tracking-widest text-[var(--primary)] font-mono font-semibold">
              {dict.contact.form.sectionLabel}
            </span>
            <div className="mt-5">
              <Suspense fallback={<ContactFormFallback />}>
                <ContactForm t={dict.contact.form} locale={locale} />
              </Suspense>
            </div>
          </div>

          <div className="lg:col-span-2">
            <ContactRail t={dict.contact.rail} locale={locale} />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function ContactFormFallback() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-11 rounded-lg bg-white/[0.05]" />
      <div className="h-11 rounded-lg bg-white/[0.05]" />
      <div className="h-11 rounded-lg bg-white/[0.05]" />
      <div className="h-32 rounded-lg bg-white/[0.05]" />
    </div>
  )
}
