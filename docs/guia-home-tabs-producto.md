# Guía de implementación: Home con tabs globales de producto ("2 landings en 1")

> **Documento histórico.** Describe el diseño con dos productos (SentryN3t + LIVET). LIVET se retiró
> de la web y hoy la home tiene un solo producto con los tabs dormidos; el estado vigente está en
> `CLAUDE.md` y en `docs/arquitectura.md`. Se conserva como referencia para reactivar los tabs si se
> añade un segundo producto.

> **Para quién es esta guía:** un desarrollador que conoce React/Next.js a nivel básico-intermedio
> pero **no** conoce este repo. Sigue los pasos **en orden**. Cada paso termina con un bloque
> **✅ Verificación** que debes pasar antes de continuar. No saltes pasos.
>
> **Lectura previa obligatoria:** [`docs/arquitectura.md`](./arquitectura.md) (modelo build vs runtime y
> prohibiciones) y el `CLAUDE.md` de la raíz. Esta guía asume esas reglas.

---

## 0. Objetivo en una frase

Hoy la home (`app/[locale]/page.tsx`) es una página de scroll lineal centrada en un producto
(SentryN3t). La vamos a convertir en una **home con un selector de producto (tabs)** justo debajo
del header. Al pulsar un tab, **cambia toda la página**: cada producto (SentryN3t y LIVET) tiene su
propio Hero, métricas, secciones, CTAs y narrativa. Es la misma URL (`/es`, `/en`) con dos
"landings" internas conmutables, sincronizadas con el hash de la URL (`#sentryn3t` / `#livet`).

**Dos productos:**

- **SentryN3t** — ciberseguridad / detección de anomalías en redes IT/OT/IoT. Acento **verde `#00e58d`** (color corporativo).
- **LIVET** — **plataforma de gestión de ganadería extensiva con ciberseguridad *by design***
  (animales, lotes, tratamientos, partos, trazabilidad, cooperativas). Acento **teal-500 (`#14b8a6`)**.

> ⚠️ **MUY IMPORTANTE sobre LIVET.** En el código actual LIVET aparece descrito como
> "monitorización no invasiva de personas mayores" (agua/luz/sensor de puerta, caídas...).
> **Eso es contenido OBSOLETO y NO debe usarse.** El posicionamiento correcto y validado es
> **ganadería extensiva**, y la fuente de contenido es [`docs/informacion-LIVET.md`](./informacion-LIVET.md).
> Cualquier texto que hable de mayores, agua/luz/puerta o cuidado asistencial debe eliminarse.

---

## 1. Conceptos previos (no te saltes esto)

### 1.1. El repo exporta HTML estático (sin servidor)

`next.config.mjs` usa `output: 'export'`: el build genera `out/` (HTML puro) y se sirve en un CDN
**sin Node.js en producción**. Consecuencias para esta tarea:

- **PROHIBIDO:** API Routes, `'use server'`, `headers()`, `cookies()`, `middleware.ts`.
- **PROHIBIDO** sincronizar el tab con `useSearchParams()` (Next obliga a envolverlo en `<Suspense>`
  en modo estático y complica todo). **Usaremos el hash** (`window.location.hash`), que es seguro.
- Solo variables públicas `NEXT_PUBLIC_*`.

### 1.2. Server Components vs islas cliente

- Por defecto, los componentes son **Server Components**: se renderizan en build, generan HTML, y
  **no envían JavaScript al navegador**. No pueden usar `useState`, `useEffect`, `onClick`, etc.
- Un componente es **isla cliente** solo si su primera línea es `"use client"`. Solo entonces puede
  tener estado/efectos/eventos.
- **Truco que usamos en esta tarea:** un componente cliente *puede recibir Server Components ya
  renderizados como props* (de tipo `ReactNode`). Así, nuestra isla cliente de tabs
  (`ProductExperience`) solo se encarga del estado y el conmutado, mientras que **todo el contenido
  de cada landing sigue siendo Server Component** (HTML estático, SEO intacto, JS mínimo).

### 1.3. Por qué renderizamos las DOS landings en el HTML

Pre-renderizamos ambas landings en el HTML estático y ocultamos la inactiva con `hidden`. Ventajas:
SEO de los dos productos, sin "parpadeo" de hidratación, y permite conmutar sin recargar. El coste
(HTML algo más grande) es irrelevante en un CDN.

### 1.4. i18n (sistema propio, NO next-intl)

- El contenido vive en `messages/es.json` y `messages/en.json` (misma estructura de claves).
- `i18n/types.ts` hace `Messages = typeof esMessages`: es decir, **la forma de `es.json` define los
  tipos de TypeScript de todo el proyecto**. Si cambias la estructura de `es.json`, cambias los tipos.
- **Regla de oro:** cada cambio que hagas en `es.json` debes replicarlo con la **misma estructura**
  en `en.json` (con el texto traducido). Si las estructuras divergen, el build de tipos falla o
  aparecen textos como claves crudas.
- Server Components reciben su texto por props (`t={dict.xxx}`). Islas cliente usan
  `useTranslations('namespace')`.

---

## 2. Resultado final (árbol de componentes objetivo)

```
app/[locale]/page.tsx  (Server Component)
│  getDictionary(locale) → dict
│  Construye dos <ProductLanding/> (uno por producto) y los pasa como "slots"
│
├─ <Header/>                          (isla cliente — ya existe; retoque menor)
│
├─ <ProductExperience slots={...}/>   ★ NUEVA isla cliente (el ÚNICO sitio que sabe de tabs/hash)
│     ├─ <FloatingProductTabs/>       ★ NUEVO (selector sticky bajo el header)
│     ├─ slot "sentryn3t" → <ProductLanding active .../>   (Server Component)
│     └─ slot "livet"     → <ProductLanding .../>          (Server Component, oculto si inactivo)
│
├─ <PartnersSection/>                 (global, fuera de tabs)
├─ <LogoCarousel/>                    (global)
├─ <Footer/>                          (isla cliente — global)
└─ <MobileStickyCta/>                 (isla cliente — global; refleja producto activo)

<ProductLanding/>  (Server Component, AGNÓSTICO de tabs/hash)
   fija las variables CSS --brand y --brand-foreground + data-product
   └─ components/ewala/sections/
        product-hero.tsx          (variant por producto)
        product-metrics.tsx
        product-showcase.tsx      (variant: "bento" Sentry | "flow" LIVET)
        product-capabilities.tsx
        product-sectors.tsx
        product-innovation.tsx    (variant: "terminal" Sentry | "panel" LIVET)
        product-testimonial.tsx
        product-final-cta.tsx
```

> **Por qué `ProductLanding` es "agnóstico de tabs":** no sabe que existen tabs ni hash. Recibe su
> `content`, su `config` y un booleano `active`. Gracias a esto, en el futuro podremos crear rutas
> dedicadas `/es/sentryn3t` y `/es/livet` reutilizando exactamente las mismas secciones, sin tocar
> nada. Todo el acoplamiento a tabs/hash queda **aislado** en `ProductExperience`.

---

## 3. Reglas que NO debes romper

1. **No introduzcas servidor.** Nada de API routes, server actions, `cookies()`, `headers()`,
   `useSearchParams()` sin `<Suspense>`. Tab ↔ hash, y punto.
2. **Cero texto hardcodeado en componentes.** Todo texto sale de `messages/*.json`. Si ves una
   cadena visible escrita en el `.tsx`, está mal.
3. **`es.json` y `en.json` siempre con la misma estructura de claves.**
4. **Acento por variable CSS, no por color fijo.** Sustituye `#00e58d` por `var(--brand)` (detalle
   en el Paso 2). No dupliques componentes por color.
