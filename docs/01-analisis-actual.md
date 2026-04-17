# 01 — Análisis del estado actual

## 1. Inventario de páginas HTML de producción

El sitio consta de **9 páginas HTML activas** en la raíz del repositorio. El resto son variantes de trabajo, copias o plantillas y no deben considerarse en el refactor (se tratarán en la fase de limpieza).

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `index.html` | Home con hero, servicios, Apps I+D+i, contacto | Producción |
| `kit-digital.html` | Landing del Kit Digital subvencionado | Producción |
| `kit-digital-ciberseguridad-gestionada.html` | Servicio SOC-MDR 24/7 | Producción |
| `kit-consulting.html` | Servicio de consultoría | Producción |
| `grc-gobernanza-riesgo-cumplimiento.html` | GRC (ENS, NIS2, ISO 27001/42001) | Producción |
| `faq.html` | FAQ — **contiene placeholders "Knight Bootstrap Template"** | **Desactualizada** |
| `politica-privacidad.html` | Política RGPD/LOPDGDD | Producción |
| `aviso-legal.html` | Aviso legal | Producción |
| `politica-cookies.html` | Política de cookies | Producción |

### Archivos a revisar / limpiar

- `index-con-popupkaront3.html`, `test.html`, `inner-page.html` → variantes o plantillas, no navegables desde producción.
- Cualquier `*-old*.html`, `*_.html`, `*.old` → respaldos.

## 2. Patrones duplicados

### 2.1 Cabecera (`<head>`)

Todas las páginas principales duplican literalmente **~95% del contenido del `<head>`**:

- Script de Cookie-Script (CDN externo).
- Google Analytics `G-RJFWRZVCTC`.
- Google Tag Manager `GTM-T48SB3HV`.
- Bloque de Google Fonts con ~11 familias.
- Imports CSS de vendors: Bootstrap, Icofont, Boxicons, Venobox, Owl Carousel, AOS.
- Import del CSS propio: `assets/css/style.min.css`.
- Favicons y manifest.

Lo único que varía realmente entre páginas es:

- `<title>`
- `<meta name="description">`
- `og:title`, `og:description`, `og:url`, `og:image`
- `<link rel="canonical">`

### 2.2 Navbar

El `<nav>` principal está duplicado íntegramente en las 9 páginas. Cualquier cambio en el menú obliga a editar 9 archivos.

### 2.3 Footer

Idéntico entre las 7 páginas principales (index, kit-*, grc-*, políticas). Incluye:

- Redes sociales (LinkedIn, YouTube).
- Enlaces a políticas y aviso legal.
- Copyright.
- Botón *back-to-top*.
- Botones flotantes de contacto (teléfono, email, LinkedIn).

### 2.4 Banner/popup de cookies

Repetido página a página con el mismo marcado y scripts.

### 2.5 Scripts al final del `<body>`

Batería común en todas las páginas:

```html
<script src="assets/vendor/jquery/jquery.min.js"></script>
<script src="assets/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="assets/vendor/jquery.easing/jquery.easing.min.js"></script>
<script src="assets/vendor/jquery-sticky/jquery.sticky.js"></script>
<script src="assets/vendor/venobox/venobox.min.js"></script>
<script src="assets/vendor/isotope-layout/isotope.pkgd.min.js"></script>
<script src="assets/vendor/owl.carousel/owl.carousel.min.js"></script>
<script src="assets/vendor/aos/aos.js"></script>
<script src="assets/js/main.min.js"></script>
```

**Impacto:** cualquier actualización de vendor, GA, GTM o cookies implica tocar 9 archivos manualmente, con alto riesgo de divergencia entre páginas.

## 3. Estado actual del SEO

| Aspecto | index | kit-digital | políticas | Evaluación |
|--------|-------|-------------|-----------|------------|
| `<title>` único | ✅ | ✅ | ✅ | Correcto |
| `meta description` única | ✅ | ✅ | ✅ | Correcto |
| Open Graph | ✅ | ✅ | ✅ | Correcto |
| Twitter Cards | ❌ | ❌ | ❌ | **Falta** |
| Canonical | ✅ | ✅ | ✅ | Correcto |
| **Schema.org / JSON-LD** | ❌ | ❌ | ❌ | **Crítico** |
| H1 único y claro | ❌ (hero en `<p>`) | ⚠️ | ✅ | **Inconsistente** |
| Jerarquía h1→h6 | ❌ saltos de nivel | ❌ | ✅ | **Deficiente** |
| `alt` en imágenes | ⚠️ parcial | ⚠️ | ⚠️ | **Incompleto** |
| hreflang | ❌ | ❌ | ❌ | No necesario (solo ES) |
| `sitemap.xml` | ✅ 26 URLs, actualizado | — | — | Correcto |
| `robots.txt` | ✅ | — | — | Correcto |

