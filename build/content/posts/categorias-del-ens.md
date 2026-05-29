---
title: "Categorías del ENS: básica, media y alta explicadas de forma sencilla"
title_seo: "Categorías del ENS: básica, media y alta explicadas"
description_seo: "Descubre las categorías del ENS: básica, media y alta, cómo se determinan, qué implican y qué errores evitar al categorizar tus sistemas."
date: 2026-05-29T13:00:00.000Z
categories: ["cumplimiento"]
tags: ["ens", "compliance", "grc", "ciberseguridad-empresarial", "nis2", "iso-27001"]
developer: "Ewala"
tagewala: "Categorización ENS con enfoque práctico para empresas"
header_image: "/blog/images/IMG-0001-01-BLOG-Categorías del ENS.png"
postimage: "/blog/images/IMG-0001-01-BLOG-Categorías del ENS.png"
thumbnail: "/blog/images/IMG-0001-01-BLOG-Categorías del ENS.png"
author: "Ewala"
authorlink: "https://es.linkedin.com/company/e-wala-it-services"
subtitle: "Una guía clara para entender qué significa que un sistema sea de categoría básica, media o alta en el ENS, y por qué una mala categorización puede complicar todo el proceso de adecuación."
description: "Las categorías del ENS determinan el nivel de exigencia que debe cumplir un sistema de información. En este artículo explicamos qué son las categorías básica, media y alta, cómo se calculan, qué implican para la empresa y cómo evitar errores habituales al iniciar un proyecto de adecuación."
---

## Categorías del ENS: básica, media y alta – Guía práctica

Uno de los puntos que más dudas genera cuando una organización empieza a trabajar con el **Esquema Nacional de Seguridad (ENS)** es la categorización de sistemas.

Y es normal, porque muchas empresas piensan que el ENS se aplica a toda la organización de forma general, como si hubiera que ponerle una única etiqueta. Pero no funciona así.

El ENS no categoriza empresas. **Categoriza sistemas de información**.

Una misma organización puede tener varios sistemas con categorías distintas. Una web corporativa puede tener una exigencia menor que una plataforma SaaS utilizada por una Administración Pública, o que un sistema que gestiona información sensible de ciudadanos.

Entender esta idea es clave, porque la categoría del sistema condiciona todo lo demás: las medidas de seguridad aplicables, la documentación exigida, el tipo de evaluación de conformidad y, en muchos casos, el coste del proyecto.