5. **No uses `--accent` como nombre de variable:** ya está ocupada por shadcn en `globals.css`.
   Usamos **`--brand`**.
6. **Un solo `<h1>` activo en la página.** El producto activo lleva el `<h1>` real; el inactivo va
   oculto con `hidden` + `aria-hidden="true"` + `inert`. (Detalle en Paso 4.)
7. **No inventes datos de LIVET.** El documento de LIVET no trae cifras ni testimonios reales: usa
   el marcador literal `[PENDIENTE DE VALIDACIÓN]` en esos campos. Nunca inventes números ni citas.
8. **Named exports** (`export function Foo()`), nunca `export default`, en los componentes de sección.
9. **Alias de imports:** `@/components/...`, `@/lib/...`, `@/i18n/...`.

---

## 4. Estado actual (lo que te vas a encontrar)

- `app/[locale]/page.tsx`: lista plana de secciones, todas con contenido de SentryN3t.
- `components/ewala/`: `header`, `hero-section`, `metrics-strip`, `product-showcase`,
  `bento-capabilities`, `sectors-section`, `innovation-section`, `testimonial-section`,
  `partners-section`, `final-cta`, `footer`, `mobile-sticky-cta`, `logo-carousel`,
  `announcement-bar` (este último **huérfano**: no se importa en ningún sitio → **NO lo toques**).
- Acento `#00e58d` **hardcodeado** ~66 veces en 11 archivos, y gradientes `rgba(5,227,145,...)`.
- `components/ewala/product-showcase.tsx` ya usa Radix Tabs para alternar Sentry/LIVET dentro de
  **una** sección: es la base conceptual que vamos a "ascender" a toda la página.
- `messages/{es,en}.json`: namespaces globales (`hero`, `metrics`, `bento`, `sectors`,
  `innovation`, `testimonials`, `finalCta`) + un namespace `products` con `sentryn3t` y `livet`
  (este último con el contenido OBSOLETO de mayores).

**Componentes shadcn (`components/ui/*`): NO se tocan.**

---

## 5. PASO 1 — Reestructurar el contenido (`messages/*.json`) y los tipos

> Este es el paso más delicado porque cambia la **fuente de verdad de contenido y de tipos**.
> Hazlo completo y de una sola vez. Al final, `pnpm lint` y el editor no deben dar errores de tipos.

### 5.1. Idea del refactor

Hoy el contenido "global" (hero, metrics, bento, sectors, innovation, testimonials, finalCta) es en
realidad de SentryN3t. Lo movemos **dentro de cada producto**, de modo que cada producto tenga su
landing completa con la **misma forma**:

```
products
 ├─ ui            (labels y subtítulos de los tabs)
 ├─ sentryn3t
 │    ├─ label
 │    ├─ hero
 │    ├─ metrics
 │    ├─ showcase
 │    ├─ capabilities
 │    ├─ sectors
 │    ├─ innovation
 │    ├─ testimonial
 │    └─ finalCta
 └─ livet
      └─ (misma forma exacta, contenido distinto)
```

Los namespaces **globales** que se quedan fuera de `products`: `meta`, `nav`, `logoCarousel`,
`partners`, `footer`, `mobileCta`.

### 5.2. Estructura objetivo de `messages/es.json` (bloque `products`)

Reemplaza el bloque `"products": { ... }` actual por la estructura de abajo. **El contenido de
SentryN3t sale de migrar lo que hoy ya existe** en los namespaces globales (`hero`, `metrics`,
`bento` → `capabilities`, `sectors`, `innovation`, `testimonials` → `testimonial`, `finalCta`) y de
[`docs/informacion-Sentry.md`](./informacion-Sentry.md). **El de LIVET sale de
[`docs/informacion-LIVET.md`](./informacion-LIVET.md)** (ganadería).

