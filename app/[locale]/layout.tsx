import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { I18nProvider } from '@/i18n/client'
import { locales, getDictionary, alternatesFor, isLocale } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { SITE_URL, IS_PRODUCTION_DEPLOY } from '@/lib/site'
import { organizationJsonLd, websiteJsonLd } from '@/lib/jsonld'
import { JsonLd } from '@/components/ewala/json-ld'
import { CookieConsent } from '@/components/ewala/cookie-consent'
import { GA_MEASUREMENT_ID } from '@/lib/consent'
import { spaceMono, notoSans } from '@/app/fonts'
import '@/app/globals.css'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const alt = alternatesFor('/', locale)

  return {
    metadataBase: new URL(SITE_URL),
    title: dict.meta.title,
    description: dict.meta.description,
    generator: 'Ewala IT Services S.L.',
    icons: {
      icon: [
        { url: '/favicon/favicon.ico' },
        { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: '/favicon/apple-touch-icon.png',
    },
    manifest: '/favicon/site.webmanifest',
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale,
      url: alt.canonical,
      type: 'website',
      siteName: 'Ewala',
    },
    // Explícito: las páginas no lo redefinen y Next completa title/description/imagen desde openGraph.
    twitter: { card: 'summary_large_image' },
    // Previews y ramas de Netlify: nunca indexables (ver IS_PRODUCTION_DEPLOY en lib/site.ts).
    ...(IS_PRODUCTION_DEPLOY ? {} : { robots: { index: false, follow: false } }),
    // Solo se emite si el cliente facilita el código de verificación (NEXT_PUBLIC_*).
    // Pendiente: pedir el código real de Google Search Console.
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  // Solo los namespaces que consumen las islas cliente
  const clientMessages = {
    nav: dict.nav,
    footer: dict.footer,
    mobileCta: dict.mobileCta,
    cookieBanner: dict.cookieBanner,
  }

  return (
    <html
      lang={locale}
      className={`bg-section-dark ${spaceMono.variable} ${notoSans.variable}`}
    >
      <body className="font-sans antialiased bg-section-dark">
        <JsonLd data={organizationJsonLd(locale)} />
        <JsonLd data={websiteJsonLd(locale)} />
        <I18nProvider locale={locale} messages={clientMessages}>
          {children}
          {/* GA4 solo se carga tras el consentimiento (lib/consent.ts). Sin ID de medición no hay banner ni script. */}
          {GA_MEASUREMENT_ID && <CookieConsent gaId={GA_MEASUREMENT_ID} locale={locale} />}
        </I18nProvider>
      </body>
    </html>
  )
}
