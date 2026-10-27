import { SITE_URL, SOCIAL_LINKS, withTrailingSlash } from './site'

export interface JsonLdBreadcrumb {
  label: string
  href?: string
}

// Identificadores estables: el resto de bloques referencian a la organización y al sitio por @id
// en lugar de repetir sus datos (Google los une en un único grafo de entidad).
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const LOGO_URL = `${SITE_URL}/logo_ewala_negro.png`

const IN_LANGUAGE: Record<string, string> = { es: 'es-ES', en: 'en' }

const ORGANIZATION_DESCRIPTION: Record<string, string> = {
  es: 'Startup europea que desarrolla SentryN3t Protection, plataforma NDR de ciberseguridad industrial para redes OT/IoT basada en machine learning y con asistente de IA.',
  en: 'European startup developing SentryN3t Protection, an industrial cybersecurity NDR platform for OT/IoT networks built on machine learning and an AI assistant.',
}

/**
 * Datos que existen y están confirmados hoy. Regla del proyecto: no declarar en JSON-LD nada que
 * no exista de verdad (sameAs solo con los perfiles oficiales de SOCIAL_LINKS, sin foto de autor
 * ficticia).
 */
export function organizationJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'Ewala',
    legalName: 'Ewala IT Services S.L.',
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
      width: 1000,
      height: 318,
    },
    description: ORGANIZATION_DESCRIPTION[locale] ?? ORGANIZATION_DESCRIPTION.es,
    email: 'info@ewala.es',
    telephone: '+34 984 10 90 69',
    vatID: 'ESB42987651',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle Peña Brava nº 21, oficina 1B, PI de Silvota',
      addressLocality: 'Llanera',
      addressRegion: 'Asturias',
      postalCode: '33192',
      addressCountry: 'ES',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@ewala.es',
      telephone: '+34 984 10 90 69',
      availableLanguage: ['es', 'en'],
    },
    sameAs: Object.values(SOCIAL_LINKS),
  }
}

export function websiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Ewala',
    url: `${SITE_URL}/`,
    inLanguage: IN_LANGUAGE[locale] ?? locale,
    publisher: { '@id': ORGANIZATION_ID },
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
      ...(crumb.href
        ? { item: `${SITE_URL}${withTrailingSlash(crumb.href.startsWith('/') ? crumb.href : `/${locale}/${crumb.href}`)}` }
        : {}),
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
  const url = `${SITE_URL}/${post.locale}/blog/${post.slug}/`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.headline,
    description: post.description,
    inLanguage: IN_LANGUAGE[post.locale] ?? post.locale,
    datePublished: post.datePublished,
    // El autor es la empresa (no hay autores personales en el blog).
    author: { '@type': 'Organization', name: post.author, url: `${SITE_URL}/` },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    articleSection: post.category,
    keywords: post.tags.join(', '),
    ...(post.image ? { image: post.image.startsWith('http') ? post.image : `${SITE_URL}${post.image}` } : {}),
  }
}
