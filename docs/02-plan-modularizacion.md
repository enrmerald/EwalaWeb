# 02 — Plan de modularización

## Objetivo

Eliminar la duplicación masiva de HTML, CSS y JS sin introducir un framework ni un proceso de build obligatorio. Tras aplicar este plan, cambiar la navegación, el footer, GA o el banner de cookies deberá requerir **un único edit**, no nueve.

## Decisión clave: estrategia de plantillas

Existen tres estrategias viables para un sitio estático. Se propone la **opción A** como ruta principal, con la opción B como alternativa si se quiere evitar por completo cualquier build.

### Opción A (recomendada) — Includes en build-time con un script Node mínimo

- Crear `/src/` con los HTML "fuente" usando marcadores `<!-- @include("partials/head.html") -->`.
- Un script Node (`scripts/build.js`, ~50 líneas, sin dependencias externas) resuelve los includes y genera los HTML finales en la raíz.
- Se ejecuta en local antes de commitear **o** en Netlify como comando de build opcional (`npm run build:site`).
- **Ventaja**: sigue siendo HTML puro tras el build; Netlify solo publica estáticos; rollback trivial.
- **Coste**: un `package.json` mínimo en la raíz y un comando.

### Opción B — Web Components con `<template>` y `fetch`

- Crear custom elements (`<ewala-nav>`, `<ewala-footer>`) que inyectan su contenido desde archivos HTML externos vía `fetch`.
- **Ventaja**: cero build, cero dependencias.
- **Coste**: flash of unstyled content (FOUC) si no se optimiza; nav/footer no están en el HTML inicial → penalización SEO leve en crawlers antiguos.
- **Uso aceptable para**: footer, banners, popups. **Desaconsejado** para navegación y hero.

### Opción C — Netlify Edge Functions / server-side includes

- Descartada: introduce acoplamiento con Netlify y complica el desarrollo local.

**Decisión propuesta:** **Opción A** para `<head>`, `<nav>`, `<footer>`, scripts comunes y Schema.org compartido. Opción B descartada salvo que el usuario prefiera explícitamente evitar Node.

## 1. Arquitectura de partials (Opción A)

```
/src/
├── pages/
│   ├── index.html
│   ├── kit-digital.html
│   ├── kit-digital-ciberseguridad-gestionada.html
│   ├── kit-consulting.html
│   ├── grc-gobernanza-riesgo-cumplimiento.html
│   ├── faq.html
│   ├── politica-privacidad.html
│   ├── aviso-legal.html
│   └── politica-cookies.html
└── partials/
    ├── head/
    │   ├── meta-base.html        # charset, viewport, favicons, manifest
    │   ├── fonts.html            # Google Fonts + preconnect
    │   ├── analytics.html        # GA + GTM
    │   ├── cookie-script.html    # CDN Cookie-Script
    │   ├── vendor-css.html       # Bootstrap, Icofont, Boxicons, Venobox, Owl, AOS
    │   └── site-css.html         # style.min.css + modulares
    ├── schema/
    │   ├── organization.html     # JSON-LD Organization (común a todas)
    │   ├── website.html          # JSON-LD WebSite + SearchAction
    │   └── breadcrumb.html       # JSON-LD BreadcrumbList (parametrizable)
    ├── navbar.html
    ├── footer.html
    ├── cookie-banner.html
    ├── floating-contact.html
    └── scripts-end.html          # jQuery, Bootstrap, AOS, main.min.js
/scripts/
└── build.js                      # resolver de includes
/docs/
  ...
```

### Sintaxis de inclusión

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- @include("partials/head/meta-base.html") -->
  <title>Ewala — Ciberseguridad IT e industrial</title>
  <meta name="description" content="...">
  <link rel="canonical" href="https://ewala.es/">
  <!-- @include("partials/head/fonts.html") -->
  <!-- @include("partials/head/analytics.html") -->
  <!-- @include("partials/head/vendor-css.html") -->
  <!-- @include("partials/head/site-css.html") -->
  <!-- @include("partials/schema/organization.html") -->
  <!-- @include("partials/schema/website.html") -->
</head>
<body>
  <!-- @include("partials/navbar.html") -->
  <main>
    <!-- contenido específico de la página -->
  </main>
  <!-- @include("partials/footer.html") -->
  <!-- @include("partials/cookie-banner.html") -->
  <!-- @include("partials/floating-contact.html") -->
  <!-- @include("partials/scripts-end.html") -->
