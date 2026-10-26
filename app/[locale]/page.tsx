import { getDictionary } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { ProductExperience } from '@/components/ewala/product-experience'
import { ProductLanding } from '@/components/ewala/product-landing'
import { LogoCarousel } from '@/components/ewala/logo-carousel'
import { SealsGrid } from '@/components/ewala/seals-grid'
import { Footer } from '@/components/ewala/footer'
import { MobileStickyCta } from '@/components/ewala/mobile-sticky-cta'

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const slots = {
    sentryn3t: (
      <ProductLanding
        id="sentryn3t"
        content={dict.products.sentryn3t}
        active={true}
        locale={locale}
      />
    ),
  }

  return (
    <main className="min-h-screen bg-section-dark">
      <Header locale={locale} />
      <ProductExperience slots={slots} ui={dict.products.ui} />
      <LogoCarousel t={dict.logoCarousel} />
      <SealsGrid t={dict.sellos} />
      <Footer />
      <MobileStickyCta />
    </main>
  )
}
