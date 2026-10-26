  Plan de implementación — Adaptación a colores corporativos

  Paleta que se aplicará

  ┌───────────────────┬────────────────────┬───────────────────────────────────────────────────────┐
  │       Token       │       Valor        │                          Uso                          │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Fondo principal   │ #2f2f2f (Gris 20%) │ Base de la página                                     │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Fondo alternativo │ #FFFFFF            │ Secciones que alternan                                │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Fondo oscuro      │ #000000            │ Footer, Innovation (contraste máximo)                 │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Acento verde      │ #00e58d            │ Títulos destacados, badges, CTAs, iconos              │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Acento morado     │ #7e1b54            │ Acento producto LIVET (paleta secundaria corporativa) │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Texto principal   │ #111111            │ Body, párrafos                                        │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Texto secundario  │ #4D4D4D (Gris 70%) │ Descripciones, labels                                 │
  ├───────────────────┼────────────────────┼───────────────────────────────────────────────────────┤
  │ Texto terciario   │ #808080 (Gris 50%) │ Captions, subtítulos menores                          │
  └───────────────────┴────────────────────┴───────────────────────────────────────────────────────┘

  ---
  Archivos a modificar

  1. app/globals.css
  Redefinir los tokens CSS (--background, --foreground, --primary, --muted, etc.) con la nueva paleta corporativa clara. Esto afecta a todos los shadcn primitivos de forma automática.

  2. app/[locale]/layout.tsx
  Quitar bg-slate-950 del <html> y <body> → pasar a fondo gris 20%.

  3. app/[locale]/page.tsx
  Quitar bg-slate-950 del <main>.

  4. lib/products.ts
  - SentryN3t: mantiene verde #00e58d (ya es el color corporativo principal)
  - LIVET: cambiar de teal #14b8a6 al morado corporativo #7e1b54 / #ffffff (paleta secundaria del manual)

  5. components/ewala/header.tsx
  De fondo negro con texto claro → fondo blanco/gris con texto oscuro. Logo y nav en negro, CTA en verde.

  6. components/ewala/footer.tsx
  Fondo negro corporativo con texto blanco — buen contraste y cierre visual limpio.

  7. Secciones (components/ewala/sections/)
  Cada sección se adapta según alternancia:

  ┌──────────────┬──────────────┬───────────────┬─────────────────────────────────────────┐
  │   Sección    │ Fondo actual │  Fondo nuevo  │              Cambio clave               │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Hero         │ slate-950    │ Gris 20%      │ Títulos negro + verde en acento         │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Metrics      │ slate-900    │ Blanco        │ Números en negro, labels gris 70%       │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Showcase     │ slate-950    │ Gris 20%      │ Cards en blanco, bordes sutiles         │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Capabilities │ slate-50     │ Blanco        │ Ya era claro, refinamiento              │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Sectors      │ slate-950    │ Gris 20%      │ Cards en blanco                         │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Innovation   │ slate-900    │ Negro         │ Único bloque oscuro de contraste        │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Testimonial  │ white        │ Blanco        │ Ya era claro, refinamiento              │
  ├──────────────┼──────────────┼───────────────┼─────────────────────────────────────────┤
  │ Final CTA    │ slate-900    │ Verde #00e58d │ Cierre impactante con color corporativo │
  └──────────────┴──────────────┴───────────────┴─────────────────────────────────────────┘

  8. components/ewala/partners-section.tsx
  Fondo gris 20%, logos en gris oscuro.

  9. components/ewala/floating-product-tabs.tsx
  Barra flotante en blanco/gris muy claro con borde, texto negro.

  ---
  Lógica de uso del verde en títulos

  El verde se usará en dos modalidades:
  - Span de acento: última o más importante palabra del h1/h2 en verde (patrón que ya existe pero con var(--brand))
  - Eyebrow labels: todos los labels previos al título en verde corporativo
  - Iconos y checks: todos en verde

  ---
  Orden de implementación

  1. globals.css → tokens base
  2. layout.tsx + page.tsx → eliminar slate-950 del wrapper
  3. lib/products.ts → colores de producto
  4. header.tsx + footer.tsx
  5. Secciones de arriba a abajo (hero → final-cta)
  6. partners-section.tsx + floating-product-tabs.tsx
