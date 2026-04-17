# 04 — Roadmap de implementación

Este documento ordena las mejoras de los planes 02 (modularización) y 03 (SEO) en **fases desplegables y autocontenidas**. Cada fase termina en un estado válido y publicable. No es obligatorio completar todo de una vez.

## Visión general

| Fase | Objetivo | Riesgo | Impacto |
|------|----------|--------|---------|
| **0** | Preparación y salvaguardas | Muy bajo | Infra |
| **1** | Quick wins SEO sin refactor | Bajo | Alto SEO |
| **2** | Limpieza de assets huérfanos | Bajo | Medio |
| **3** | Sistema de partials (modularización HTML) | Medio | Muy alto mantenibilidad |
| **4** | Schema.org completo | Bajo | Alto SEO |
| **5** | Reconstrucción de `faq.html` | Bajo | Medio SEO |
| **6** | Rendimiento y Core Web Vitals | Medio | Alto SEO |
| **7** | Modularización CSS/JS | Medio | Alto mantenibilidad |
| **8** | Accesibilidad avanzada | Bajo | Medio |
| **9** | Auditoría final y monitorización | Bajo | Alto |

---

## Fase 0 — Preparación

**Objetivo:** tener red de seguridad antes de tocar nada.

1. Crear rama `refactor/modularizacion-seo` desde `main`.
2. Verificar que el repo está limpio (`git status`).
3. Verificar que el deploy actual de Netlify funciona (deploy preview de la rama).
4. Crear snapshot de Lighthouse (desktop + mobile) de las 9 páginas y guardar como baseline en `/docs/baselines/lighthouse-YYYY-MM-DD.md`.
5. Crear baseline de Rich Results Test por página (captura de "no se detectaron elementos").

**Criterio de aceptación:** rama creada, baselines documentados.

---

## Fase 1 — Quick wins SEO (sin refactor estructural)

**Objetivo:** mejoras SEO de alto impacto que no requieren modularización previa.

### Tareas

1. **Twitter Cards** en todas las páginas (copiar bloque desde plan 03 §2.3).
2. **`<meta name="robots" content="index,follow,max-image-preview:large">`** en todas las páginas de producción.
3. **Preconnect** para fonts, GTM y Cookie-Script (plan 03 §6.4).
4. **`alt` descriptivos** en imágenes clave: logos de partners, hero, secciones principales.
5. **`loading="lazy"` + `decoding="async"`** en imágenes fuera del fold.
6. **Dimensiones `width`/`height`** explícitas en todas las `<img>`.
7. **Revisión de `<title>` y `meta description`** según tabla del plan 03 §1.2.
8. **Corrección de jerarquía de encabezados** en `index.html`, `kit-digital.html`, `kit-digital-ciberseguridad-gestionada.html`, `grc-*.html`.

### Criterio de aceptación

- Lighthouse SEO ≥ 90 en todas las páginas.
- Ninguna imagen sin `alt` (salvo decorativas con `alt=""`).
- Cada página tiene exactamente un `<h1>`.

### Riesgo

Bajo — cambios locales, fácilmente revertibles.

---

## Fase 2 — Limpieza de assets huérfanos

**Objetivo:** reducir peso del repo y eliminar archivos que confunden.

### Tareas

1. **Búsqueda de referencias** (grep) para cada candidato antes de borrar:
   - `assets/js/particles.min.2.js` → borrar.
   - `assets/js/app.js_` → borrar.
   - `assets/js/cookie.js.old` → borrar.
   - `assets/js/modal.js` → si no hay referencias, borrar; si las hay, documentar uso.
2. **Variantes HTML**:
   - `test.html` → borrar.
   - `index-con-popupkaront3.html` → confirmar con usuario; mover a `/archive/` o borrar.
   - `inner-page.html` → mover a `/src/templates/` o borrar si no se va a usar como base.
3. **Backups** (`*.old`, `*_`) en raíz → borrar tras confirmar presencia en git.

### Criterio de aceptación

- `git status` no muestra archivos obsoletos en raíz.
- No existen scripts en `/assets/js/` que no estén referenciados o documentados.

### Riesgo

Bajo — todo está en git, reversible.

---

## Fase 3 — Sistema de partials

**Objetivo:** eliminar duplicación de `<head>`, navbar y footer.

### Tareas

1. Crear estructura `/src/` según plan 02 §1.
2. Implementar `scripts/build.js` (sin dependencias NPM).
3. Crear `package.json` mínimo en raíz con script `build:site`.
4. **Migrar una página como prueba** (`politica-privacidad.html`, la más sencilla):
   - Crear `src/pages/politica-privacidad.html` con includes.
   - Extraer `src/partials/head/*`, `navbar.html`, `footer.html`, etc.
   - Ejecutar `node scripts/build.js`.
   - Validar diff del HTML generado vs. el actual — deben ser **funcionalmente equivalentes**.
5. **Migrar el resto de páginas** una por una, validando cada una.
6. Actualizar `netlify.toml` para que ejecute `npm run build:site` antes del build del blog.
7. Deploy preview → validación visual + Lighthouse.

### Criterio de aceptación

- Cambiar un enlace del navbar en `src/partials/navbar.html` y regenerar propaga el cambio a las 9 páginas.
- Diff visual antes/después en cada página = cero diferencias perceptibles.
- Netlify despliega correctamente con el nuevo comando de build.

### Riesgo

Medio — afecta a todas las páginas. Mitigación: migrar página por página y validar cada una.

---

## Fase 4 — Schema.org completo

**Objetivo:** datos estructurados en todas las páginas.

