'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/lib/blog'

interface BlogFiltroProps {
  categories: BlogCategory[]
  labels: Record<BlogCategory, string>
  allLabel: string
}

/**
 * Isla cliente: filtro de categoría del listado del blog.
 *
 * Importante: NO desmonta ni elimina tarjetas del DOM (eso rompería la indexación SEO del
 * listado completo). En su lugar, inyecta una regla CSS que oculta con `display: none` las
 * tarjetas cuyo `data-category` no coincide con la categoría activa. El HTML estático generado
 * en build sigue conteniendo el contenido completo de todas las tarjetas.
 */
export function BlogFiltro({ categories, labels, allLabel }: BlogFiltroProps) {
  const [active, setActive] = useState<BlogCategory | 'all'>('all')

  const buttonClass = (isActive: boolean) =>
    cn(
      'px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wide border transition-colors',
      isActive
        ? 'bg-[var(--primary)] text-slate-950 border-[var(--primary)]'
        : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white',
    )

  return (
    <div className="mb-10">
      <div role="group" aria-label={allLabel} className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={active === 'all'} className={buttonClass(active === 'all')} onClick={() => setActive('all')}>
          {allLabel}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={active === category}
            className={buttonClass(active === category)}
            onClick={() => setActive(category)}
          >
            {labels[category]}
          </button>
        ))}
      </div>

      {active !== 'all' && (
        <style>{`[data-blog-grid] [data-category]:not([data-category="${active}"]) { display: none; }`}</style>
      )}
    </div>
  )
}
