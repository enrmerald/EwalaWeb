import type { Metadata, ResolvingMetadata } from 'next'
import { pageOpenGraph } from '@/lib/metadata'
import { getDictionary, alternatesFor } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import type { LegalDoc } from '@/i18n/types'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { LegalDocument } from '@/components/ewala/legal-document'
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
  const doc = dict.legal.cookies as unknown as LegalDoc
  const alt = alternatesFor('/cookies', locale)

  return {
    title: doc.meta.title,
    description: doc.meta.description,
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: await pageOpenGraph(parent, {
      title: doc.meta.title,
      description: doc.meta.description,
      locale,
      url: alt.canonical,
    }),
  }
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const doc = dict.legal.cookies as unknown as LegalDoc
  const common = dict.legal.common

  const breadcrumbs = [
    { label: common.breadcrumbHome, href: `/${locale}/` },
    { label: doc.breadcrumb },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <Header locale={locale} />
      <HeroInterior
        locale={locale}
        breadcrumbs={breadcrumbs}
        title={doc.title}
        subtitle={doc.subtitle}
      />
      <LegalDocument doc={doc} common={common} locale={locale} />
      <Footer />
    </main>
  )
}
