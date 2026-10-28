# Ewala · web corporativa (ewala.es)

Web de **Ewala IT Services**: Next.js 16 + React 19 + Tailwind CSS 4, exportada como **sitio estático** y
publicada en **Netlify**, con dos **Netlify Functions** (formulario de contacto con Resend y sumidero de
informes CSP). Idiomas: español (`/es/`) e inglés (`/en/`).

> Documentación técnica: [`CLAUDE.md`](CLAUDE.md) (resumen y reglas) y
> [`docs/arquitectura.md`](docs/arquitectura.md) (detalle y motivos). La web anterior (HTML + blog Hugo)
> está en la rama `backup-web-antigua`.

## Requisitos

- **Node.js 24.18** (ver `.nvmrc`). Con nvm: `nvm use`.
- **pnpm 12.6** (fijado en `package.json`). La forma más sencilla: `corepack enable` (en Windows, desde
  una terminal de administrador) o `npm install -g pnpm@12.6.0`.
- Git.

> ⚠️ Si el repositorio está dentro de **OneDrive**, pausa la sincronización mientras trabajas: OneDrive
> bloquea `node_modules`, `.next` y `out` y provoca errores `EPERM` en el build.

## Puesta en marcha

```bash
pnpm install          # instala dependencias (respeta pnpm-lock.yaml)
pnpm dev              # http://localhost:3000 — desarrollo con recarga en caliente
```

`pnpm dev` **no** aplica `netlify.toml` (redirecciones, cabeceras) ni ejecuta las funciones. Para probar
como en producción:

```bash
pnpm build                                                         # genera out/
pnpm dlx --package=netlify-cli netlify dev --dir out --offline     # http://localhost:8888
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Genera el sitio estático en `out/` (incluye comprobación de tipos y el contenido del blog) |
| `pnpm lint` | ESLint (debe terminar con 0 errores) |
| `pnpm typecheck` | Comprueba tipos sin hacer build (incluye las funciones de `netlify/`) |
| `pnpm verify:seo` | Audita el SEO de cada página de `out/` (ejecutar tras `pnpm build`) |
| `pnpm verify:redirects [url]` | Comprueba que las URLs de la web antigua redirigen (301) o están retiradas (410) y que las nuevas responden 200. Por defecto contra `http://localhost:8888`; también `pnpm verify:redirects https://ewala.es` |

## Estructura

```
app/                 páginas (App Router) — app/[locale]/… es cada página en es/en
components/ewala/    componentes propios de la web
components/ui/       componentes shadcn/ui (no editar a mano)
content/blog/        artículos del blog en Markdown (es/ y en/)
i18n/                internacionalización propia
lib/                 utilidades (SEO, JSON-LD, contrato del formulario, analítica…)
messages/            TODOS los textos de la web (es.json, en.json)
netlify/functions/   funciones de servidor (formulario, informes CSP)
netlify/lib/         código compartido por las funciones
public/              ficheros públicos (imágenes, PDFs institucionales, gtm.js, 410.html)
scripts/             scripts de build y de verificación
docs/                documentación interna (no se publica)
netlify.toml         build, redirecciones, cabeceras de seguridad y caché de Netlify
```

## Variables de entorno

Copia `.env.local.example` a `.env.local` para desarrollo (nunca se sube a git). En Netlify se definen en
**Site configuration → Environment variables**:

| Variable | Scope | Para qué |
|---|---|---|
| `RESEND_API_KEY` | Functions · **secreto** | Clave de Resend («Sending access», limitada al dominio de envío) |
| `RESEND_FROM` | Functions | Remitente verificado, p. ej. `Web Ewala <web@notify.ewala.es>` |
| `CONTACT_MAILBOX_TO` | Functions | Buzón que recibe las consultas (`info@ewala.es`) |
| `MAIL_ENVIRONMENT` | Functions | `production` en producción; en previews, p. ej. `staging` (se añade al asunto) |
| `NEXT_PUBLIC_SITE_URL` | Builds | Opcional. Por defecto `https://ewala.es` (vacía = por defecto; la barra final se ignora) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Builds | Opcional. Verificación de Search Console por metaetiqueta |
| `NEXT_PUBLIC_SHOW_DEMO_CTA` | Builds | `true` muestra los botones de demo (por defecto ocultos) |

Sin las variables de Resend, el formulario funciona en **modo prueba**: valida, no envía y lo indica en
pantalla. Las variables `NEXT_PUBLIC_*` se incrustan en el build: tras cambiarlas hay que redesplegar.

## Despliegue

Netlify compila automáticamente con cada push:

- **`main` → producción** (`ewala.es`).
- **Otras ramas / Pull Requests → previews** (`*.netlify.app`). Las previews salen con `noindex` y
  `robots.txt` cerrado, así que no afectan al SEO.

El comando de build, la carpeta publicada y las versiones de Node y pnpm están en `netlify.toml`; no hay
que configurarlos en el panel. **Rollback:** Netlify → *Deploys* → elegir un deploy anterior → *Publish deploy*.

## Tareas habituales

### Añadir un artículo al blog

1. Crea `content/blog/es/<slug>.md` y `content/blog/en/<slug>.md` (mismo `<slug>`, en minúsculas y con
   guiones). Copia el front matter de un artículo existente y rellénalo (ver la sección «Blog» de
   `CLAUDE.md`: límites de caracteres y categorías).
2. La imagen va en `public/` con nombre sin tildes, ñ ni espacios.
3. En el cuerpo **no uses `#`** (el título ya es el H1): empieza con `##`.
4. Enlaces internos relativos y con barra final: `/es/blog/otro-articulo/`.
5. `pnpm build && pnpm verify:seo`.

### Añadir una redirección

1. Edita `netlify.toml` y añade el bloque `[[redirects]]` **antes** de la regla final `/*` → `/404.html`
   y antes de cualquier comodín que pudiera capturarlo (p. ej. `/blog/*`).
2. Usa `status = 301` para contenido que se ha movido y `410` (con `to = "/410.html"`) para contenido
   retirado definitivamente.
3. Prueba con `netlify dev` + `pnpm verify:redirects`.

### Cambiar un texto

Todos los textos están en `messages/es.json` y `messages/en.json`: cambia **los dos** (misma clave). Si
es un texto legal, actualiza también su fecha `updated`.

### Antes de cada commit

```bash
pnpm lint && pnpm typecheck && pnpm build && pnpm verify:seo
```

## Servicios externos

| Servicio | Uso |
|---|---|
| Netlify | Hosting, funciones, redirecciones, cabeceras |
| Resend | Envío del correo del formulario de contacto (dominio `notify.ewala.es`) |
| Google Tag Manager (`GTM-KG3ZWVWW`) | Analítica (GA4 configurado dentro del contenedor) |
| Cookiebot | Banner y registro del consentimiento de cookies (configurado en GTM) |
| Google Search Console | Indexación y sitemap (`https://ewala.es/sitemap.xml`) |