```jsonc
"products": {
  "ui": {
    "tab_sentryn3t": "SentryN3t Protection",
    "tab_sentryn3t_subtitle": "Ciberseguridad OT/IoT",
    "tab_livet": "LIVET",
    "tab_livet_subtitle": "Gestión ganadera segura",
    "aria_label": "Seleccionar producto"
  },

  "sentryn3t": {
    "label": "SentryN3t Protection",

    "hero": {
      "badges": ["Alineado con NIS2", "Detección con IA", "Avalado por I+D europeo"],
      "headlineParts": ["Protege lo que", "no puede", "permitirse parar"],
      "description": "SentryN3t Protection ofrece detección de anomalías con IA y monitorización de amenazas en tiempo real para entornos industriales OT/IoT. Diseñado para operaciones críticas donde cada segundo de inactividad tiene un coste.",
      "ctaPrimary": "Hablar con un experto",
      "ctaSecondary": "Explorar la plataforma",
      "stats": [
        { "value": "15+",  "label": "Años en OT/IoT" },
        { "value": "100%", "label": "Tecnología propia" },
        { "value": "24/7", "label": "SOC gestionado" },
        { "value": "NIS2", "label": "Alineado con NIS2" }
      ],
      "dashboard": {
        "title": "SentryN3t Protection — Panel en vivo",
        "network": "Tráfico de red",
        "anomaly": "Anomalía",
        "alertsLabel": "Alertas activas",
        "critical": "Crítico",
        "assets": "14 activos monitorizados",
        "threatLabel": "Puntuación de amenaza",
        "risk": "Riesgo medio",
        "devicesLabel": "Dispositivos OT",
        "new": "↑ 12 nuevos",
        "anomaliesLabel": "Anomalías/24h",
        "live": "Monitorización en vivo",
        "alertTitle": "Anomalía detectada",
        "alertDesc": "Dispositivo no autorizado en Segmento OT-3",
        "time": "hace 2s"
      }
    },

    "metrics": {
      "items": [
        { "value": "+15 años",    "label": "de experiencia en ciberseguridad OT/IoT" },
        { "value": "I+D europeo", "label": "Proyectos activos y asociaciones de investigación" },
        { "value": "100%",        "label": "Tecnología propia, sin dependencia de proveedor" },
        { "value": "24/7",        "label": "SOC gestionado y cobertura de respuesta a amenazas" }
      ],
      "quote": "\"Construido sobre entornos industriales reales, no simulaciones de laboratorio. Porque las amenazas son reales.\""
    },

    "showcase": {
      "variant": "bento",
      "eyebrow": "Plataforma NDR con IA",
      "headline": "Ciberseguridad industrial construida para la realidad OT/IoT",
      "description": "SentryN3t Protection monitoriza tu red industrial en tiempo real, usando machine learning para detectar anomalías de comportamiento en dispositivos OT, sensores IoT y entornos IT/OT convergentes — antes de que se conviertan en incidentes.",
      "features": [
        "Detección de anomalías con IA — sin bases de datos de firmas",
        "Inventario completo de activos: dispositivos IT, OT e IoT autodescubiertos",
        "Arquitectura multi-tenant preparada para MSSP",
        "Informes de cumplimiento NIS2 y ENS integrados"
      ],
      "ctaPrimary": "Solicitar una demo",
      "ctaSecondary": "Ver ficha técnica",
      "tags": ["Industrial", "Infraestructura crítica", "Agroalimentario", "Sector público"],
      "cards": [
        { "title": "Análisis de tráfico en tiempo real", "description": "Monitoriza cada paquete y flujo entre segmentos OT/IT" },
        { "title": "Motor de anomalías con IA",          "description": "Modelos ML detectan desviaciones del comportamiento base" },
        { "title": "Inventario de activos",              "description": "Autodescubre y clasifica cada dispositivo conectado" },
        { "title": "Alertas accionables",                "description": "Alertas con IA explicable: severidad, contexto y evidencias" }
      ]
    },

    "capabilities": {
      "sectionLabel": "CAPACIDADES DE LA PLATAFORMA",
      "headline": "Todo lo que necesitas para proteger infraestructuras industriales",
      "subheadline": "Una plataforma completa para detección en red, gestión de activos, cumplimiento normativo y respuesta a amenazas.",
      "cta": "Saber más",
      "items": [
        { "title": "Detección de anomalías de comportamiento", "description": "Nuestro motor de IA establece una línea base del comportamiento normal de cada dispositivo en tu red. Cualquier desviación — tráfico inusual, conexiones desconocidas, cambios de comportamiento — activa una alerta explicable con contexto completo." },
        { "title": "Convergencia IT/OT/IoT",                   "description": "Visibilidad unificada de todos los activos conectados independientemente del protocolo — Modbus, PROFINET, MQTT, TCP/IP estándar." },
        { "title": "Cumplimiento NIS2 y ENS",                  "description": "Módulos de informes de cumplimiento prediseñados para los requisitos de las directivas europeas." },
        { "title": "Multi-tenant para MSSP",                   "description": "Gestiona múltiples entornos de clientes desde un único panel con estricto aislamiento de datos." },
        { "title": "Visualización avanzada y laboratorio de IA","description": "Mapas de topología de red interactivos, mapas de calor de tráfico, correlación temporal y un laboratorio de IA integrado para entrenamiento de modelos — desarrollado en colaboración con la Universidad de Oviedo." },
        { "title": "Gestión de alertas accionables",          "description": "Alertas priorizadas con severidad, contexto de activos, evidencias y flujos de trabajo asignables — sin volcados de logs en bruto." }
      ]
    },

    "sectors": {
      "headline": "Diseñado para entornos donde el fallo no es una opción",
      "subheadline": "Desde plantas de producción hasta infraestructuras críticas, SentryN3t Protection se adapta a tu realidad operativa.",
      "cta": "Explorar solución",
      "items": [
        { "name": "Fabricación Industrial OT",          "problem": "Proteger controladores PLC, sistemas SCADA y redes de sensores frente a movimiento lateral y ataques a la cadena de suministro." },
        { "name": "Infraestructuras Críticas",          "problem": "Los sistemas de energía, agua y transporte requieren monitorización continua con tolerancia cero a las interrupciones no planificadas." },
        { "name": "Agroalimentario y Cooperativas",     "problem": "Las líneas de procesado conectadas y los sistemas de cadena de frío son objetivos crecientes en campañas de ransomware." },
        { "name": "Sector Público y Defensa",           "problem": "Cumplimiento ENS, acceso remoto seguro y protección de datos ciudadanos en entornos convergentes." },
        { "name": "Ascensores y Mantenimiento en Campo","problem": "Los activos de campo conectados por IoT y el acceso remoto para mantenimiento crean superficies de ataque en expansión." },
        { "name": "MSSP y equipos SOC",                 "problem": "Fuente de visibilidad, alerta y análisis para servicios de seguridad gestionada multi-cliente." }
      ]
    },

    "innovation": {
      "variant": "terminal",
      "sectionLabel": "INNOVACIÓN E I+D",
      "headline": "Tecnología nacida de la investigación real, no del marketing",
      "description1": "SentryN3t Protection surge de años de investigación aplicada en detección de anomalías con IA, análisis de series temporales y seguridad IoT — desarrollado en colaboración activa con la Universidad de Oviedo y respaldado por programas de innovación financiados por la UE.",
      "description2": "Nuestro laboratorio de IA no es una funcionalidad — es el fundamento. Cada modelo de detección puede ser reentrenado, validado y explicado. Sin cajas negras.",
      "cta": "Conocer nuestra tecnología",
      "proofPoints": [
        { "title": "Proyectos financiados por la UE", "description": "Participante activo en programas europeos de innovación e investigación en defensa" },
        { "title": "Colaboración universitaria",      "description": "Investigación en detección de anomalías con IA con el Departamento de Informática de la Universidad de Oviedo" },
        { "title": "Programa ATD 2026",               "description": "Receptor de financiación nacional competitiva de I+D para NDR industrial con IA explicable" }
      ]
    },

    "testimonial": {
      "sectionLabel": "LO QUE DICEN NUESTROS CLIENTES",
      "quote": "\"SentryN3t Protection nos dio una visibilidad de nuestra red OT que nunca antes habíamos tenido. En la primera semana de despliegue, detectó dos dispositivos legacy comunicándose fuera de los parámetros esperados — algo que nuestras herramientas anteriores habían pasado completamente por alto.\"",
      "authorInitials": "JM",
      "authorName": "Javier M.",
      "authorRole": "Responsable de Seguridad OT, Grupo Industrial Manufacturero",
      "badges": ["Preparado para ISO 27001", "Cumplimiento NIS2", "Respaldado por I+D europeo", "IA validada por universidad"]
    },

    "finalCta": {
      "headline": "Empieza a proteger lo que no puede parar",
      "description": "Ya sea que necesites asegurar una red OT, monitorizar infraestructura crítica o elevar tu madurez en ciberseguridad — nuestro equipo está listo para mostrarte cómo.",
      "ctaPrimary": "Hablar con un experto",
      "ctaSecondary": "Explorar SentryN3t Protection",
      "checks": ["Sin compromiso", "Respuesta en menos de 24h", "Expertos en NIS2 y ENS disponibles"]
    }
  },

  "livet": {
    "label": "LIVET",

    "hero": {
      "badges": ["Seguridad desde el diseño", "Para ganadería extensiva", "Desarrollado por Ewala"],
      "headlineParts": ["Digitaliza tu", "explotación", "con confianza"],
      "description": "LIVET es una plataforma de gestión para ganadería extensiva desarrollada por Ewala, que incorpora ciberseguridad, trazabilidad y control de accesos desde el diseño. Gestiona animales, lotes, tratamientos y movimientos sobre una base tecnológica fiable y escalable.",
      "ctaPrimary": "Solicitar demo",
      "ctaSecondary": "Conocer LIVET",
      "stats": [
        { "value": "[PENDIENTE DE VALIDACIÓN]", "label": "Explotaciones gestionadas" },
        { "value": "[PENDIENTE DE VALIDACIÓN]", "label": "Animales registrados" },
        { "value": "Seguridad",                  "label": "by design en toda la plataforma" },
        { "value": "IoT",                        "label": "Integración modular y progresiva" }
      ],
      "dashboard": {
        "title": "LIVET — Panel de explotación",
        "network": "Actividad de la explotación",
        "anomaly": "Incidencia",
        "alertsLabel": "Incidencias abiertas",
        "critical": "Atención",
        "assets": "Lotes monitorizados",
        "threatLabel": "Estado sanitario",
        "risk": "Seguimiento",
        "devicesLabel": "Animales activos",
        "new": "↑ altas recientes",
        "anomaliesLabel": "Partos previstos",
        "live": "Datos sincronizados",
        "alertTitle": "Tratamiento pendiente",
        "alertDesc": "Lote A-12 requiere revisión sanitaria",
        "time": "hoy"
      }
    },

    "metrics": {
      "items": [
        { "value": "Seguridad",   "label": "integrada desde el diseño, no añadida al final" },
        { "value": "Trazabilidad","label": "de acciones, tratamientos y movimientos" },
        { "value": "IoT modular", "label": "sin depender de un único fabricante" },
        { "value": "Multi-perfil","label": "ganaderos, cooperativas, veterinarios y técnicos" }
      ],
      "quote": "\"Digitalizar el campo no es solo incorporar tecnología. Es hacerlo con confianza, seguridad y visión de futuro.\""
    },

    "showcase": {
      "variant": "flow",
      "eyebrow": "Gestión ganadera digital y segura",
      "headline": "Centraliza la gestión de tu explotación con criterios de seguridad",
      "description": "LIVET sustituye registros manuales, hojas de cálculo y aplicaciones aisladas por una plataforma única que organiza la información productiva, sanitaria y económica de la explotación, reduciendo riesgos de pérdida o dispersión de datos.",
      "features": [
        "Gestión de animales, lotes, tratamientos, partos y movimientos",
        "Control de accesos y permisos por perfil de usuario",
        "Trazabilidad de las acciones relevantes dentro del sistema",
        "Integración IoT modular: collares, geolocalización, control de parto"
      ],
      "ctaPrimary": "Solicitar demo",
      "ctaSecondary": "Ver capacidades",
      "tags": ["Ganadería extensiva", "Cooperativas", "Veterinarios", "Trazabilidad"],
      "cards": [
        { "title": "Gestión integral del ganado", "description": "Animales, lotes, tratamientos, partos, proveedores y costes en un único lugar" },
        { "title": "Control de accesos",          "description": "Quién accede a qué información y qué puede hacer cada perfil" },
        { "title": "Trazabilidad",                "description": "Registro de las acciones relevantes para auditoría y control" },
        { "title": "Integración IoT responsable", "description": "Conexión modular y progresiva de sensores y dispositivos" }
      ]
    },

    "capabilities": {
      "sectionLabel": "CAPACIDADES DE LA PLATAFORMA",
      "headline": "Gestión ganadera profesional sobre una base segura",
      "subheadline": "Una plataforma pensada para el entorno rural: útil y sencilla para el ganadero, robusta y segura por dentro.",
      "cta": "Saber más",
      "items": [
        { "title": "Gestión de usuarios y permisos",       "description": "Define perfiles y niveles de acceso para ganaderos, cooperativas, veterinarios y técnicos, manteniendo el control sobre la información." },
        { "title": "Control de accesos a la información",   "description": "Cada perfil ve y gestiona únicamente lo que le corresponde, protegiendo datos productivos, sanitarios y económicos." },
        { "title": "Trazabilidad de acciones",             "description": "Registro de las operaciones relevantes para facilitar auditoría, control y mejora continua." },
        { "title": "Arquitectura escalable",              "description": "Diseñada para crecer con la explotación y para modelos colaborativos multi-explotación." },
        { "title": "Integración IoT modular",             "description": "Incorporación ordenada de collares, geolocalización o control de parto sin depender de un único fabricante." },
        { "title": "Desarrollo seguro",                   "description": "Construida con buenas prácticas de seguridad para reducir riesgos de pérdida, manipulación o exposición indebida de datos." }
      ]
    },

    "sectors": {
      "headline": "Pensada para la realidad del sector extensivo",
      "subheadline": "Desde la explotación individual hasta cooperativas y entidades que acompañan a varios ganaderos.",
      "cta": "Explorar solución",
      "items": [
        { "name": "Explotaciones extensivas",     "problem": "Sustituir registros manuales y hojas de cálculo por una gestión centralizada, fiable y segura." },
        { "name": "Cooperativas",                 "problem": "Gestionar información de múltiples ganaderos y socios con control de accesos y trazabilidad." },
        { "name": "Veterinarios y técnicos",      "problem": "Acompañar a las explotaciones en su gestión sanitaria y productiva sin perder el control de la información." },
        { "name": "Asociaciones y entidades",     "problem": "Avanzar hacia modelos de digitalización colaborativa entre socios del sector agroganadero." },
        { "name": "Trazabilidad y cumplimiento",  "problem": "Mantener registros ordenados de animales, tratamientos y movimientos para control y auditoría." },
        { "name": "Explotaciones con IoT",        "problem": "Integrar sensores y dispositivos de forma ordenada, evitando dependencias y problemas de interoperabilidad." }
      ]
    },

    "innovation": {
      "variant": "panel",
      "sectionLabel": "TECNOLOGÍA Y SEGURIDAD",
      "headline": "Ciberseguridad aplicada a la digitalización del campo",
      "description1": "LIVET aplica la experiencia de Ewala en ciberseguridad, desarrollo seguro e inteligencia artificial para que la digitalización ganadera avance sobre una base fiable. La seguridad se concibe desde la arquitectura, no como una capa añadida al final.",
      "description2": "El objetivo no es trasladar complejidad técnica al ganadero, sino ofrecer una herramienta sencilla cuya base tecnológica protege el dato, garantiza la fiabilidad del sistema y permite una integración IoT responsable.",
      "cta": "Conocer nuestra tecnología",
      "proofPoints": [
        { "title": "Seguridad desde el diseño",   "description": "Gestión de accesos, trazabilidad y protección del dato presentes en la arquitectura de la plataforma" },
        { "title": "Integración IoT responsable", "description": "Conexión modular de dispositivos evitando dependencias de un único fabricante" },
        { "title": "Experiencia de Ewala",        "description": "Empresa tecnológica especializada en ciberseguridad, desarrollo seguro e innovación aplicada" }
      ]
    },

    "testimonial": {
      "sectionLabel": "CONFIANZA DEL SECTOR",
      "quote": "[PENDIENTE DE VALIDACIÓN] — Pendiente de cita real de cliente/cooperativa. No inventar.",
      "authorInitials": "—",
      "authorName": "[PENDIENTE DE VALIDACIÓN]",
      "authorRole": "[PENDIENTE DE VALIDACIÓN]",
      "badges": ["Seguridad by design", "Trazabilidad", "Integración IoT modular", "Desarrollado por Ewala"]
    },

    "finalCta": {
      "headline": "Digitaliza tu explotación con confianza",
      "description": "Moderniza la gestión de tu ganadería extensiva de forma sencilla, práctica y segura, con el respaldo de una empresa especializada en ciberseguridad.",
      "ctaPrimary": "Solicitar demo",
      "ctaSecondary": "Conocer LIVET",
      "checks": ["Sin compromiso", "Adaptado al entorno rural", "Seguridad desde el diseño"]
    }
  }
}
```

