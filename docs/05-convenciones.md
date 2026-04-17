# 05 — Convenciones de código y flujo de trabajo

Convenciones a seguir durante y después del refactor para mantener la coherencia del sitio.

## 1. Estructura de archivos

- **HTML fuente**: `/src/pages/<slug>.html`. Nunca editar directamente los HTML de la raíz (son artefactos generados).
- **Partials**: `/src/partials/**`. Organizados por categoría (`head/`, `schema/`, componentes sueltos).
- **HTML generados**: raíz del repo. Commitear siempre junto al fuente para que Netlify los sirva aunque el build falle.
- **Assets**: mantener la estructura `/assets/{css,js,img,vendor}/`.

## 2. Nomenclatura

- **Archivos HTML**: `kebab-case.html`, en español, sin acentos ni `ñ` (compatibilidad de URLs).
- **Clases CSS**: `kebab-case`, con prefijo de componente cuando aplique (`.navbar__item`, `.hero__title`). Estilo BEM ligero.
- **IDs HTML**: `kebab-case`, únicos por página.
- **Variables CSS**: `--nombre-descriptivo` (ej. `--color-primario`, `--spacing-lg`).
- **Funciones JS**: `camelCase`.

## 3. HTML

- Indentación: 2 espacios.
- Atributos: comillas dobles siempre.
- `<img>`: **siempre** con `alt`, `width`, `height`, `loading` (`eager` o `lazy`) y `decoding="async"`.
- Enlaces externos: `target="_blank" rel="noopener noreferrer"`.
- Idioma: `lang="es"` en `<html>`.

## 4. CSS

- Mobile-first con `@media (min-width: Xpx)`.
- Evitar `!important` salvo utilidades.
- Variables CSS para colores, tipografías, radios y sombras centralizadas en `base/variables.css`.
- No estilar por ID; usar clases.
- No suprimir estilos `:focus`; usar `:focus-visible` para refinar.

## 5. JavaScript

- Preferir JS moderno (ES2020+) en código nuevo.
- No introducir dependencias NPM sin discutirlo.
- `defer` por defecto en scripts no críticos.
- Mantener jQuery solo para compatibilidad con vendors; no añadirlo a código nuevo.

## 6. SEO — checklist por página

Al crear o revisar una página, verificar:

- [ ] `<title>` único, ≤ 60 caracteres.
- [ ] `meta description` única, 120–155 caracteres.
- [ ] `<link rel="canonical">` absoluto.
- [ ] Open Graph completo (type, site_name, locale, url, title, description, image).
- [ ] Twitter Cards.
- [ ] Un único `<h1>` con keyword principal.
- [ ] Jerarquía `h1 → h2 → h3` sin saltos.
- [ ] JSON-LD `Organization` (vía partial).
- [ ] JSON-LD específico si aplica (`Service`, `FAQPage`, `BreadcrumbList`, etc.).
- [ ] Imágenes con `alt` significativo y dimensiones explícitas.
- [ ] Presencia en `sitemap.xml`.

## 7. Flujo de edición

1. Crear rama desde `main`: `feat/<descripcion>` o `fix/<descripcion>`.
2. Editar `src/pages/*.html` o `src/partials/**` — nunca los HTML de raíz.
3. Ejecutar `node scripts/build.js` para regenerar los HTML.
4. Validar en local (Live Server o similar).
5. Validar SEO: Rich Results Test en páginas tocadas.
6. Commit incluyendo **tanto fuentes como generados**.
7. Push → PR → revisión deploy preview de Netlify → merge.

## 8. Commits

- Mensajes en español (coherente con el resto del repo).
- Imperativo: "Añade…", "Corrige…", "Refactoriza…".
- Referencia al área: `[SEO] Añade Schema Organization global`.

## 9. Cuándo actualizar esta documentación

- Al incorporar una nueva convención discutida en PR.
- Al modificar la estructura de `/src/` o `/assets/`.
- Al cambiar el comando de build de Netlify.
- Al añadir una nueva página al sitio (actualizar también `sitemap.xml`).

## 10. Qué NO hacer

- ❌ Editar directamente los HTML de la raíz tras la Fase 3 (son artefactos).
- ❌ Añadir páginas al sitio sin añadirlas a `sitemap.xml`.
- ❌ Duplicar bloques de navbar/footer/head en HTML nuevos; usar partials.
- ❌ Introducir dependencias NPM sin justificación.
- ❌ Romper la regla de un `<h1>` por página.
- ❌ Dejar `console.log` en JS productivo.
- ❌ Comprometer `node_modules/` o archivos `.min` generados automáticamente sin documentar.
