import type { Metadata } from 'next'
import Link from 'next/link'
import { I18nProvider } from '@/i18n/client'
import { getDictionary, defaultLocale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { spaceMono, notoSans } from '@/app/fonts'
import '@/app/globals.css'

/**
 * 404 global (out/404.html, la sirve Netlify para cualquier ruta inexistente).
 * El layout raíz (app/layout.tsx) solo devuelve `children` porque el <html lang> lo pone el layout
 * de cada idioma; por eso esta página monta su propio <html>. Al no saber el idioma de la URL
 * pedida, se muestra en español con acceso directo a la versión inglesa.
 */
export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary(defaultLocale)
  return {
    title: dict.notFound.metaTitle,
    description: dict.notFound.description,
    robots: { index: false, follow: true },
    icons: { icon: '/favicon/favicon.ico' },
  }
}

export default async function NotFound() {
  const locale = defaultLocale
  const dict = await getDictionary(locale)
  const t = dict.notFound

  return (
    <html lang={locale} className={`bg-section-dark ${spaceMono.variable} ${notoSans.variable}`}>
      <body className="font-sans antialiased bg-section-dark">
        <I18nProvider
          locale={locale}
          messages={{ nav: dict.nav, footer: dict.footer, mobileCta: dict.mobileCta, cookieBanner: dict.cookieBanner }}
        >
          <main className="min-h-screen bg-section-dark">
            <Header locale={locale} />
            <section className="flex min-h-[70vh] items-center px-4 pt-32 pb-20 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <p className="font-mono text-sm tracking-widest text-[var(--primary)]">{t.code}</p>
                <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{t.title}</h1>
                <p className="mt-5 text-lg leading-relaxed text-white/70">{t.description}</p>
                <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href={`/${locale}/`}
                    className="rounded-xl bg-[var(--primary)] px-6 py-3 font-mono text-sm font-semibold text-on-light"
                  >
                    {t.home}
                  </Link>
                  <Link
                    href={`/${locale}/contacto/`}
                    className="rounded-xl border border-white/25 px-6 py-3 font-mono text-sm font-semibold text-white hover:bg-white/[0.06]"
                  >
                    {t.contact}
                  </Link>
                </div>
                <p className="mt-8 text-sm">
                  <Link href="/en/" lang="en" className="text-white/60 underline underline-offset-4 hover:text-white">
                    {t.otherLanguage}
                  </Link>
                </p>
              </div>
            </section>
            <Footer />
          </main>
        </I18nProvider>
      </body>
    </html>
  )
}
