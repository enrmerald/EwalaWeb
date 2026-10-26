import { SITE_URL } from './site'

export interface JsonLdBreadcrumb {
  label: string
  href?: string
}

/**
 * Datos que existen y están confirmados hoy. Regla del proyecto: no declarar en JSON-LD nada que
 * no exista de verdad (sin sameAs a perfiles sociales sin confirmar, sin foto de autor ficticia).
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ewala IT Services S.L.',
    url: SITE_URL,
    logo: `${SITE_URL}/logo_ewala_negro.png`,
    description:
      'Startup europea que desarrolla SentryN3t Protection, plataforma NDR de ciberseguridad industrial para redes OT/IoT basada en machine learning y con asistente de IA.',
    email: 'info@ewala.es',
    telephone: '+34 984 10 90 69',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle Peña Brava nº 21, oficina 1B, PI de Silvota',
      addressLocality: 'Llanera',
      addressRegion: 'Asturias',
      postalCode: '33192',
      addressCountry: 'ES',
    },
  }
}

export function breadcrumbJsonLd(locale: string, crumbs: JsonLdBreadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href.startsWith('/') ? '' : `/${locale}/`}${crumb.href}` } : {}),
    })),
  }
}

export interface BlogPostingInput {
  headline: string
  description: string
  datePublished: string
  locale: string
  slug: string
  author: string
  image?: string
  category: string
  tags: string[]
}

export function blogPostingJsonLd(post: BlogPostingInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    description: post.description,
    inLanguage: post.locale,
    datePublished: post.datePublished,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ewala IT Services S.L.',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo_ewala_negro.png`,
      },
    },
    mainEntityOfPage: `${SITE_URL}/${post.locale}/blog/${post.slug}`,
    articleSection: post.category,
    keywords: post.tags.join(', '),
    ...(post.image ? { image: post.image.startsWith('http') ? post.image : `${SITE_URL}${post.image}` } : {}),
  }
}
