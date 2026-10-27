import type { ProductId, ProductLanding as LandingContent } from '@/i18n/types'
import type { Locale } from '@/i18n/config'
import { getProduct } from '@/lib/products'
import { ProductHero } from './sections/product-hero'
import { ProductHowItWorks } from './sections/product-how-it-works'
import { ProductMetrics } from './sections/product-metrics'
import { ProductShowcase } from './sections/product-showcase'
// ProductCapabilities: retirada de la landing (DOC-0003-02) por redundante con las tarjetas
// ampliadas de ProductShowcase. Componente y contenido en messages/*.json se conservan por si se
// reutilizan en una futura página de producto dedicada.
// import { ProductCapabilities } from './sections/product-capabilities'
import { ProductSectors } from './sections/product-sectors'
// ProductInnovation: retirada de la landing (DOC-0003-02) por densa/redundante con los sellos de
// certificación. Componente y contenido se conservan por si se reutilizan en una página "Compañía".
// import { ProductInnovation } from './sections/product-innovation'
import { ProductFinalCta } from './sections/product-final-cta'

interface ProductLandingProps {
  id: ProductId
  content: LandingContent
  active: boolean
  locale: Locale
}

export function ProductLanding({ id, content, active, locale }: ProductLandingProps) {
  const cfg = getProduct(id)
  return (
    <div
      data-product={id}
      style={{ '--brand': cfg.accent, '--brand-foreground': cfg.accentForeground } as React.CSSProperties}
    >
      <ProductHero t={content.hero} active={active} locale={locale} />
      <ProductHowItWorks t={content.howItWorks} />
      <ProductMetrics t={content.metrics} />
      <ProductShowcase t={content.showcase} locale={locale} />
      <ProductSectors t={content.sectors} />
      <ProductFinalCta t={content.finalCta} locale={locale} />
    </div>
  )
}
