import type { Locale } from '@/i18n/config'
import type { BlogPost, BlogCategory } from '@/lib/blog'
import { BlogCard } from '@/components/ewala/blog-card'

interface BlogRelacionadosProps {
  posts: BlogPost[]
  locale: Locale
  label: string
  categoryLabels: Record<BlogCategory, string>
  readingMinutesLabel: string
}

export function BlogRelacionados({ posts, locale, label, categoryLabels, readingMinutesLabel }: BlogRelacionadosProps) {
  if (posts.length === 0) return null

  return (
    <section className="bg-section-dark border-t border-white/[0.06] py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-mono font-semibold text-white mb-8">{label}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              post={post}
              locale={locale}
              categoryLabel={categoryLabels[post.category]}
              readingMinutesLabel={readingMinutesLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