Si todavía necesitas una visión general del marco, puedes consultar antes nuestro artículo sobre [qué es el ENS y por qué es obligatorio en España](https://ewala.es/blog/posts/que-es-el-ens/).

## Qué son las categorías del ENS

Las categorías del ENS son los niveles que determinan la exigencia de seguridad que debe cumplir un sistema de información.

Existen tres:

- **Categoría básica**
- **Categoría media**
- **Categoría alta**

La categoría depende del impacto que tendría un incidente de seguridad sobre el sistema.

Cuanto mayor sea el daño potencial, mayor será la categoría y más exigentes serán las medidas que habrá que implantar.

## Las cinco dimensiones de seguridad

Para determinar ese impacto, el ENS evalúa cinco dimensiones de seguridad:

- **Confidencialidad [C]**: que la información solo sea accesible para quien está autorizado.
- **Integridad [I]**: que la información no se modifique de forma indebida.
- **Disponibilidad [D]**: que los servicios y la información estén accesibles cuando se necesitan.
- **Autenticidad [A]**: que se pueda verificar la identidad de quien accede o genera información.
- **Trazabilidad [T]**: que se pueda rastrear quién hizo qué y cuándo.

Cada dimensión se valora con un nivel de impacto: **BAJO**, **MEDIO** o **ALTO**.

La categoría final del sistema viene determinada por el nivel más alto alcanzado en cualquiera de las cinco dimensiones.

| C | I | D | A | T | Categoría resultante |
|---|---|---|---|---|---|
| BAJO | BAJO | BAJO | BAJO | BAJO | BÁSICA |
| BAJO | MEDIO | BAJO | BAJO | BAJO | MEDIA |
| MEDIO | MEDIO | ALTO | MEDIO | MEDIO | ALTA |
| BAJO | BAJO | ALTO | BAJO | MEDIO | ALTA |

Basta con que una sola dimensión alcance nivel **ALTO** para que el sistema sea de categoría alta.

Un error frecuente es centrarse en la confidencialidad y olvidar que la disponibilidad puede elevar la categoría por sí sola: si un sistema deja de estar operativo y eso genera un impacto grave, ya es categoría alta.

## Quién determina la categoría

La categorización no es una decisión unilateral del equipo técnico.

Según el **Real Decreto 311/2022**, intervienen varios roles:

- **El responsable de la información**, que determina los requisitos de la información tratada.
- **El responsable del servicio**, que determina los requisitos de los servicios prestados.
- **El responsable de la seguridad**, que valida que la categorización resultante es coherente y supervisa las medidas que se derivan de ella.

Documentar y justificar la decisión es obligatorio.

No basta con decir que un sistema es básico, medio o alto: hay que explicar por qué, con evidencias.

La guía **CCN-STIC 803** del Centro Criptológico Nacional desarrolla en detalle los criterios de valoración.

## Categoría básica

La **categoría básica** se aplica a sistemas en los que el impacto de un incidente sería limitado y asumible.

Puede corresponder, por ejemplo, a sistemas internos con información poco sensible o servicios de bajo impacto.

### Qué implica

Un sistema de categoría básica debe contar con medidas como:

- Política de seguridad.
- Control de accesos.
- Copias de seguridad.
- Protección frente a malware.
- Registro de actividad.
- Gestión de incidentes.
- Concienciación del personal.

La categoría básica tiene menos exigencia que la media o la alta, pero no significa ausencia de control.

El sistema debe estar correctamente gestionado y se debe poder demostrar que las medidas aplicables están implantadas.

### Evaluación de conformidad

La categoría básica se acredita mediante una **Declaración de Conformidad**, basada en una autoevaluación documentada con evidencias reales, de acuerdo con el artículo 38 del **Real Decreto 311/2022**.

## Categoría media

La **categoría media** se aplica cuando un incidente podría tener un impacto relevante sobre el servicio, la información o los usuarios afectados.

Es la categoría más habitual en empresas que prestan servicios tecnológicos a Administraciones Públicas: proveedores SaaS, consultoras o entidades que gestionan información vinculada a contratos públicos.

### Qué implica

Un sistema de categoría media requiere una gestión de seguridad más estructurada.

En este nivel cobran especial importancia medidas como:

- Gestión formal de riesgos.
- Roles y responsabilidades definidos.
- Control de cambios.
- Gestión de vulnerabilidades.
- Monitorización.
- Gestión de proveedores.
- Planes de continuidad.
- Auditorías periódicas.

En esta fase, muchas empresas descubren que la parte técnica está relativamente avanzada, pero tienen carencias en gobernanza y documentación.

El ENS no es solo un proyecto de IT.

### Evaluación de conformidad

La categoría media requiere una **Certificación de Conformidad** mediante auditoría externa, de acuerdo con el artículo 38 del **Real Decreto 311/2022**.

Además, la auditoría ordinaria debe realizarse al menos cada dos años, según el artículo 31.1.

Si quieres ver el proceso completo de preparación, puedes consultar nuestro artículo sobre [cómo adaptarse al ENS paso a paso](https://ewala.es/blog/posts/como-adaptarse-al-ens-paso-a-paso/).

## Categoría alta

La **categoría alta** se reserva para sistemas en los que un incidente podría tener consecuencias graves o muy graves.

Hablamos de sistemas críticos, servicios esenciales, información de alto impacto o entornos donde una interrupción, manipulación o filtración generaría daños significativos.

### Qué implica

Un sistema de categoría alta requiere medidas robustas y una gestión muy madura de la seguridad.

Algunas capacidades especialmente relevantes son:

- Monitorización continua.
- Detección temprana.
- Protección reforzada de accesos.
- Segmentación de redes.
- Bastionado de sistemas.
- Gestión continua de vulnerabilidades.
- Capacidad de respuesta ante ataques sofisticados.

La organización debe demostrar resiliencia real, no solo la existencia de controles.

En estos entornos, soluciones como **SIEM**, **EDR**, **XDR** o servicios de **SOC** pueden ser relevantes para reforzar la vigilancia, la trazabilidad y la respuesta ante incidentes.

Puedes profundizar en estas capacidades en nuestros artículos sobre [qué es un SOC en ciberseguridad](https://ewala.es/blog/posts/que-es-un-soc-en-ciberseguridad/) y [SIEM y SOAR: qué son y para qué sirven](https://ewala.es/blog/posts/que-es-un-siem-y-para-que-sirve-y-un-soar/).

### Evaluación de conformidad

Al igual que en categoría media, la categoría alta requiere **Certificación de Conformidad** mediante auditoría externa.

La diferencia está en la profundidad de las medidas exigidas y en la necesidad de demostrar eficacia operativa.

## Errores habituales al categorizar

### Categorizar la empresa en lugar del sistema

Una empresa no “es ENS media”.

La categoría se asigna a cada sistema de información de forma independiente.

Una misma organización puede tener varios sistemas con categorías distintas.

### Infravalorar la disponibilidad

Muchas organizaciones se centran en la confidencialidad y olvidan que la disponibilidad puede elevar la categoría por sí sola.

Si un sistema deja de estar disponible y eso genera un impacto grave, ya puede ser categoría alta.

### No documentar la decisión

Sin justificación registrada, cualquier auditoría puede cuestionar la categorización.

Hay que explicar qué dimensiones se han valorado, qué nivel se ha asignado a cada una y por qué.

### No revisar la categoría cuando cambia el sistema

Si el sistema incorpora nuevos datos, nuevos usuarios, nuevas integraciones o nuevas funcionalidades, su categoría puede verse afectada.

La categorización no se hace una vez y se olvida.

## Cómo encaja con ISO 27001 y NIS2

Las categorías del ENS determinan el nivel de protección de un sistema concreto.

Este concepto no tiene equivalente directo en otros marcos.

**ISO 27001** no categoriza sistemas por niveles. Trabaja con análisis de riesgos y una Declaración de Aplicabilidad donde se seleccionan controles según el contexto de la organización.

**NIS2** distingue entre entidades esenciales e importantes, pero esta clasificación se basa en el sector y tamaño de la entidad, no en el impacto sobre dimensiones de seguridad de un sistema específico.

El enfoque más eficiente suele ser buscar puntos comunes entre marcos, reutilizar evidencias y construir un modelo de cumplimiento integrado.

Si quieres profundizar en esta comparativa, puedes leer nuestro artículo sobre [ENS vs ISO 27001: diferencias, requisitos y cuál elegir](https://ewala.es/blog/posts/ens-vs-iso-27001-diferencias/).

Si estás empezando desde cero, también puede ayudarte nuestra [guía del ENS: cuándo es obligatorio y cómo adaptarse](https://ewala.es/blog/posts/ens-cuando-es-obligatorio-y-como-adaptarse/).

## Cómo empezar

Antes de decidir si un sistema es básico, medio o alto, responde a estas preguntas:

- ¿Qué servicio presta el sistema y a quién?
- ¿Está vinculado a una Administración Pública?
- ¿Qué información trata y qué nivel de sensibilidad tiene?
- ¿Qué ocurriría si el sistema deja de estar disponible?
- ¿Qué pasaría si los datos se modifican indebidamente?
- ¿Qué impacto tendría una filtración de información?
- ¿Qué requisitos aparecen en el contrato o pliego?

Con estas respuestas, la categorización será mucho más realista y evitarás errores desde el inicio.

## Preguntas frecuentes sobre las categorías del ENS

### ¿Qué categorías existen en el ENS?

Existen tres categorías: **básica, media y alta**.

Se determinan evaluando el impacto potencial de un incidente en las cinco dimensiones de seguridad: confidencialidad, integridad, disponibilidad, autenticidad y trazabilidad.

### ¿La categoría se aplica a toda la empresa?

No.

Se aplica a sistemas de información concretos. Una misma empresa puede tener sistemas con distintas categorías.

### ¿Un sistema básico necesita medidas de seguridad?

Sí.

La categoría básica tiene menos exigencia, pero sigue requiriendo medidas organizativas, técnicas y operativas.

### ¿La categoría determina si necesito declaración o certificación?

Sí.

La categoría básica se acredita mediante **Declaración de Conformidad**.

Las categorías media y alta requieren **Certificación de Conformidad** mediante auditoría externa.

### ¿Puedo cambiar la categoría con el tiempo?

Sí, y deberías revisarla si el sistema evoluciona.

Un cambio en los datos tratados, los servicios prestados o las integraciones puede alterar la categorización.

## ¿No tienes claro qué categoría le corresponde a tu sistema?

Es uno de los errores más comunes: categorizar mal desde el principio implica implantar medidas incorrectas, invertir mal los recursos y exponerse a problemas en auditoría.

En **Ewala** ayudamos a las organizaciones a identificar qué sistemas están afectados por el ENS, determinar la categoría correcta y definir una hoja de ruta realista.

Nuestro enfoque combina consultoría GRC, ciberseguridad técnica y visión de negocio.

Si tu empresa trabaja con la Administración Pública, participa en licitaciones o necesita saber qué categoría ENS aplica a sus sistemas, descubre nuestro servicio de [GRC: Gobernanza, Riesgo y Cumplimiento](https://ewala.es/grc-gobernanza-riesgo-cumplimiento).