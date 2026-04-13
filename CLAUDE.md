# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visión general

Sitio web corporativo de **Ewala IT Services** (ciberseguridad IT e industrial). Es un sitio **estático** servido desde `https://ewala.es` con dos partes diferenciadas que conviven en el mismo repositorio:

1. **Sitio principal** — páginas HTML estáticas en la raíz (`index.html`, `kit-digital.html`, `faq.html`, `politica-privacidad.html`, etc.) construidas con HTML5 + Bootstrap + jQuery + AOS, sin ningún proceso de build.
2. **Blog** — sitio Hugo dentro de `build/`, que se compila a `build/docs/` y se publica bajo `/blog/`.

El despliegue se hace en **Netlify** (ver `netlify.toml`). El README.md menciona Azure Blob Storage / App Services, pero la configuración activa de despliegue actualmente es Netlify — si hay contradicción, `netlify.toml` es la fuente de verdad.

## Comandos

No existe `package.json` en la raíz ni pipeline de test/lint. El único build real es el del blog Hugo:

```bash
# Build del blog (tal como lo ejecuta Netlify — requiere Hugo 0.157.0)
hugo --minify --source build --destination build/docs && cp -R build/docs blog

# Desarrollo local del blog (dentro de build/)
cd build && hugo server -D
```

Para el sitio principal estático, servir los archivos con cualquier servidor local (p.ej. la extensión **Live Server** de VSCode, como indica el README) — no hay proceso de build; los HTML se editan y suben tal cual.

## Arquitectura clave (lo no evidente)

### Dualidad sitio estático / blog Hugo

- La **raíz** del repo *es* el document root que se publica (`publish = "/"` en `netlify.toml`). Por eso los HTML sueltos (`index.html`, `kit-consulting.html`, …) son páginas navegables directamente.
- El **blog Hugo** vive en `build/` con su propio `hugo.toml`. Su `publishDir = "docs"` significa que Hugo genera `build/docs/`, y el script de Netlify copia ese directorio a `/blog/` en la raíz del sitio publicado. El `baseURL` del blog es `https://ewala.es/blog/`, así que cualquier enlace absoluto generado por el tema ya incluye ese prefijo.
- Los posts del blog viven en `content/posts/` (en la raíz, **no** en `build/content/posts/`). Comprobar esto antes de añadir contenido: Hugo se ejecuta con `--source build`, así que la resolución de `content/` depende de cómo esté enlazada esa carpeta respecto a `build/`.
- El tema Hugo es `paper`, ubicado en `build/themes/paper/`. Tiene su propio `package.json` y Tailwind para el tema — el sitio principal **no** usa Tailwind.

### Archivos HTML duplicados / variantes

Hay varios HTML tipo `index-con-popupkaront3.html`, `kit-digital-ciberseguridad-gestionada.html`, `test.html`, y antes existieron `index-old1.html`, etc. Son **variantes o copias de trabajo** de landing pages — no confundir con el `index.html` real. Antes de editar una página, confirmar con el usuario cuál está en producción (típicamente el nombre "limpio" sin sufijos).

### Assets y vendors

- `assets/vendor/` contiene librerías de terceros ya commiteadas (Bootstrap, jQuery, AOS, Owl Carousel, Venobox, Icofont, Boxicons). No se gestionan con npm — se actualizan manualmente.
- `assets/css/` incluye versiones `.css` y `.min.css` del mismo archivo (`style.css`, `popup.css`, `styleparticle.css`). Al editar estilos, modificar la versión fuente y regenerar la minificada (o editar ambas si no hay pipeline automático).
- `assets/js/` igual: `app.js` / `app.min.js`, `main.js` / `main.min.js`, `particles.js` / `particles.min.js`. Los HTML suelen referenciar la versión `.min`.
- Archivos con sufijo `_` (p.ej. `app.js_`, `particles.json_`) y `.old` son copias de respaldo — ignorar salvo petición explícita.

### Redirects y SEO

- `netlify.toml` fuerza redirección 301 de `www.ewala.es` y `http://` hacia `https://ewala.es`, y normaliza URLs del blog con trailing slash.
- El sitio tiene `sitemap.xml` y `robots.txt` gestionados manualmente en la raíz. Al añadir páginas nuevas, actualizar `sitemap.xml`.
- Se usan Google Analytics (`G-RJFWRZVCTC`) y Google Tag Manager (`GTM-T48SB3HV`) inyectados inline en los `<head>` de los HTML — replicar ese bloque en cualquier página nueva.

### PDFs institucionales

En la raíz hay múltiples PDFs de políticas (código ético, medioambiental, seguridad de la información, antifraude, conciliación, etc.). **Son contenido publicado** enlazado desde la web — no borrar ni mover sin confirmar.

## Idioma

Todo el contenido de usuario está en español (`lang="es"`, `languageCode = 'es-ES'`). Mantener copy, comentarios de contenido y metadatos SEO en español.
