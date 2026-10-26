import Link from 'next/link'
import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import type { BlogPost } from '@/lib/blog'
import { formatBlogDate } from '@/lib/blog'
import { cn } from '@/lib/utils'

interface BlogCardProps {
  post: BlogPost
  locale: Locale
  categoryLabel: string
  /** Plantilla con placeholder, ej. "{minutes} min de lectura". */
  readingMinutesLabel: string
  featured?: boolean
}

/**
 * Tarjeta de artículo. Server Component: todo el contenido (imagen, título, resumen, fecha)
 * está en el HTML estático desde el build — el filtro de categoría (`BlogFiltro`) solo aplica
 * CSS en cliente sobre `data-category`, nunca desmonta esta tarjeta.
 */
export function BlogCard({ post, locale, categoryLabel, readingMinutesLabel, featured = false }: BlogCardProps) {
  const href = `/${locale}/blog/${post.slug}`
  const minutesLabel = readingMinutesLabel.replace('{minutes}', String(post.readingMinutes))
  const dateLabel = formatBlogDate(locale, post.date)

  return (
    <article
      data-category={post.category}
      className={cn(
        'group rounded-2xl border border-black/10 bg-white overflow-hidden hover:border-[var(--primary)]/40 hover:shadow-lg transition-all',
        featured && 'lg:col-span-2',
      )}
    >
      <Link href={href} className={cn('block h-full', featured && 'lg:grid lg:grid-cols-2 lg:items-stretch')}>
        <div
          className={cn(
            'relative aspect-video overflow-hidden bg-gradient-to-br from-slate-700 to-slate-950',
            featured && 'lg:aspect-auto lg:h-full',
          )}
        >
          {post.image ? (
            <Image
              src={post.image}
              alt={post.imageAlt ?? post.title}
              fill
              sizes={featured ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-white/25 text-xs uppercase tracking-[0.2em]">Ewala</span>
            </div>
          )}
        </div>

        <div className={cn('p-6 flex flex-col', featured && 'lg:p-8 lg:justify-center')}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="uppercase tracking-wide text-[var(--primary)]">{categoryLabel}</span>
            <span aria-hidden="true" className="text-on-light-subtle">
              ·
            </span>
            <span className="text-on-light-subtle">{minutesLabel}</span>
          </div>

          <h3 className={cn('mt-3 font-semibold text-on-light leading-snug', featured ? 'text-2xl lg:text-3xl' : 'text-lg')}>
            {post.title}
          </h3>

          <p className={cn('mt-2 text-on-light-muted line-clamp-3', featured ? 'text-base' : 'text-sm')}>
            {post.description}
          </p>

          <time dateTime={post.date} className="mt-4 text-xs text-on-light-subtle font-mono">
            {dateLabel}
          </time>
        </div>
      </Link>
    </article>
  )
}
