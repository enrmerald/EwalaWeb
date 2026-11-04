/**
 * Interruptores de funcionalidad por variable de entorno pública (se incrustan en build: el export
 * estático no tiene servidor). Un único punto de lectura: los componentes importan la constante,
 * nunca leen `process.env` por su cuenta.
 */

/**
 * Demo y PoC aún no activas. Por defecto OCULTO: solo el valor exacto `true` lo muestra, así un
 * olvido en el despliegue nunca publica un botón de algo que todavía no existe. Gobierna:
 *  - «Solicitar demo» del navbar (escritorio y menú móvil), «Solicita una demo» del hero y el
 *    botón principal del CTA final (que pasa a «Contáctanos»);
 *  - los botones «Descargar cómo funciona una PoC» (showcase y CTA final), que hoy apuntan a `#`.
 * El selector del formulario de contacto NO depende de este interruptor: solo ofrece «Más información sobre
 * SentryN3t» y «Otra consulta» (lib/contact.ts → NEED_VALUES).
 */
export const SHOW_DEMO_CTA = process.env.NEXT_PUBLIC_SHOW_DEMO_CTA === 'true'