### 5.3. Limpieza de namespaces ya migrados

Una vez el contenido vive en `products.*`, **elimina** de `es.json` (y `en.json`) los namespaces
globales que han quedado duplicados: `hero`, `metrics`, `bento`, `sectors`, `innovation`,
`testimonials`, `finalCta`. **Conserva**: `meta`, `nav`, `logoCarousel`, `partners`, `footer`,
`mobileCta`.

Además, corrige textos globales que aún arrastran el posicionamiento viejo:

- `nav.products_list`: la entrada de LIVET dice "Monitorización no invasiva para animales en zonas
  rurales" → cámbiala a algo como `"Gestión de ganadería extensiva con seguridad by design"`.
- `meta.description`: menciona "monitorización no invasiva de mayores" → reescríbela sin mayores
  (Sentry ciberseguridad OT/IoT + LIVET gestión ganadera segura).
- `finalCta` global y `footer.tagline`: si mencionan "personas vulnerables"/"atención social",
  reescríbelos en clave ganadería/industria.

### 5.4. Replica TODO en `en.json`

Repite **exactamente la misma estructura** en `messages/en.json`, con el texto en inglés. Mantén
los `[PENDIENTE DE VALIDACIÓN]` tal cual (son marcadores, no se traducen).

### 5.5. Tipos (`i18n/types.ts`)

