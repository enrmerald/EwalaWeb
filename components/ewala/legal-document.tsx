import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { LegalBlock, LegalCommon, LegalDoc } from '@/i18n/types'

interface LegalDocumentProps {
  doc: LegalDoc
  common: LegalCommon
  locale: Locale
}

// `**negrita**` o `[etiqueta](href)`. Los textos legales viven en messages/*.json (contenido de
// confianza), pero el parser solo admite estos dos marcados y una lista blanca de esquemas.
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/

const linkClass = 'text-[var(--primary)] underline underline-offset-2'

function renderLink(label: string, href: string, locale: Locale, key: number): ReactNode {
  // Ruta interna (`/cookies`): se antepone el idioma. `//host` queda fuera (sería externo).
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link key={key} href={`/${locale}${href}`} className={linkClass}>
        {label}
      </Link>
    )
  }
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a key={key} href={href} className={linkClass}>
        {label}
      </a>
    )
  }
  if (href.startsWith('https://')) {
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {label}
      </a>
    )
  }
  // Cualquier otro esquema (`javascript:`, `data:`…) se descarta: solo se muestra el texto.
  return <Fragment key={key}>{label}</Fragment>
}

function renderInline(text: string, locale: Locale): ReactNode[] {
  return text.split(INLINE_TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    const link = LINK.exec(part)
    if (link) return renderLink(link[1], link[2], locale, i)
    return <Fragment key={i}>{part}</Fragment>
  })
}

function Block({ block, locale, label }: { block: LegalBlock; locale: Locale; label: string }) {
  switch (block.type) {
    case 'p':
      return <p className="mb-5 leading-relaxed text-white/80">{renderInline(block.text, locale)}</p>

    case 'ul':
      return (
        <ul className="mb-5 list-disc space-y-2 pl-6 text-white/80">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item, locale)}
            </li>
          ))}
        </ul>
      )

    case 'dl':
      return (
        <dl className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-1">
          {block.rows.map((row, i) => (
            <div
              key={i}
              className="grid gap-1 border-b border-white/[0.08] py-3 last:border-b-0 sm:grid-cols-[14rem_1fr] sm:gap-4"
            >
              <dt className="font-mono text-sm font-semibold text-white">{row.term}</dt>
              <dd className="leading-relaxed text-white/80">{renderInline(row.def, locale)}</dd>
            </div>
          ))}
        </dl>
      )

    case 'table':
      return (
        <div
          role="region"
          aria-label={label}
          tabIndex={0}
          className="mb-5 overflow-x-auto rounded-2xl border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50"
        >
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead className="bg-white/[0.05]">
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col" className="px-4 py-3 font-mono font-semibold text-white">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-white/[0.08] align-top">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 leading-relaxed text-white/80">
                      {renderInline(cell, locale)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

/**
 * Server Component: renderiza una página legal (`messages.legal.*`) como índice de apartados +
 * secciones numeradas. El `<h1>` lo pone `HeroInterior` en la página. Sin HTML en crudo: el
 * marcado inline se convierte en nodos React (ver `renderInline`).
 */
export function LegalDocument({ doc, common, locale }: LegalDocumentProps) {
  const anchor = (i: number) => `apartado-${i + 1}`
  const num = (i: number) => String(i + 1).padStart(2, '0')

  return (
    <article className="bg-section-dark pb-20 lg:pb-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <nav aria-label={common.tocLabel} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white/50">{common.tocLabel}</p>
          <ol className="space-y-2">
            {doc.sections.map((section, i) => (
              <li key={anchor(i)}>
                <a
                  href={`#${anchor(i)}`}
                  className="text-sm text-white/75 transition-colors hover:text-[var(--primary)]"
                >
                  {num(i)} · {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10">
          {doc.sections.map((section, i) => (
            <section key={anchor(i)} id={anchor(i)} className="scroll-mt-28">
              <h2 className="mb-4 mt-12 font-mono text-2xl font-semibold text-white first:mt-0">
                <span aria-hidden="true" className="mr-3 text-[var(--primary)]">
                  {num(i)}
                </span>
                {section.title}
              </h2>
              {section.blocks.map((block, j) => (
                <Block key={j} block={block} locale={locale} label={section.title} />
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-white/[0.08] pt-6 font-mono text-sm text-white/50">
          {common.updatedLabel}: {doc.updated}
        </p>
      </div>
    </article>
  )
}
