# Ewala.es — Sitio web corporativo

Repositorio del sitio web oficial de **Ewala IT Services**, empresa de ciberseguridad IT e industrial. El sitio se publica en **[https://ewala.es](https://ewala.es)** y está desplegado en **Netlify**.

## Estructura del proyecto

El repositorio contiene dos partes diferenciadas que conviven en el mismo repo:

```
/                          ← raíz = document root publicado en ewala.es
├── index.html             ← página principal
├── kit-digital.html
├── kit-consulting.html
├── kit-digital-ciberseguridad-gestionada.html
├── grc-gobernanza-riesgo-cumplimiento.html
├── faq.html
├── aviso-legal.html
├── politica-privacidad.html
├── politica-cookies.html
├── sitemap.xml            ← gestionado manualmente
├── robots.txt
├── *.pdf                  ← políticas corporativas publicadas (no mover ni borrar)
├── assets/
│   ├── css/               ← estilos (.css y .min.css de cada archivo)
│   ├── js/                ← scripts (app.js / app.min.js, main.js / main.min.js, …)
│   ├── img/
│   └── vendor/            ← Bootstrap, jQuery, AOS, Owl Carousel… (sin npm)
├── particles/
├── build/                 ← blog Hugo (ver sección Blog más abajo)
└── netlify.toml           ← configuración de despliegue (fuente de verdad)
```

> Los archivos con sufijo `_` o `.old` en `assets/` son copias de respaldo — ignorar salvo petición explícita.
> Los HTML con sufijos tipo `-con-popupkaront3` o `test.html` son variantes de trabajo, no páginas en producción.

## Sitio principal estático

Las páginas de la raíz están construidas con **HTML5 + Bootstrap 5 + jQuery + AOS**. No existe proceso de build — los archivos se editan y despliegan tal cual.

### Desarrollo local

Usar cualquier servidor local. Con VSCode:
- Instalar la extensión **Live Server** y pulsar "Go Live".

### Consideraciones al añadir páginas nuevas

1. Añadir la entrada correspondiente en `sitemap.xml`.
2. Copiar el bloque de Google Analytics (`G-RJFWRZVCTC`) y Google Tag Manager (`GTM-T48SB3HV`) del `<head>` de cualquier página existente.
3. Añadir el `<link rel="canonical">` correspondiente.

### Estilos y scripts

`assets/css/` y `assets/js/` tienen versiones fuente y minificadas del mismo archivo. Los HTML referencian la versión `.min`. Al editar, modificar **ambas versiones** (no hay pipeline de minificación automático).

## Blog (Hugo)

El blog vive en `build/` y se publica bajo `https://ewala.es/blog/`.

```
build/
├── hugo.toml              ← configuración Hugo (baseURL, tema, parámetros)
├── content/posts/         ← posts del blog en Markdown (aquí se añade contenido nuevo)
├── themes/paper/          ← tema Hugo con Tailwind (su propio package.json)
├── static/                ← imágenes y assets estáticos del blog
└── docs/                  ← output generado por Hugo (no editar manualmente)
```

### Añadir un post

1. Crear un archivo `.md` en `build/content/posts/` siguiendo el frontmatter de posts existentes.
2. Previsualizar en local antes de publicar (ver más abajo).

### Desarrollo local del blog

```bash
cd build
hugo server -D          # -D incluye posts en draft; accesible en http://localhost:1313
```

### Build de producción

```bash
# Tal como lo ejecuta Netlify — requiere Hugo 0.157.0
hugo --minify --source build --destination build/docs && cp -R build/docs blog
```

> La carpeta `/blog/` en producción **no está en el repo**: se genera en cada deploy mediante el `cp` anterior.

## Despliegue

El despliegue es **automático en Netlify** al hacer push a `main`. La configuración está en `netlify.toml`:

- **Build command**: `hugo --minify --source build --destination build/docs && cp -R build/docs blog`
- **Publish directory**: `/` (la raíz entera del repo es el document root)
- **Hugo version**: 0.157.0 (fijada en `[build.environment]`)

Los contextos `deploy-preview` y `branch-deploy` construyen con `-b $DEPLOY_PRIME_URL` para que los enlaces del blog apunten al preview correcto. Útil para revisar posts con fecha futura (añadir `--buildFuture`).

Las redirecciones 301 de `www.` y `http://` a `https://ewala.es` están configuradas en `netlify.toml` — no en el servidor.

## SEO

- `sitemap.xml` y `robots.txt` en la raíz se gestionan **manualmente**.
- El blog genera su propio `sitemap.xml` bajo `/blog/`.
- Analytics: Google Analytics `G-RJFWRZVCTC` + GTM `GTM-T48SB3HV` en el `<head>` de cada página del sitio principal.

## Licencia

Copyright © Ewala IT Services. Todos los derechos reservados.