No hay que cambiar el mecanismo (`Messages = typeof esMessages`). Solo **añade helpers** al final
para usarlos cómodamente en los componentes:

```ts
import type esMessages from '../messages/es.json'
export type Messages = typeof esMessages

// Helpers para esta tarea:
export type ProductId = 'sentryn3t' | 'livet'
export type ProductLanding = Messages['products']['sentryn3t']
```

> Nota: `ProductLanding` usa la forma de `sentryn3t` como tipo canónico. Por eso **la forma de
> `livet` debe ser idéntica** (mismas claves), o TypeScript se quejará al pasar `livet` donde se
> espera `ProductLanding`.

### ✅ Verificación del Paso 1

1. `pnpm lint` no muestra errores nuevos.
2. En tu editor, abre `i18n/types.ts` y comprueba que `ProductLanding` resuelve sin error.
3. Abre `es.json` y `en.json` y verifica visualmente que `products.sentryn3t` y `products.livet`
   tienen **exactamente las mismas claves**.
4. Busca en el proyecto la cadena `mayores` y `agua/luz` → no debe quedar ninguna en `messages/`.

> ⚠️ Tras este paso, **el proyecto NO compilará del todo** hasta terminar el Paso 3, porque los
> componentes aún leen los namespaces viejos (`dict.hero`, etc.) que ya no existen. Es esperado.
> Si necesitas mantener el build verde entre pasos, haz Paso 1→3 en una sola rama/commit.

---

## 6. PASO 2 — Config de producto (`lib/products.ts`) y la variable `--brand`

### 6.1. Crea `lib/products.ts`

```ts
import { Shield, RadioTower } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProductId } from '@/i18n/types'

export interface ProductConfig {
  id: ProductId
  icon: LucideIcon
  /** Valor que se inyecta en la variable CSS --brand */
  accent: string
  /** Color del texto/iconos que van SOBRE el acento (--brand-foreground) */
  accentForeground: string
  /** Clases Tailwind para el estado activo del trigger del tab */
  activeTabClass: string
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'sentryn3t',
    icon: Shield,
    accent: '#00e58d',           // verde corporativo
    accentForeground: '#020617', // slate-950 (texto oscuro sobre verde)
    activeTabClass:
      'data-[state=active]:bg-[#00e58d] data-[state=active]:text-slate-950 data-[state=active]:shadow-lg',
  },
  {
    id: 'livet',
    icon: RadioTower,            // icono validado para LIVET (ganadería/IoT)
    accent: '#14b8a6',           // teal-500
    accentForeground: '#ffffff', // texto blanco sobre teal
    activeTabClass:
      'data-[state=active]:bg-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg',
  },
]

export const DEFAULT_PRODUCT: ProductId = 'sentryn3t'

export function getProduct(id: ProductId): ProductConfig {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0]
}
```

### 6.2. Cómo se usa la variable `--brand`

`ProductLanding` (Paso 4) pondrá en el contenedor raíz de cada producto:

```tsx
<div
  data-product={id}
  style={{ '--brand': cfg.accent, '--brand-foreground': cfg.accentForeground } as React.CSSProperties}
>
  ...
</div>
```

Y dentro de las secciones, sustituirás el verde fijo por la variable. **Tabla de reemplazos**
(esto es lo que harás repetidamente en el Paso 3):

| Antes (hardcodeado) | Después (variable) |
|---|---|
| `text-[#00e58d]` | `text-[var(--brand)]` |
| `bg-[#00e58d]` | `bg-[var(--brand)]` |
| `border-[#00e58d]` | `border-[var(--brand)]` |
| `text-slate-950` (sobre botón verde) | `text-[var(--brand-foreground)]` |
| `bg-[#00e58d]/10` (verde con alpha) | `bg-[color-mix(in_oklab,var(--brand)_10%,transparent)]` |
| `border-[#00e58d]/20` | `border-[color-mix(in_oklab,var(--brand)_20%,transparent)]` |
| `shadow-[#00e58d]/25` | `shadow-[color-mix(in_oklab,var(--brand)_25%,transparent)]` |
| `rgba(5,227,145,0.12)` (gradiente) | `color-mix(in_oklab,var(--brand)_12%,transparent)` |

> **Importante sobre las alphas:** Tailwind v4 acepta valores arbitrarios entre corchetes, pero **no
> puedes** escribir `bg-[var(--brand)]/10` (la sintaxis de opacidad con `/` no funciona sobre una
> variable arbitraria). Usa **`color-mix`** como en la tabla. Recuerda **subrayados en vez de
> espacios** dentro de los corchetes (`_` = espacio en Tailwind).

### ✅ Verificación del Paso 2

1. `lib/products.ts` compila sin errores de tipos.
2. `RadioTower` y `Shield` existen en `lucide-react` (autocompletado del editor).

---

## 7. PASO 3 — Parametrizar las 8 secciones (`components/ewala/sections/`)

Crea la carpeta `components/ewala/sections/`. Vas a **mover y adaptar** cada sección actual. El
patrón es **siempre el mismo**:

1. Renombrar/mover el archivo a `sections/product-*.tsx`.
2. Cambiar el tipo de la prop `t` a su slice del producto (ver tabla).
3. Sustituir los `#00e58d` y `rgba(5,227,145,...)` por `var(--brand)` (tabla del Paso 2).
4. Quitar cualquier lógica específica de producto que ya no aplique (sobre todo en `sectors`).

**Mapa de migración (origen → destino y tipo de la prop `t`):**

| Origen actual | Destino | Tipo de `t` |
|---|---|---|
| `hero-section.tsx` | `sections/product-hero.tsx` | `ProductLanding['hero']` |
| `metrics-strip.tsx` | `sections/product-metrics.tsx` | `ProductLanding['metrics']` |
| `product-showcase.tsx` | `sections/product-showcase.tsx` | `ProductLanding['showcase']` |
| `bento-capabilities.tsx` | `sections/product-capabilities.tsx` | `ProductLanding['capabilities']` |
| `sectors-section.tsx` | `sections/product-sectors.tsx` | `ProductLanding['sectors']` |
| `innovation-section.tsx` | `sections/product-innovation.tsx` | `ProductLanding['innovation']` |
| `testimonial-section.tsx` | `sections/product-testimonial.tsx` | `ProductLanding['testimonial']` |
| `final-cta.tsx` | `sections/product-final-cta.tsx` | `ProductLanding['finalCta']` |

> Todas las secciones siguen siendo **Server Components** (sin `"use client"`). Reciben su texto por
> props; **no** usan `useTranslations`.

### 7.1. Ejemplo completo: `product-metrics.tsx` (la más sencilla)

Antes (`metrics-strip.tsx`) leía `Messages["metrics"]`. Ahora:

```tsx
import type { ProductLanding } from '@/i18n/types'

interface ProductMetricsProps {
  t: ProductLanding['metrics']
}

export function ProductMetrics({ t }: ProductMetricsProps) {
  const items = t.items as Array<{ value: string; label: string }>

  return (
    <section className="bg-slate-900 border-y border-white/[0.06] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 items-center">
          {items.map((metric, i) => (
            <div
              key={metric.label}
              className={`flex flex-col items-center text-center ${
                i < items.length - 1 ? 'lg:border-r lg:border-white/10' : ''
              }`}
            >
              <span className="text-5xl font-bold text-white font-mono">{metric.value}</span>
              <span className="text-sm text-slate-500 mt-2 max-w-[120px] leading-snug text-center">
                {metric.label}
              </span>
            </div>
          ))}
        </div>
        <div className="text-center mt-8 pt-8 border-t border-white/[0.06]">
          <p className="text-sm text-slate-500 italic max-w-2xl mx-auto">{t.quote}</p>
        </div>
      </div>
    </section>
  )
}
```

