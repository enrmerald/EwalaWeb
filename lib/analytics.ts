/**
 * Google Tag Manager. El ID no es un secreto (aparece en el HTML de cualquier web con GTM), por eso
 * va en código y no en variables de entorno.
 *
 * GA4 NO se carga desde la web: se configura DENTRO del contenedor GTM (etiqueta «Google tag»), así
 * Consent Mode y el banner de Cookiebot lo gobiernan desde un único sitio y no hay doble medición.
 *
 * ⚠️ Si cambia el contenedor, cambiar también GTM_ID en public/gtm.js (lo comprueba la verificación
 * del paso de analítica: ambos valores deben coincidir).
 */
export const GTM_ID = 'GTM-KG3ZWVWW'
