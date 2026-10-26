import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/types'
import type { BlogPost, BlogCategory } from '@/lib/blog'
import { BlogCard } from '@/components/ewala/blog-card'
import { BlogFiltro } from '@/components/ewala/blog-filtro'

interface BlogListadoProps {
  t: Messages['blog']
  locale: Locale
  featured?: BlogPost
  posts: BlogPost[]
  categories: BlogCategory[]
}

/**
 * Server Component: compone el destacado, el filtro de categoría (isla cliente) y el grid de
 * tarjetas del listado del blog. Todo el HTML de las tarjetas existe en el build estático —
 * `BlogFiltro` solo aplica CSS en cliente, nunca desmonta nodos.
 */
export function BlogListado({ t, locale, featured, posts, categories }: BlogListadoProps) {
  const categoryLabels = t.categories as Record<BlogCategory, string>

  return (
    <section className="bg-section-dark py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {categories.length > 0 && (
          <BlogFiltro categories={categories} labels={categoryLabels} allLabel={t.allCategoriesLabel} />
        )}

        {!featured && posts.length === 0 && <p className="text-white/50 text-sm">{t.emptyState}</p>}

        <div data-blog-grid className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featured && (
            <>
              <p className="lg:col-span-3 text-xs font-mono uppercase tracking-widest text-[var(--primary)] mb-1">
                {t.featuredLabel}
              </p>
              <BlogCard
                post={featured}
                locale={locale}
                categoryLabel={categoryLabels[featured.category]}
                readingMinutesLabel={t.readingMinutesLabel}
                featured
              />
            </>
          )}

          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              locale={locale}
              categoryLabel={categoryLabels[post.category]}
              readingMinutesLabel={t.readingMinutesLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