Esta sección no tenía verde, así que el único cambio es el tipo de `t` y el nombre. Úsala como
plantilla mental para las demás.

### 7.2. `product-sectors.tsx` — OJO, aquí hay que QUITAR lógica

La versión actual mezcla Sentry y LIVET con un flag `isLivet` y dos badges. **Eso desaparece**:
ahora cada producto trae *sus* sectores y el badge es único (el nombre del producto). El color del
badge sale de `var(--brand)`.

```tsx
import { Factory, Zap, Leaf, Shield, Settings, Database, ArrowRight } from 'lucide-react'
import type { ProductLanding } from '@/i18n/types'

interface ProductSectorsProps {
  t: ProductLanding['sectors']
  badge: string // nombre corto del producto, p.ej. "SentryN3t" o "LIVET"
}

type SectorItem = { name: string; problem: string }

// Iconos/gradientes fijos por posición (no van en JSON). 6 entradas = 6 sectores.
const SECTOR_VISUAL = [
  { icon: Factory,  gradient: 'from-slate-800 to-slate-900' },
  { icon: Zap,      gradient: 'from-slate-800 to-blue-950' },
  { icon: Leaf,     gradient: 'from-slate-800 to-green-950' },
  { icon: Shield,   gradient: 'from-slate-800 to-indigo-950' },
  { icon: Settings, gradient: 'from-slate-800 to-slate-700' },
  { icon: Database, gradient: 'from-slate-800 to-emerald-950' },
]

export function ProductSectors({ t, badge }: ProductSectorsProps) {
  const items = (t.items as SectorItem[]).map((item, i) => ({ ...item, ...SECTOR_VISUAL[i] }))

  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white font-mono">{t.headline}</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mt-4">{t.subheadline}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((sector) => (
            <div
              key={sector.name}
              className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-[color-mix(in_oklab,var(--brand)_30%,transparent)] transition-all duration-200 group"
            >
              <div className={`h-32 bg-gradient-to-br ${sector.gradient} relative overflow-hidden flex items-center justify-center`}>
                <sector.icon className="w-12 h-12 text-white/30" />
              </div>
              <div className="p-5">
                <span className="text-xs uppercase tracking-wider text-[var(--brand)]">{badge}</span>
                <h3 className="text-white text-lg font-semibold mt-1">{sector.name}</h3>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed line-clamp-2">{sector.problem}</p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--brand)]"
                >
                  {t.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 7.3. `product-hero.tsx` — `<h1>` condicional + variant de dashboard

El Hero es la sección que decide el `<h1>`. Recibe una prop extra `active`:

- Si `active === true` → el titular es `<h1>` (heading principal real de la página).
- Si `active === false` → el titular degrada a `<p>` con las mismas clases visuales (para que el
  panel oculto no aporte un segundo `<h1>` al DOM). Como el panel inactivo además lleva `hidden` +
  `aria-hidden` + `inert` (lo pone `ProductExperience`), esto es doble seguridad para SEO/a11y.

```tsx
interface ProductHeroProps {
  t: ProductLanding['hero']
  active: boolean
}

export function ProductHero({ t, active }: ProductHeroProps) {
  const stats = t.stats as Array<{ value: string; label: string }>
  const parts = t.headlineParts as string[]
  const Heading = active ? 'h1' : 'p'

  return (
    <section className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Fondo: gradiente con var(--brand) */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--brand) 12%, transparent), transparent 70%)' }}
      />
      {/* ...grid de fondo igual que ahora... */}

      {/* ...resto del layout de dos columnas... */}
      <Heading className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight font-mono">
        <span className="text-white">{parts[0]}</span>
        <br />
        <span className="text-white">{parts[1]}</span>
        <br />
        <span className="text-[var(--brand)]">{parts[2]}</span>
      </Heading>
      {/* ...CTAs (bg-[var(--brand)] text-[var(--brand-foreground)]), stats, y <DashboardMockup t={t.dashboard} />... */}
    </section>
  )
}
```

El `DashboardMockup` actual está cableado a Sentry (tráfico de red, anomalías). Conviértelo para que
lea **todas** sus etiquetas de `t.dashboard` (ya las tienes en el JSON, tanto para Sentry como para
LIVET) y usa `var(--brand)` en los acentos. Así el mismo mockup muestra "Tráfico de red" en Sentry y
"Actividad de la explotación" en LIVET sin ramificar el JSX. (Si más adelante quieres un mockup
visualmente distinto para LIVET, ese sería un `variant`, pero para esta primera versión basta con
cambiar etiquetas + color.)

### 7.4. `product-showcase.tsx` y `product-innovation.tsx` — patrón `variant`

Ambas secciones tienen layout distinto por producto. Resuélvelo con un `variant` que viene del JSON
(`showcase.variant` = `"bento"` | `"flow"`; `innovation.variant` = `"terminal"` | `"panel"`):

```tsx
export function ProductShowcase({ t }: { t: ProductLanding['showcase'] }) {
  return (
    <section className="bg-slate-950 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* cabecera común (eyebrow, headline, description) con var(--brand) */}
        {t.variant === 'bento' ? <ShowcaseBento t={t} /> : <ShowcaseFlow t={t} />}
      </div>
    </section>
  )
}
```

- `ShowcaseBento`: reaprovecha el bloque "Left text + Right bento grid" del actual
  `SentryN3tContent` (líneas del `product-showcase.tsx` original), con `var(--brand)`.
- `ShowcaseFlow`: reaprovecha el diagrama del actual `LivetContent`, **pero reemplazando el
  contenido de mayores** (agua/luz/puerta → fuentes de datos de la explotación: p.ej. animales,
  lotes, sensores IoT) y los estados Normal/Riesgo por algo coherente con ganadería. El texto sale
  del JSON; el diagrama es decorativo.
- Igual para `innovation`: `variant: "terminal"` mantiene el `TerminalDisplay` de Sentry;
  `variant: "panel"` muestra un panel sobrio para LIVET (sin terminal hacker; algo más institucional).

> El `TerminalDisplay` de Sentry tiene strings técnicos hardcodeados (modelos ML, IPs...). Para esta
> tarea puedes **dejarlos como decoración visual** (no es copy de marketing), pero NO lo uses para
> LIVET. LIVET usa el `variant: "panel"`.

### 7.5. Resto de secciones

`product-capabilities.tsx` (antes `bento-capabilities`), `product-testimonial.tsx`,
`product-final-cta.tsx`: aplica el patrón estándar (tipo de `t` + reemplazo de verde). No tienen
lógica especial.

### ✅ Verificación del Paso 3

1. Las 8 secciones están en `components/ewala/sections/` y exportan con named export.
2. Busca `#00e58d` en `components/ewala/sections/` → **0 resultados**.
3. Busca `rgba(5,227,145` en `sections/` → **0 resultados** (todo migrado a `color-mix`/`var`).
4. Ninguna sección importa `useTranslations` ni tiene `"use client"`.

---

## 8. PASO 4 — `ProductLanding`, `FloatingProductTabs`, `ProductExperience` y recableado

### 8.1. `components/ewala/product-landing.tsx` (Server Component)

