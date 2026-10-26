/*
 * Cargador de Google Tag Manager para ewala.es (fichero estático: /gtm.js).
 *
 * Por qué un fichero y no un <script> en línea: Next.js no vuelve a ejecutar los scripts en línea
 * al navegar entre páginas y la CSP es más fácil de mantener con un origen 'self'.
 *
 * Orden (importa):
 *   1. Consent Mode v2 con TODO denegado por defecto: hasta que el usuario acepte en el banner
 *      (Cookiebot), Google no puede usar cookies de analítica ni de publicidad.
 *   2. Carga del contenedor GTM.
 *
 * Cuando se instale Cookiebot mediante su plantilla de GTM (disparador «Consent Initialization»),
 * la plantilla actualizará el consentimiento con la elección del usuario. Si esa plantilla también
 * define valores por defecto, deben ser los mismos que estos (todo denegado).
 *
 * ⚠️ GTM_ID debe coincidir con lib/analytics.ts.
 */
;(function (window, document) {
  var GTM_ID = 'GTM-KG3ZWVWW'

  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = window.gtag || gtag

  // 1) Consentimiento por defecto (RGPD/LSSI: nada no esencial sin consentimiento previo).
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
  })
  gtag('set', 'ads_data_redaction', true)
  gtag('set', 'url_passthrough', false)

  // 2) Contenedor GTM (fragmento oficial de Google, sin parámetros de entorno).
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
  var script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID
  var first = document.getElementsByTagName('script')[0]
  if (first && first.parentNode) {
    first.parentNode.insertBefore(script, first)
  } else {
    ;(document.head || document.documentElement).appendChild(script)
  }
})(window, document)
