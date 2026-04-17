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

- La **raíz** del repo *es* el document root que se publica (`publish = "/"` en `netlify.toml`). Por eso los HTML sueltos (`index.html`, `kit-consulting.html`, `grc-gobernanza-riesgo-cumplimiento.html`, …) son páginas navegables directamente.
- El **blog Hugo** vive en `build/` con su propio `hugo.toml`. Su `publishDir = "docs"` significa que Hugo genera `build/docs/`, y el script de Netlify copia ese directorio a `/blog/` en la raíz del sitio publicado. El `baseURL` del blog es `https://ewala.es/blog/`, así que cualquier enlace absoluto generado por el tema ya incluye ese prefijo.
- La carpeta `/blog/` que ves en producción **no está commiteada**: se genera en cada deploy mediante `cp -R build/docs blog`. No la crees manualmente en el repo.
- Los posts del blog viven en `build/content/posts/` (Hugo se invoca con `--source build`, así que esa es la ubicación canónica). La carpeta `content/posts/` en la raíz del repo es **residual/legacy** y no se compila — no añadir contenido nuevo allí.
- El tema Hugo es `paper`, ubicado en `build/themes/paper/`. Tiene su propio `package.json` y Tailwind para el tema — el sitio principal **no** usa Tailwind.

### Contextos de build en Netlify

Además del build por defecto, `netlify.toml` define comandos específicos para:
- `context.split1`: `hugo --gc --minify --enableGitInfo` (producción alternativa)
- `context.deploy-preview`: añade `--buildFuture -b $DEPLOY_PRIME_URL` — útil al revisar previews de PRs con posts de fecha futura
- `context.branch-deploy`: usa `-b $DEPLOY_PRIME_URL` para que los enlaces apunten al preview

Si un preview muestra URLs/enlaces rotos, revisar que el `baseURL` efectivo sea el del contexto correcto.

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

## Jerarquía de encabezados en posts del blog

El tema Hugo `paper` ya renderiza el campo `title` del frontmatter como `<h1>` en la página. Por tanto:

- **Nunca usar `#` (H1) en el cuerpo del post** — genera un H1 duplicado que penaliza SEO y accesibilidad.
- El cuerpo debe comenzar directamente con `##` (H2) o con un párrafo introductorio.
- La jerarquía correcta es: `##` → `###` → `####`, sin saltar niveles.
- Al crear o revisar un post, verificar que no existe ningún `# ` (almohadilla + espacio) fuera del frontmatter.

## Generación de metadatos SEO/SEM para posts del blog

Cuando el usuario pida generar metadatos SEO para un post (habitualmente tras redactar o revisar un `.md` en `build/content/posts/`), adopta el rol de **experto en Marketing Digital especializado en SEO/SEM con conocimiento profundo en ciberseguridad y tecnología**.

### Entregables obligatorios (siempre los cuatro, en este orden)

1. **Title SEO** — **máximo 47 caracteres** (contar incluyendo espacios). Orientado a posicionamiento, debe incluir al menos una keyword relevante del post. Conciso, sin relleno.
2. **Metadescripción SEO** — **máximo 160 caracteres**. Debe incluir keyword principal, proponer un beneficio/hook claro y, cuando encaje, un CTA suave.
3. **Subtítulo** — alineado con el **título principal** del post (no con el Title SEO). Humano, enganchador, no optimizado para buscadores.
4. **Descripción corta** — resumen de 1-2 frases del contenido del post; tono editorial, no SEO.

> **Importante:** validar mentalmente el conteo de caracteres antes de entregar. Si un entregable se pasa del límite, reescribirlo — no entregarlo "casi dentro".

### Fuentes de keywords

Usar preferentemente las keywords ya establecidas en el blog (declaradas en `build/hugo.toml` bajo `[params.seo].keywords`) y ampliarlas con términos específicos del post cuando aporten valor semántico:

```
"Ciberseguridad", "Ewala IT Services", "Noticias Ciberseguridad",
"Qué es la ciberseguridad", "Para qué sirve la ciberseguridad",
"En qué consiste la ciberseguridad", "Qué es SIEM en ciberseguridad",
"Qué significa ciberseguridad", "De qué trata la ciberseguridad",
"Qué es la ciberseguridad y para qué sirve",
"Ciberseguridad: por qué es importante",
"Para qué sirve la ciberseguridad en las empresas",
"Malware", "Ransomware"
```

### Taxonomías existentes (reutilizar antes de inventar nuevas)

**Categorías** usadas en el blog:
- `ciberseguridad`
- `gestión-de-incidentes`
- `tecnologías-de-seguridad`

**Tags** usados en el blog:
- `ataques-ransomware`, `ciberseguridad`, `ciberseguridad-avanzada`, `cybersecurity`
- `edr`, `kit-digital`, `mdr`, `protección-24`, `siem-y-xdr`
- `soc`, `soc-mdr`, `siem`, `soar`
- `detección-de-amenazas`, `automatización-de-seguridad`, `seguridad-en-tiempo-real`
- `centro-de-operaciones-de-seguridad`, `compliance`, `protección-de-datos`

Si se propone una categoría o tag nuevos, justificar brevemente por qué no encaja con los existentes.

### Formato de salida

Devolver los cuatro entregables claramente etiquetados, indicando el **conteo de caracteres real** entre paréntesis para Title y Metadescripción. Ejemplo:

```
Title SEO (43/47): SOC vs MDR: qué elegir en ciberseguridad
Metadescripción (152/160): Descubre cuándo conviene un SOC interno o un MDR gestionado 24/7…
Subtítulo: Cuándo externalizar tu centro de operaciones de seguridad
Descripción corta: Comparativa práctica entre SOC y MDR…
```