### Problemas SEO críticos

1. **Ausencia total de datos estructurados (Schema.org)**: no hay `Organization`, `LocalBusiness`, `Service`, `FAQPage`, `BreadcrumbList` ni `WebSite` con `SearchAction`. Impide rich snippets en Google.
2. **Jerarquía de encabezados rota**: `index.html` no tiene un `<h1>` semántico claro; hay saltos a `<h4>` y `<h5>` sin `<h2>`/`<h3>` previos.
3. **Atributos `alt` incompletos**: logos de partners (INCIBE, CCI, Industria, EIBT, etc.) y varias imágenes de sección carecen de `alt` descriptivo.
4. **Sin Twitter Cards** (`twitter:card`, `twitter:title`, `twitter:image`).
5. **`faq.html` con placeholder**: "Knight Bootstrap Template" aún en el `<title>`. Penaliza marca y SEO si se indexa.
6. **Sin Schema `FAQPage`** en las preguntas frecuentes, pese a ser un contenido ideal para rich snippets.

## 4. Estructura de assets

### 4.1 CSS (`/assets/css`)

- `style.css` (48 KB) + `style.min.css` (31 KB) — monolítico.
- `popup.css` + `popup.min.css`.
- `styleparticle.css` + `styleparticle.min.css`.
- **Problema:** CSS monolítico sin modularización por componente; no hay separación crítica/no-crítica.

### 4.2 JS (`/assets/js`)

- `main.js` + `main.min.js`.
- `app.js`, `app.js_` (backup), `app.min.js` — **múltiples versiones**.
- `particles.js` + `particles.min.js` + **`particles.min.2.js`** — **tres versiones del mismo script**.
- `cookie.js.old` — abandonado.
- `grc-cards.js` — específico.
- `modal.js` — **no referenciado en ningún HTML**.
- `/lib` con dependencias sueltas.

### 4.3 Vendors (`/assets/vendor`)

jQuery, Bootstrap, AOS, Owl Carousel, Isotope, Venobox, Icofont, Boxicons. Gestionados manualmente, sin `package.json` ni lock file. Actualizaciones manuales.

### 4.4 Imágenes (`/assets/img`)

~60 archivos mezclando `.png`, `.jpg`, `.webp`, `.svg`. Duplicados con sufijos `_500`, `_1024`. Falta un criterio claro de responsive images (`<picture>`, `srcset`).

## 5. Performance — red flags estáticas

1. **Google Fonts**: 11 familias con múltiples pesos (~50-70 KB) cargadas en todas las páginas, sin `preconnect`.
2. **`particles.js`** (46 KB) cargado en páginas donde no se usa (solo se renderiza en hero del home).
3. **Sin `preconnect`** a `cdn.cookie-script.com`, `googletagmanager.com`, `fonts.gstatic.com`.
4. **CSS no dividido** en crítico / resto. No hay CSS inline mínimo.
5. **Imágenes sin `loading="lazy"`** fuera del fold.
6. **jQuery cargado en todas las páginas** aunque gran parte del sitio podría funcionar con JS vanilla moderno.
7. **Sin AVIF** como formato superior a WebP para navegadores que lo soporten.

## 6. Accesibilidad

| Aspecto | Estado |
|--------|--------|
| `lang="es"` | ✅ en todas las páginas |
| Landmarks (`<main>`, `<nav>`, `<footer>`) | ⚠️ parciales |
| `aria-label` en nav | ❌ ausente |
| `alt` en imágenes críticas | ⚠️ parcial |
| Botones de contacto flotantes | ✅ etiquetados |
| Skip link ("saltar al contenido") | ❌ ausente |
| Contraste y focus visible | No evaluado estáticamente |

## 7. Resumen ejecutivo

El sitio es **funcionalmente correcto** pero arrastra **deuda técnica significativa** en tres frentes:

1. **Duplicación masiva de HTML** que multiplica por 9 el coste de cualquier cambio transversal.
2. **Ausencia de datos estructurados** que limita el potencial SEO pese a tener buen contenido.
3. **Assets desordenados** con múltiples versiones del mismo archivo y scripts no referenciados.

El plan propuesto (documentos 02–04) aborda estos tres frentes **sin introducir un framework ni obligar a un proceso de build** en la raíz del proyecto.
