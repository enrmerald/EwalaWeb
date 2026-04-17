# Blog de Ewala IT Services — Hugo

Blog corporativo de **Ewala IT Services** publicado en **[https://ewala.es/blog/](https://ewala.es/blog/)**.

Construido con [Hugo](https://gohugo.io/) y el tema [Paper](https://github.com/nanxiaobei/hugo-paper). Forma parte del repositorio principal del sitio web — ver el `README.md` en la raíz para el contexto completo.

## Estructura

```
build/
├── hugo.toml              ← configuración: baseURL, tema, parámetros, taxonomías
├── content/posts/         ← posts en Markdown (aquí se añade contenido nuevo)
├── themes/paper/          ← tema (Tailwind interno, no afecta al sitio principal)
├── static/                ← imágenes y assets estáticos del blog
│   └── images/
└── docs/                  ← output generado; no editar manualmente
```

## Desarrollo local

```bash
cd build
hugo server -D    # -D incluye drafts; disponible en http://localhost:1313
```

Para ver posts con fecha futura:

```bash
cd build
hugo server -D --buildFuture
```

## Añadir un post

1. Crear `build/content/posts/nombre-del-post.md`.
2. Usar el frontmatter de cualquier post existente como plantilla:

```yaml
---
title: "Título del post"
title_seo: "Título SEO (puede ser más corto)"
description_seo: "Descripción para meta description (~155 caracteres)."
date: 2026-04-17T10:00:00.000Z
lastmod: 2026-04-17T10:00:00.000Z
draft: false
tags: ["ciberseguridad", "ot"]
categories: ["Ciberseguridad"]
image: "/blog/images/nombre-imagen.png"
---
```

3. Previsualizar con `hugo server -D` antes de hacer push.
4. Al publicar, asegurarse de que `draft: false` y la fecha no sea futura (o usar el contexto `deploy-preview` de Netlify para revisar antes).

## Build de producción

El build lo ejecuta Netlify automáticamente. El comando está definido en `netlify.toml` (raíz del repo):

```bash
hugo --minify --source build --destination build/docs && cp -R build/docs blog
```

> Requiere **Hugo 0.157.0**. La carpeta `blog/` resultante no está commiteada — se genera en cada deploy.

## Tema Paper

El tema está en `build/themes/paper/` y tiene su propio `package.json` con Tailwind. No modificar el tema directamente salvo que sea estrictamente necesario; preferir sobreescribir estilos desde `build/static/`.
