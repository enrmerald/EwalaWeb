# 03 — Plan SEO / SEM

## Objetivo

Posicionar a Ewala IT Services para consultas relevantes en ciberseguridad IT e industrial en el mercado hispanohablante (ES principalmente), maximizando la visibilidad en SERPs mediante contenido bien estructurado, datos enriquecidos y rendimiento técnico sólido.

## 1. Keywords y estrategia de contenido

### 1.1 Keywords objetivo (cluster principal)

Agrupadas por intención de búsqueda:

**Informacionales (top funnel)**
- Qué es la ciberseguridad
- Qué es SIEM / XDR / SOC / MDR / EDR
- Diferencia entre SOC y MDR
- Ciberseguridad industrial / OT
- NIS2, ENS, ISO 27001, ISO 42001 — qué son y cómo cumplirlos

**Navegacionales / de marca**
- Ewala IT Services
- Ewala ciberseguridad

**Transaccionales (bottom funnel)**
- Kit Digital ciberseguridad subvencionado
- Kit Consulting ciberseguridad
- SOC gestionado 24/7 España
- MDR España
- Consultoría ENS / NIS2
- Implantación ISO 27001

**Locales**
- Ciberseguridad [ciudad/provincia relevantes al target]
- Empresa de ciberseguridad en España

### 1.2 Mapeo keyword → página

| Página | Keyword primaria | Secundarias |
|--------|------------------|-------------|
| `index.html` | Empresa de ciberseguridad España | Ciberseguridad IT e industrial, SOC-MDR, Kit Digital |
| `kit-digital.html` | Kit Digital ciberseguridad | Subvención, ayudas, ciberseguridad para pymes |
| `kit-digital-ciberseguridad-gestionada.html` | SOC MDR 24/7 | Detección de amenazas, respuesta gestionada |
| `kit-consulting.html` | Kit Consulting ciberseguridad | Consultoría estratégica, diagnóstico |
| `grc-*.html` | GRC ciberseguridad | ENS, NIS2, ISO 27001, ISO 42001 |
| `faq.html` | FAQ ciberseguridad empresas | (reconstruir) |

## 2. Metadatos por página

### 2.1 `<title>` — reglas

- Longitud: **≤ 60 caracteres** (incluye espacios).
- Estructura sugerida: `Keyword principal | Sub-mensaje | Ewala`.
- Único e irrepetible entre páginas.

### 2.2 `meta description` — reglas

- Longitud: **120–155 caracteres**.
- Incluir keyword principal y un beneficio/CTA.
- Evitar relleno; redactar para CTR, no para la densidad.

### 2.3 Open Graph + Twitter Cards

Añadir a todas las páginas (actualmente OG sí está, Twitter falta):

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ewala IT Services">
<meta property="og:locale" content="es_ES">
<meta property="og:url" content="https://ewala.es/...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="https://ewala.es/assets/img/og/....webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://ewala.es/assets/img/og/....webp">
```

### 2.4 Canonical + robots

- Todas las páginas deben llevar `<link rel="canonical" href="https://ewala.es/…">` absoluto.
- Añadir `<meta name="robots" content="index,follow,max-image-preview:large">` donde proceda.
- Páginas legales: `index,follow` también (no hay razón para `noindex`).

## 3. Datos estructurados — Schema.org (JSON-LD)

Todos los bloques se insertan con `<script type="application/ld+json">` **al final del `<head>`**.

### 3.1 Común a todas las páginas (en partial `schema/organization.html`)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ewala IT Services",
  "url": "https://ewala.es",
  "logo": "https://ewala.es/assets/img/logo.webp",
  "sameAs": [
    "https://www.linkedin.com/company/ewala-it-services/",
    "https://www.youtube.com/@ewalaitservices"
  ],
  "contactPoint": [{
    "@type": "ContactPoint",
    "telephone": "+34-...",
    "contactType": "customer service",
    "areaServed": "ES",
    "availableLanguage": ["es"]
  }],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "ES",
    "addressLocality": "...",
    "postalCode": "..."
  }
}
```

### 3.2 Home (`index.html`) — añadir

- `WebSite` con `SearchAction` (potential sitelinks search box).
- `LocalBusiness` si aplica (con dirección real).

