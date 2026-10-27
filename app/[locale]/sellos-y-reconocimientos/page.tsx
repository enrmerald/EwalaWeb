import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { PostersGrid } from '@/components/ewala/posters-grid'
import { FundingBanner } from '@/components/ewala/funding-banner'

// Página oculta: solo se llega escribiendo la URL. No está en PAGES (sitemap), no se enlaza desde
// ninguna parte, no declara canonical ni hreflang y lleva noindex. Tampoco se añade a robots.txt:
// un `Disallow` publicaría la URL. No lleva JSON-LD.
// Contenido: carteles de proyectos europeos y banner Kit Digital/Consulting. Los sellos y
// reconocimientos se muestran en la home (SealsGrid); la URL se conserva por si ya está compartida.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale)

  return {
    title: dict.sellos.meta.title,
    description: dict.sellos.meta.description,
    // `alternates` y `openGraph` se redefinen a propósito: si no, heredan del layout el canonical y
    // los hreflang de la home, que presentarían esta página como duplicado de ella.
    alternates: {},
    openGraph: {
      title: dict.sellos.meta.title,
      description: dict.sellos.meta.description,
      locale,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  }
}

export default async function SellosYReconocimientosPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const t = dict.sellos

  const breadcrumbs = [
    { label: t.breadcrumbHome, href: `/${locale}/` },
    { label: t.breadcrumbCurrent },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <Header locale={locale} />
      <HeroInterior
        locale={locale}
        breadcrumbs={breadcrumbs}
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
      />
      <PostersGrid t={t} />
      <FundingBanner t={t.fundingBanner} />
      <Footer />
    </main>
  )
}