### Tareas

1. Crear `src/partials/schema/organization.html` (común a todas).
2. Crear `src/partials/schema/website.html` (solo home).
3. Añadir `Service` schema inline en cada página de servicio (`kit-*`, `grc-*`).
4. Añadir `BreadcrumbList` en páginas internas.
5. Validar cada schema en Rich Results Test.
6. Regenerar y desplegar.

### Criterio de aceptación

- Rich Results Test detecta `Organization` en todas las páginas.
- `WebSite` + `SearchAction` detectado en home.
- `Service` detectado en páginas de servicio.
- Cero errores de validación en Rich Results Test.

### Riesgo

Bajo — solo añade contenido en `<head>`, no modifica renderizado.

---

## Fase 5 — Reconstrucción de `faq.html`

**Objetivo:** transformar una página con placeholder en un activo SEO.

### Tareas

1. Recopilar 10-20 preguntas frecuentes reales (con ayuda del equipo comercial).
2. Redactar respuestas concisas y con keywords naturales.
3. Aplicar diseño coherente con el resto del sitio (usando partials ya creados).
4. Añadir `FAQPage` schema con cada par pregunta-respuesta.
5. Validar en Rich Results Test.
6. Añadir enlace a `faq.html` desde navegación y footer si procede.

### Criterio de aceptación

- Ningún placeholder "Knight Bootstrap Template" ni similares.
- `FAQPage` schema validado.
- Página enlazada desde al menos una ubicación del sitio.

---

## Fase 6 — Rendimiento y Core Web Vitals

**Objetivo:** cumplir objetivos del plan 03 §10.

### Tareas

1. **Auditoría de Google Fonts**: reducir a 2-3 familias máximo; aplicar `font-display: swap`.
2. **Cargar `particles.js` solo en home**, con `defer`.
3. **Preload** del hero de la home (`fetchpriority="high"`).
4. **`defer`** en scripts no críticos.
5. **Migrar imágenes grandes a `<picture>`** con AVIF + WebP + fallback.
6. **Dimensiones explícitas** y `aspect-ratio` en todos los contenedores de imagen.
7. Re-ejecutar Lighthouse y comparar con baseline.

### Criterio de aceptación

- Lighthouse Performance ≥ 85 desktop, ≥ 70 mobile en las 9 páginas.
- LCP < 2.5s en mobile para home y páginas de servicio.
- CLS < 0.1 en todas.

### Riesgo

Medio — cambios de carga de scripts pueden romper interactividad; validar con QA manual.

---

## Fase 7 — Modularización CSS/JS

**Objetivo:** CSS por componente, JS moderno donde aplique.

### Tareas

1. Dividir `style.css` según plan 02 §2.
2. Extender `build.js` (o usar paso adicional) para concatenar CSS parciales a `style.min.css`.
3. Extraer scripts específicos de página a `assets/js/pages/*.js`.
4. Evaluar extracción de componentes ligeros fuera de jQuery.

### Criterio de aceptación

- `style.css` monolítico eliminado.
- Cada componente con su CSS aislado.
- Cero regresiones visuales.

### Riesgo

Medio — CSS modular puede alterar cascadas si no se respeta el orden.

---

## Fase 8 — Accesibilidad

**Objetivo:** cubrir WCAG 2.1 AA en lo esencial.

### Tareas

1. **Skip link** al inicio del body.
2. **Landmarks** semánticos (`<main>`, `<nav aria-label>`, `<header>`, `<footer>`).
3. **`aria-label`** en botones con sólo icono.
4. **Contraste**: revisar con axe y corregir casos problemáticos.
5. **Focus visible**: asegurar estilo `:focus-visible` en todos los interactivos.
6. Auditoría con Lighthouse Accessibility y axe.

### Criterio de aceptación

- Lighthouse Accessibility ≥ 95 en todas las páginas.
- Navegación completa por teclado funcional.

---

## Fase 9 — Auditoría final y monitorización

**Objetivo:** dejar documentado el estado y un proceso para mantenerlo.

### Tareas

1. **Lighthouse final** de las 9 páginas → guardar en `docs/baselines/lighthouse-final.md`.
2. **Rich Results Test** → confirmar todos los schemas.
3. **Google Search Console**: enviar sitemap actualizado, solicitar indexación de `faq.html` reconstruida.
4. **Documentar proceso de edición** en `docs/05-convenciones.md` y en `CLAUDE.md`.
5. **Checklist de despliegue** (`docs/checklist-deploy.md`) con pasos previos a cada cambio importante.

### Criterio de aceptación

- Documentación actualizada.
- Objetivos del plan 03 §10 cumplidos.
- Equipo formado en el nuevo flujo (crear partial, editar página, ejecutar build).

---

## Orden sugerido de ejecución

Para maximizar valor temprano:

1. **Sprint 1 (1 semana)**: Fase 0 + Fase 1 + Fase 2. → Quick wins SEO y limpieza.
2. **Sprint 2 (1-2 semanas)**: Fase 3 (partials). → Base de mantenibilidad.
3. **Sprint 3 (1 semana)**: Fase 4 + Fase 5. → SEO estructurado.
4. **Sprint 4 (1-2 semanas)**: Fase 6 + Fase 8. → Rendimiento y accesibilidad.
5. **Sprint 5 (opcional, 1 semana)**: Fase 7. → Pulido de CSS/JS.
6. **Cierre (2-3 días)**: Fase 9. → Auditoría y documentación.

**Total estimado:** 5-8 semanas a tiempo parcial, con entregas desplegables cada 1-2 semanas.