```tsx
import type { ReactNode } from 'react'
import type { ProductId, ProductLanding as LandingContent } from '@/i18n/types'
import { getProduct } from '@/lib/products'
import { ProductHero } from './sections/product-hero'
import { ProductMetrics } from './sections/product-metrics'
import { ProductShowcase } from './sections/product-showcase'
import { ProductCapabilities } from './sections/product-capabilities'
import { ProductSectors } from './sections/product-sectors'
import { ProductInnovation } from './sections/product-innovation'
import { ProductTestimonial } from './sections/product-testimonial'
import { ProductFinalCta } from './sections/product-final-cta'

interface ProductLandingProps {
  id: ProductId
  content: LandingContent
  active: boolean
}

export function ProductLanding({ id, content, active }: ProductLandingProps) {
  const cfg = getProduct(id)
  return (
    <div
      data-product={id}
      style={{ '--brand': cfg.accent, '--brand-foreground': cfg.accentForeground } as React.CSSProperties}
    >
      <ProductHero t={content.hero} active={active} />
      <ProductMetrics t={content.metrics} />
      <ProductShowcase t={content.showcase} />
      <ProductCapabilities t={content.capabilities} />
      <ProductSectors t={content.sectors} badge={content.label} />
      <ProductInnovation t={content.innovation} />
      <ProductTestimonial t={content.testimonial} />
      <ProductFinalCta t={content.finalCta} />
    </div>
  )
}
```

### 8.2. `components/ewala/floating-product-tabs.tsx` (isla cliente)

```tsx
'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { PRODUCTS } from '@/lib/products'

interface FloatingProductTabsProps {
  ui: { tab_sentryn3t: string; tab_livet: string; aria_label: string }
}

export function FloatingProductTabs({ ui }: FloatingProductTabsProps) {
  const labels: Record<string, string> = {
    sentryn3t: ui.tab_sentryn3t,
    livet: ui.tab_livet,
  }

  return (
    <div className="sticky top-16 z-40 bg-slate-950/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-center">
        <Tabs.List
          aria-label={ui.aria_label}
          className="grid grid-cols-2 w-full sm:inline-flex sm:w-auto bg-slate-900 border border-white/10 rounded-2xl p-1.5 gap-1"
        >
          {PRODUCTS.map((p) => (
            <Tabs.Trigger
              key={p.id}
              value={p.id}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all font-mono text-slate-400 hover:text-white ${p.activeTabClass}`}
            >
              <p.icon className="w-4 h-4" />
              {labels[p.id]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>
    </div>
  )
}
```

> `top-16` = 64px, alto aproximado del header. Si ajustas el header, ajusta este valor (o centraliza
> con una variable CSS `--header-h` en `globals.css` y usa `top-[var(--header-h)]`).

### 8.3. `components/ewala/product-experience.tsx` (isla cliente — el corazón)

Es el **único** componente que conoce los tabs y el hash. Recibe los dos `ProductLanding` ya
renderizados como `slots`.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import type { ProductId } from '@/i18n/types'
import { PRODUCTS, DEFAULT_PRODUCT } from '@/lib/products'
import { FloatingProductTabs } from './floating-product-tabs'

interface ProductExperienceProps {
  slots: Record<ProductId, ReactNode>
  ui: { tab_sentryn3t: string; tab_livet: string; aria_label: string }
}

const VALID: ProductId[] = PRODUCTS.map((p) => p.id)

export function ProductExperience({ slots, ui }: ProductExperienceProps) {
  const [product, setProduct] = useState<ProductId>(DEFAULT_PRODUCT)
  const topRef = useRef<HTMLDivElement>(null)

  // 1) Al montar, lee el hash (#sentryn3t / #livet) y ajusta el tab.
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '') as ProductId
    if (VALID.includes(fromHash)) setProduct(fromHash)
  }, [])

  // 2) Reacciona a cambios de hash (botón atrás/adelante, enlaces internos).
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '') as ProductId
      if (VALID.includes(h)) setProduct(h)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const handleChange = (value: string) => {
    const next = value as ProductId
    setProduct(next)
    // Actualiza el hash sin recargar ni saltar de scroll bruscamente.
    history.replaceState(null, '', `#${next}`)
    // Lleva al usuario al inicio de la experiencia (cambia toda la narrativa).
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={topRef}>
      <Tabs.Root value={product} onValueChange={handleChange}>
        <FloatingProductTabs ui={ui} />
        {PRODUCTS.map((p) => {
          const isActive = p.id === product
          return (
            <Tabs.Content
              key={p.id}
              value={p.id}
              forceMount
              // El panel inactivo: oculto visualmente y para lectores de pantalla.
              hidden={!isActive}
              aria-hidden={!isActive}
              // @ts-expect-error: `inert` es válido en HTML; algunos typings de React aún no lo incluyen.
              inert={!isActive ? '' : undefined}
              className="motion-safe:transition-opacity motion-safe:duration-300 data-[state=active]:opacity-100 data-[state=inactive]:opacity-0"
            >
              {slots[p.id]}
            </Tabs.Content>
          )
        })}
      </Tabs.Root>
    </div>
  )
}
```

**Sobre la animación (criterio del cliente):** priorizamos SEO/a11y sobre el efecto. Como el panel
inactivo está `hidden`, **no hay cross-fade con solape**; lo que se ve es un **fade-in simple** del
panel que entra. Es intencional y correcto. No intentes animar ambos a la vez.

> `forceMount` + `hidden` mantiene ambas landings en el HTML (bueno para SEO) pero solo muestra una.
> Radix marca el panel activo con `data-state="active"` y el otro con `"inactive"`; combinamos eso
> con `hidden`/`aria-hidden`/`inert` para que el inactivo sea totalmente inerte (no enfocable, no
> leído por lectores de pantalla, no clicable).

### 8.4. Recablear `app/[locale]/page.tsx`

```tsx
import { getDictionary } from '@/i18n/config'
import type { Locale } from '@/i18n/config'
import { Header } from '@/components/ewala/header'
import { ProductExperience } from '@/components/ewala/product-experience'
import { ProductLanding } from '@/components/ewala/product-landing'
import { PartnersSection } from '@/components/ewala/partners-section'
import { LogoCarousel } from '@/components/ewala/logo-carousel'
import { Footer } from '@/components/ewala/footer'
import { MobileStickyCta } from '@/components/ewala/mobile-sticky-cta'
import { DEFAULT_PRODUCT } from '@/lib/products'

