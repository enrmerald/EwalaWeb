import type { BlogPost, Heading } from '@/lib/blog'
import { formatBlogDate } from '@/lib/blog'

interface BlogArticuloProps {
  post: BlogPost
  headings: Heading[]
  categoryLabel: string
  readingMinutesLabel: string
  authorLabel: string
  tocLabel: string
}

const TOC_MIN_HEADINGS = 4

/**
 * Server Component: metadatos del artículo (categoría, fecha, minutos, autor), índice (TOC)
 * automático cuando hay 4 o más `<h2>`, y cuerpo renderizado desde el HTML generado en build
 * (`scripts/build-blog-content.mjs`). `dangerouslySetInnerHTML` es seguro aquí: el HTML procede
 * del propio pipeline de build sobre Markdown de confianza en `content/blog/`, nunca de input
 * de usuario en runtime.
 */
export function BlogArticulo({ post, headings, categoryLabel, readingMinutesLabel, authorLabel, tocLabel }: BlogArticuloProps) {
  const minutesLabel = readingMinutesLabel.replace('{minutes}', String(post.readingMinutes))
  const dateLabel = formatBlogDate(post.locale, post.date)
  const showToc = headings.length >= TOC_MIN_HEADINGS

  return (
    <article className="bg-section-dark pb-20 lg:pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono py-8 border-b border-white/[0.08]">
          <span className="uppercase tracking-wide text-[var(--primary)]">{categoryLabel}</span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <time dateTime={post.date} className="text-white/50">
            {dateLabel}
          </time>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span className="text-white/50">{minutesLabel}</span>
          <span aria-hidden="true" className="text-white/25">
            ·
          </span>
          <span className="text-white/50">
            {authorLabel} {post.author}
          </span>
        </div>

        {showToc && (
          <nav aria-label={tocLabel} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-white/50 mb-3">{tocLabel}</p>
            <ol className="space-y-2">
              {headings.map((heading, i) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`} className="text-sm text-white/75 hover:text-[var(--primary)] transition-colors">
                    {i + 1}. {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div
          className="mt-10 [&>h2]:text-2xl [&>h2]:font-mono [&>h2]:font-semibold [&>h2]:text-white [&>h2]:mt-12 [&>h2]:mb-4 [&>h2:first-child]:mt-0 [&>h3]:text-xl [&>h3]:font-mono [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:text-white/80 [&>p]:leading-relaxed [&>p]:mb-5 [&>p]:text-justify [&>p]:hyphens-auto [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:text-white/80 [&>ul]:mb-5 [&>ul>li]:mb-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:text-white/80 [&>ol]:mb-5 [&_strong]:text-white [&_strong]:font-semibold [&_a]:text-[var(--primary)] [&_a]:underline [&_a]:underline-offset-2 [&>hr]:border-white/10 [&>hr]:my-10"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </div>
    </article>
  )
}