### 3.3 Páginas de servicio (`kit-*`, `grc-*`) — `Service`

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Ciberseguridad gestionada (SOC-MDR)",
  "provider": { "@type": "Organization", "name": "Ewala IT Services" },
  "areaServed": "ES",
  "description": "...",
  "offers": {
    "@type": "Offer",
    "url": "https://ewala.es/kit-digital-ciberseguridad-gestionada",
    "availability": "https://schema.org/InStock"
  }
}
```

### 3.4 `faq.html` — `FAQPage`

Tras reconstruir el contenido, añadir `FAQPage` con cada par pregunta-respuesta como `Question`/`Answer`. Es uno de los schemas con mejor retorno SEO.

### 3.5 Breadcrumbs — `BreadcrumbList`

En todas las páginas internas, idealmente también visibles en UI.

### 3.6 Validación

- Probar cada página en [Rich Results Test](https://search.google.com/test/rich-results) antes de publicar.
- Monitorizar en Google Search Console la cobertura de schemas.

## 4. Jerarquía de encabezados

### Reglas

- **Un único `<h1>` por página**, con la keyword principal.
- Jerarquía estricta `h1 → h2 → h3 → h4`, sin saltos.
- No usar encabezados para dar estilo; usar clases CSS.

### Plan de corrección

| Página | Problema | Acción |
|--------|----------|--------|
| `index.html` | Hero en `<p>`, sin h1 claro | Promover el titular del hero a `<h1>` |
| `kit-digital.html` | h1 ambiguo | Revisar y fijar `<h1>` con "Kit Digital ciberseguridad" |
| `kit-digital-ciberseguridad-gestionada.html` | Idem | Fijar `<h1>` con "SOC-MDR 24/7" |
| `grc-*.html` | Revisar saltos | Reordenar h2/h3 según contenido |

## 5. Accesibilidad con impacto SEO

Google premia páginas accesibles. Acciones mínimas:

1. **Skip link** al inicio del `<body>`: `<a class="skip-link" href="#main">Saltar al contenido</a>`.
2. **Landmarks**: `<header>`, `<nav aria-label="Principal">`, `<main id="main">`, `<footer>`.
3. **`alt` descriptivos** en toda imagen no decorativa. Imágenes decorativas con `alt=""`.
4. **`aria-label`** en botones sólo con icono.
5. **Contraste**: revisar con herramientas tipo Lighthouse / axe.
6. **Focus visible** en enlaces y botones (no suprimir `:focus`).

## 6. Rendimiento (Core Web Vitals)

Google usa CWV como factor de ranking. Acciones:

### 6.1 LCP (Largest Contentful Paint)

- `<link rel="preload" as="image" href=".../hero.webp" type="image/webp" fetchpriority="high">` para la imagen principal del hero.
- Reducir peso de Google Fonts: auditar si realmente se usan las 11 familias; consolidar a 2-3 máximo.
- `font-display: swap` en `@font-face`.

### 6.2 CLS (Cumulative Layout Shift)

- Dimensiones explícitas (`width`/`height`) en todas las `<img>`.
- Reservar espacio para banners de cookies (no aparecer de golpe empujando contenido).

### 6.3 INP / TBT (Interactivity)

- `defer` en scripts no críticos.
- Cargar `particles.js` solo en la home y con `defer`.
- Considerar migrar componentes ligeros fuera de jQuery a medio plazo.

### 6.4 Preconnect / DNS-prefetch

Añadir en `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="preconnect" href="https://cdn.cookie-script.com">
```

### 6.5 Imágenes

- `loading="lazy"` en imágenes fuera del fold (especialmente logos de partners, secciones intermedias).
- `decoding="async"` en todas.
- `fetchpriority="high"` solo en hero.
- `<picture>` con AVIF → WebP → JPG para imágenes grandes.

## 7. Sitemap y robots

### 7.1 `sitemap.xml`

- Verificar que las 9 páginas de producción están presentes.
- Retirar URLs de páginas obsoletas/retiradas.
- Usar `<lastmod>` real (fecha de la última edición de contenido relevante).
- Asegurar que el `<loc>` coincide exactamente con la URL canónica.

### 7.2 `robots.txt`

Verificar que contiene:

```
User-agent: *
Allow: /

Sitemap: https://ewala.es/sitemap.xml
```

Y que **no bloquea** recursos de `/assets/` (CSS/JS) que Google necesita para renderizar.

## 8. SEM / adquisición (pista para el equipo de marketing)

Aunque la infraestructura SEM (Google Ads) no se configura en el repositorio, el sitio debe estar preparado:

- **Landing pages con intención clara** (ya existen para Kit Digital y Kit Consulting).
- **Tracking con GTM** (ya presente) — añadir eventos personalizados para:
  - Click en botones de contacto flotantes.
  - Envío de formularios de contacto.
  - Scroll al 75% de páginas de servicio.
- **Parámetros UTM respetados**: no redirigir a canonical eliminando parámetros.
- **Páginas rápidas y móviles**: cubierto por el bloque de rendimiento.
- **Consentimiento de cookies correcto** (Cookie-Script ya instalado) — asegurar que GA respeta consent mode v2 para elegibilidad de remarketing.

## 9. Auditorías recurrentes

Establecer un ciclo trimestral con:

- **Lighthouse** (desktop + mobile) en las 9 páginas.
- **Rich Results Test** en páginas con Schema.
- **Google Search Console**: cobertura, CWV, páginas con problemas.
- **Revisión de keywords** y ajuste de titles/descriptions.

## 10. Criterios de aceptación del bloque SEO

- Todas las páginas de producción tienen: `<title>`, `description`, OG, Twitter Cards, canonical y al menos un JSON-LD válido.
- `Organization` JSON-LD en todas las páginas, validado por Rich Results Test.
- `faq.html` reconstruida con contenido real y schema `FAQPage`.
- `index.html`, páginas de servicio y GRC con `<h1>` único y jerarquía correcta.
- Todas las imágenes no decorativas con `alt` significativo.
- Lighthouse SEO score ≥ 95 en las 9 páginas.
- Lighthouse Performance ≥ 85 en desktop y ≥ 70 en mobile (objetivo inicial).