</body>
</html>
```

### Script `build.js` — requisitos

- Sin dependencias NPM (usar solo `fs`/`path` de Node).
- Resolver includes recursivos (un partial puede incluir a otro).
- Detectar ciclos y fallar con mensaje claro.
- Soportar variables simples vía `<!-- @var("key") -->` para casos como breadcrumbs por página (opcional en fase 1).
- Escribir los HTML finales en la raíz del repo, sobrescribiendo los actuales.
- Comando: `node scripts/build.js`.

### Integración con Netlify

Añadir al `netlify.toml` (sin tocar el build del blog):

```toml
[build]
  command = "npm run build:site && hugo --minify --source build --destination build/docs && cp -R build/docs blog"
```

Y un `package.json` mínimo en la raíz:

```json
{
  "private": true,
  "scripts": {
    "build:site": "node scripts/build.js"
  }
}
```

## 2. Modularización de CSS

### Estado objetivo

```
/assets/css/
├── base/
│   ├── variables.css      # colores, tipografías, spacings
│   ├── reset.css
│   └── typography.css
├── components/
│   ├── navbar.css
│   ├── footer.css
│   ├── buttons.css
│   ├── cards.css
│   ├── hero.css
│   ├── cookie-banner.css
│   └── floating-contact.css
├── pages/
│   ├── home.css
│   ├── kit-digital.css
│   ├── grc.css
│   └── legal.css
└── style.css              # @import de los anteriores, orden canónico
```

### Criterio

- Mantener `style.min.css` como bundle final (concatenado y minificado) para no romper referencias existentes hasta que se migren las páginas.
- Añadir un paso opcional al `build.js` que concatene los parciales CSS (o usar `@import` del navegador en desarrollo y un bundle manual para producción).
- Eliminar `style.css` + `style.min.css` monolíticos al finalizar la migración.

## 3. Modularización / limpieza de JS

### Acciones inmediatas (sin refactor funcional)

1. **Eliminar versiones redundantes**:
   - Borrar `assets/js/particles.min.2.js`.
   - Borrar `assets/js/app.js_` (backup).
   - Borrar `assets/js/cookie.js.old`.
   - Borrar `assets/js/modal.js` si se confirma que no se usa (grep por referencias antes).

2. **Unificar versiones**:
   - Mantener un único `particles.min.js`.
   - Mantener `main.js` + `main.min.js` como fuente / bundle.

3. **Cargar `particles.min.js` solo donde se use** (mover a scripts específicos del home).

### Refactor a medio plazo

- Extraer lógica común a módulos ES (`assets/js/modules/*.js`) con `type="module"`.
- Evaluar eliminar dependencia de jQuery en componentes nuevos (no migrar los existentes de golpe).
- Considerar cargar `main.js` con `defer`.

## 4. Limpieza de archivos obsoletos

| Archivo | Acción |
|---------|--------|
| `index-con-popupkaront3.html` | Mover a `/archive/` o borrar previa confirmación. |
| `inner-page.html` | Mover a `/src/templates/page-base.html` como plantilla. |
| `test.html` | Borrar. |
| `*.old`, `*_`, backups | Borrar tras confirmar que están en git. |
| `faq.html` con placeholders | Reconstruir o retirar del sitemap. |

## 5. Imágenes

- Establecer carpeta `/assets/img/partners/` y mover logos de terceros allí.
- Convertir imágenes pesadas a `.webp` (ya parcialmente hecho) y añadir `.avif` donde valga la pena.
- Usar `<picture>` con `srcset` para hero y secciones con imágenes grandes.
- Revisar uso de sufijos `_500`/`_1024` y migrar a `srcset` estándar.

## 6. Criterios de aceptación del bloque de modularización

- Editar el menú de navegación requiere **un único cambio** en `src/partials/navbar.html`.
- Editar GA/GTM requiere un único cambio en `src/partials/head/analytics.html`.
- `node scripts/build.js` genera los HTML idénticos (en estructura) a los actuales y el sitio se ve **pixel-perfect igual** que antes en staging.
- No quedan archivos `.old`, `.min.2`, `_` sin propósito en `/assets/`.
