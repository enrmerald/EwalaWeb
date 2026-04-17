# Plan de mejora — Sitio web principal Ewala IT Services

> **Ámbito:** Este plan aplica exclusivamente al **sitio web estático principal** (HTML en la raíz del repo). **No afecta al blog Hugo** ubicado en `/build/`.

## Propósito

Este directorio contiene el plan detallado para modernizar el sitio web principal de Ewala IT Services. El objetivo es doble:

1. **Mejorar la mantenibilidad del código** mediante modularización, eliminación de duplicados y adopción de un sistema de plantillas ligero.
2. **Mejorar el posicionamiento SEO/SEM** mediante metadatos estructurados, datos enriquecidos (Schema.org), accesibilidad y rendimiento.

El plan está diseñado para ser implementado **paso a paso**, sin romper la web en producción y **sin introducir un proceso de build complejo** (el sitio debe seguir siendo estático y desplegable en Netlify sin pipelines adicionales).

## Estructura de la documentación

| Documento | Contenido |
|-----------|-----------|
| [01-analisis-actual.md](01-analisis-actual.md) | Diagnóstico del estado actual: inventario de páginas, duplicación de código, estado SEO, assets y performance. |
| [02-plan-modularizacion.md](02-plan-modularizacion.md) | Estrategia de modularización: sistema de partials HTML, organización de CSS/JS, eliminación de duplicados. |
| [03-plan-seo-sem.md](03-plan-seo-sem.md) | Plan SEO/SEM: Schema.org, metadatos, accesibilidad, rendimiento, sitemap. |
| [04-roadmap-implementacion.md](04-roadmap-implementacion.md) | Hoja de ruta ordenada por fases, con tareas accionables y criterios de aceptación. |
| [05-convenciones.md](05-convenciones.md) | Convenciones de código, nomenclatura y estilo a seguir durante y después del refactor. |

## Cómo usar este plan

1. **Leer primero** [01-analisis-actual.md](01-analisis-actual.md) para entender el punto de partida.
2. **Revisar** los planes 02 y 03 para entender la dirección técnica.
3. **Ejecutar** las fases del [04-roadmap-implementacion.md](04-roadmap-implementacion.md) en orden. Cada fase es autocontenida y desplegable.
4. **Consultar** [05-convenciones.md](05-convenciones.md) al editar o crear archivos nuevos.

## Principios rectores

- **Zero-build, zero-regression**: el sitio debe seguir funcionando como HTML estático puro. Ninguna mejora debe introducir dependencias de build obligatorias en la raíz (Hugo solo aplica al blog).
- **Cambios incrementales y desplegables**: cada fase del roadmap produce un estado válido y publicable.
- **Mantener compatibilidad con Netlify**: no tocar `netlify.toml` salvo donde se indique explícitamente.
- **SEO sin trucos**: priorizar contenido real, metadatos honestos y datos estructurados válidos frente a técnicas agresivas.
- **Accesibilidad como ciudadanía de primera clase**: WCAG 2.1 AA como referencia mínima.

## Estado

- **Fecha de creación:** 2026-04-17
- **Autor del plan:** Equipo de desarrollo Ewala (elaborado con asistencia de Claude Code)
- **Estado:** Borrador inicial listo para revisión y aprobación.