export default async function LocalePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const dict = await getDictionary(locale)

  // Renderizamos AMBAS landings (Server Components) y las pasamos como slots.
  const slots = {
    sentryn3t: (
      <ProductLanding id="sentryn3t" content={dict.products.sentryn3t} active={DEFAULT_PRODUCT === 'sentryn3t'} />
    ),
    livet: (
      <ProductLanding id="livet" content={dict.products.livet} active={DEFAULT_PRODUCT === 'livet'} />
    ),
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <Header locale={locale} />
      <ProductExperience slots={slots} ui={dict.products.ui} />
      <PartnersSection t={dict.partners} />
      <LogoCarousel t={dict.logoCarousel} />
      <Footer />
      <MobileStickyCta />
    </main>
  )
}
```

> **Sobre `active` y el `<h1>`:** aquí marcamos como `active` el producto por defecto
> (`sentryn3t`). Eso fija el único `<h1>` real en el HTML estático. El cambio de tab en cliente NO
> reescribe el `<h1>` (mantenemos el del producto por defecto como heading canónico de la página),
> lo cual es correcto para SEO. El panel del otro producto, al ir `hidden`, no introduce un segundo
> `<h1>` competidor porque su Hero renderiza `<p>` (ver Paso 7.3).

### 8.5. `app/[locale]/layout.tsx`

El `I18nProvider` pasa al cliente solo los namespaces que usan las islas cliente. Tras este refactor,
las secciones ya **no** usan `useTranslations` (reciben props), así que **`products` ya no necesita
viajar al cliente** por esa vía. Pero `FloatingProductTabs` necesita `products.ui` — y se lo pasamos
por props desde `page.tsx`, no por el provider. Revisa `clientMessages`:

```tsx
const clientMessages = {
  nav: dict.nav,
  footer: dict.footer,
  mobileCta: dict.mobileCta,
  // 'announcement' lo dejamos fuera por ahora (componente huérfano).
  // 'products' ya NO hace falta en el cliente (las islas reciben props).
}
```

> Si al quitar `products` del provider algo deja de funcionar, es que quedó alguna isla leyendo
> `useTranslations('products')`. Búscala y cámbiala a props.

### 8.6. Retoques en `header.tsx` y `mobile-sticky-cta.tsx`

- **Header:** hoy todo su acento es verde. Para que conviva con LIVET (teal) sin parecer "dos
  diseños pegados", deja el header **neutro** (slate/blanco) y conserva el color solo en el CTA. En
  la práctica: cambia los `#00e58d` decorativos del header por `text-white`/`text-slate-300` y deja
  el botón CTA como está (o conviértelo en verde corporativo fijo, ya que es el color de marca).
  Corrige también la descripción de LIVET en `nav.products_list` (ganadería).
- **MobileStickyCta:** debería reflejar el producto activo. La forma simple y sin estado global: que
  lea el hash en un `useEffect` + `hashchange` (igual que `ProductExperience`) y aplique
  `var(--brand)`… pero como vive fuera de `ProductLanding`, no hereda la variable. Opción pragmática
  para esta primera versión: mantenerlo en **verde corporativo** fijo (es el color de marca) y dejar
  el coloreado por producto como mejora futura. Decídelo con el responsable si hay dudas.

### ✅ Verificación del Paso 4

1. `pnpm lint` sin errores.
2. `pnpm dev` arranca; abre `http://localhost:3000/es`.
3. Se ve la landing de SentryN3t (verde) con el selector sticky bajo el header.
4. Al pulsar "LIVET", cambia toda la página a contenido de ganadería con acento teal, y la URL pasa
   a `…/es#livet`.
5. Recarga con `…/es#livet` en la URL → debe abrir directamente en LIVET.
6. Botón "atrás" del navegador alterna el producto.

---

## 9. PASO 5 — Ajustes finales y pulido

1. **Offset sticky:** verifica que el selector queda justo bajo el header sin solaparse ni dejar
   hueco, en scroll y sin scroll (el header cambia de alto al hacer scroll). Si baila, centraliza
   `--header-h` en `globals.css` y úsalo en `top-[var(--header-h)]`.
2. **`prefers-reduced-motion`:** las transiciones usan `motion-safe:`; comprueba que con "reducir
   movimiento" activado en el SO no hay animación.
3. **Responsive:** en móvil el selector es full-width (`grid grid-cols-2`). Comprueba a 360px de
   ancho. El dashboard del Hero sigue `hidden lg:block`.
4. **Foco/teclado:** con Tab puedes navegar los triggers; flechas ←/→ cambian de tab (Radix lo da
   gratis). El panel oculto no debe ser alcanzable con Tab (lo garantiza `inert`).
5. **Build de producción:** `pnpm build` debe generar `out/es/index.html` y `out/en/index.html` sin
   errores. Abre el HTML y confirma que **el contenido de ambos productos está presente** (SEO) y
   que **solo hay un `<h1>`**.

---

## 10. Checklist final (todo debe estar ✅ antes de dar por terminado)

- [ ] `pnpm lint` sin errores.
- [ ] `pnpm build` genera `out/` sin errores (export estático intacto).
- [ ] `es.json` y `en.json` tienen la misma estructura; `products.sentryn3t` y `products.livet`
      comparten claves.
- [ ] No queda contenido de "mayores / agua-luz-puerta / cuidado asistencial" en `messages/` ni en
      componentes.
- [ ] Campos sin datos reales de LIVET marcados con `[PENDIENTE DE VALIDACIÓN]` (no inventados).
- [ ] `grep "#00e58d"` en `components/ewala/sections/` y `product-landing.tsx` → 0 resultados.
- [ ] Solo un `<h1>` en el HTML renderizado de cada locale.
- [ ] El panel inactivo está `hidden` + `aria-hidden` + `inert`.
- [ ] Tab ↔ hash funciona (carga directa, cambio, atrás/adelante).
- [ ] Selector sticky correcto en desktop y full-width en móvil.
- [ ] `ProductLanding` no importa nada de tabs/hash (sigue siendo reutilizable para rutas futuras).
- [ ] `components/ui/*` y `announcement-bar.tsx` intactos.

---

## 11. Errores comunes (y cómo evitarlos)

- **"Aparecen claves crudas en pantalla" (p. ej. se ve `hero.description`)** → la estructura de
  `en.json` no coincide con `es.json`, o el componente lee una clave que no existe. Revisa la ruta
  exacta de la clave.
- **"Property 'X' does not exist on type ..."** → `livet` y `sentryn3t` no tienen las mismas claves.
  Recuerda: `ProductLanding = typeof ...sentryn3t`, así que LIVET debe calcar la forma.
- **El verde con alpha no se aplica** → escribiste `bg-[var(--brand)]/10`. No funciona. Usa
  `bg-[color-mix(in_oklab,var(--brand)_10%,transparent)]` y subrayados en vez de espacios.
- **El color no cambia entre productos** → olvidaste poner `style={{ '--brand': ... }}` en
  `ProductLanding`, o pusiste el estilo en un ancestro que no envuelve la sección.
- **Error de build por `useSearchParams`** → no lo uses. Tab ↔ hash con `window.location.hash`.
- **Doble `<h1>`** → el Hero del producto inactivo está renderizando `<h1>`. Asegúrate de pasar
  `active={false}` y de que el Hero use el componente `Heading` condicional.
- **El panel oculto sigue siendo enfocable con Tab** → falta `inert` (o el navegador es antiguo);
  `hidden` por sí solo a veces no basta con `forceMount`. Mantén los tres: `hidden`, `aria-hidden`,
  `inert`.
- **Rompe el sticky al hacer scroll** → el header cambia de altura; ajusta `top-16` o centraliza
  `--header-h`.

---

## 12. Glosario rápido

- **Server Component:** se renderiza en build, genera HTML, no manda JS. Por defecto en este repo.
- **Isla cliente:** componente con `"use client"`; puede tener estado/eventos. Aquí solo:
  `Header`, `Footer`, `MobileStickyCta`, `ProductExperience`, `FloatingProductTabs`.
- **Slot:** un Server Component ya renderizado que pasamos como prop (`ReactNode`) a una isla cliente.
- **`var(--brand)`:** color de acento del producto activo, inyectado por `ProductLanding`.
- **`variant`:** campo en el JSON que selecciona qué disposición visual usa una sección
  (`bento`/`flow`, `terminal`/`panel`).
- **Hash:** la parte de la URL tras `#` (`#sentryn3t`). Es client-side puro y no rompe el export.

---

*Fin de la guía. Implementa en el orden 1 → 5, pasando la verificación de cada paso. Ante cualquier
campo de LIVET sin fuente, usa `[PENDIENTE DE VALIDACIÓN]` y consúltalo; no inventes datos.*
