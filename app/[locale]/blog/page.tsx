import type { Metadata, ResolvingMetadata } from 'next'
import { pageOpenGraph } from '@/lib/metadata'
import { getDictionary, alternatesFor } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { BlogListado } from '@/components/ewala/blog-listado'
import { JsonLd } from '@/components/ewala/json-ld'
import { breadcrumbJsonLd } from '@/lib/jsonld'
import { getAllPosts, getFeaturedPost, getGridPosts, getCategories } from '@/lib/blog'

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
  const alt = alternatesFor('/blog', locale)

  return {
    title: dict.blog.meta.title,
    description: dict.blog.meta.description,
    alternates: {
      canonical: alt.canonical,
      languages: alt.languages,
    },
    openGraph: await pageOpenGraph(parent, {
      title: dict.blog.meta.title,
      description: dict.blog.meta.description,
      locale,
      url: alt.canonical,
    }),
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  const allPosts = getAllPosts(locale)
  const featured = getFeaturedPost(locale)
  const posts = getGridPosts(locale)
  const categories = getCategories(locale)

  const breadcrumbs = [
    { label: dict.blog.breadcrumbHome, href: `/${locale}` },
    { label: dict.blog.breadcrumbBlog },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <Header locale={locale} />
      <HeroInterior
        locale={locale}
        breadcrumbs={breadcrumbs}
        title={dict.blog.heroTitle}
        titleHighlight={dict.blog.heroTitleHighlight}
        subtitle={dict.blog.heroSubtitle}
        kicker="Blog"
      />
      {allPosts.length > 0 ? (
        <BlogListado t={dict.blog} locale={locale} featured={featured} posts={posts} categories={categories} />
      ) : (
        <section className="bg-section-dark py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-white/50 text-sm">{dict.blog.emptyState}</p>
          </div>
        </section>
      )}
      <Footer />
    </main>
  )
}
