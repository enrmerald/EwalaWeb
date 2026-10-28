import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { pageOpenGraph } from '@/lib/metadata'
import { getDictionary, isLocale, defaultLocale } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { Footer } from '@/components/ewala/footer'
import { HeroInterior } from '@/components/ewala/hero-interior'
import { BlogArticulo } from '@/components/ewala/blog-articulo'
import { BlogRelacionados } from '@/components/ewala/blog-relacionados'
import { JsonLd } from '@/components/ewala/json-ld'
import { breadcrumbJsonLd, blogPostingJsonLd } from '@/lib/jsonld'
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  getLocalesForSlug,
} from '@/lib/blog'
import type { BlogCategory } from '@/lib/blog'

export function generateStaticParams({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) return []
  return getAllPosts(params.locale).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  {
    params,
  }: {
    params: Promise<{ locale: Locale; slug: string }>
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getPostBySlug(locale, slug)
  if (!post) return {}

  const availableLocales = getLocalesForSlug(slug)
  const canonical = `/${locale}/blog/${slug}/`
  // x-default → idioma por defecto si el artículo existe en él; si no, el primero disponible.
  const xDefault = availableLocales.includes(defaultLocale) ? defaultLocale : availableLocales[0]
  const languages = Object.fromEntries([
    ...availableLocales.map((l) => [l, `/${l}/blog/${slug}/`]),
    ...(xDefault ? [['x-default', `/${xDefault}/blog/${slug}/`]] : []),
  ])

  return {
    title: post.titleSeo,
    description: post.descriptionSeo,
    alternates: {
      canonical,
      languages,
    },
    // Next no fusiona openGraph con el del layout: pageOpenGraph() hereda siteName y la imagen social
    // (opengraph-image) y aquí solo se pisa lo propio del artículo. Sin `image` en el front matter el
    // artículo conserva la imagen social del sitio; con ella, la suya.
    openGraph: {
      ...(await pageOpenGraph(parent, {
        title: post.titleSeo,
        description: post.descriptionSeo,
        locale,
        url: canonical,
      })),
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
      ...(post.image ? { images: [{ url: post.image, alt: post.imageAlt ?? post.title }] } : {}),
    } as Metadata['openGraph'],
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>
}) {
  const { locale, slug } = await params
  const dict = await getDictionary(locale)
  const post = getPostBySlug(locale, slug)

  if (!post) notFound()

  const related = getRelatedPosts(post, 3)
  const categoryLabels = dict.blog.categories as Record<BlogCategory, string>

  const breadcrumbs = [
    { label: dict.blog.breadcrumbHome, href: `/${locale}/` },
    { label: dict.blog.breadcrumbBlog, href: `/${locale}/blog/` },
    { label: post.title },
  ]

  return (
    <main className="min-h-screen bg-section-dark">
      <JsonLd data={breadcrumbJsonLd(locale, breadcrumbs)} />
      <JsonLd
        data={blogPostingJsonLd({
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          locale,
          slug: post.slug,
          author: post.author,
          image: post.image ?? undefined,
          category: post.category,
          tags: post.tags,
        })}
      />
      <Header locale={locale} />
      <HeroInterior locale={locale} breadcrumbs={breadcrumbs} breadcrumbLabel={dict.nav.breadcrumb} title={post.title} subtitle={post.subtitle ?? post.description} />
      <BlogArticulo
        post={post}
        headings={post.headings}
        categoryLabel={categoryLabels[post.category]}
        readingMinutesLabel={dict.blog.readingMinutesLabel}
        authorLabel={dict.blog.authorLabel}
        tocLabel={dict.blog.tocLabel}
      />
      <BlogRelacionados
        posts={related}
        locale={locale}
        label={dict.blog.relatedLabel}
        categoryLabels={categoryLabels}
        readingMinutesLabel={dict.blog.readingMinutesLabel}
      />
      <Footer />
    </main>
  )
}
