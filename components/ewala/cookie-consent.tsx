"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import Script from "next/script"
import { useTranslations } from "@/i18n/client"
import {
  CONSENT_EVENT,
  OPEN_EVENT,
  enableAnalytics,
  parseConsent,
  readConsent,
  readRawConsent,
  revokeAnalytics,
  writeConsent,
} from "@/lib/consent"

interface CookieConsentProps {
  gaId: string
  locale: string
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CONSENT_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CONSENT_EVENT, onChange)
  }
}

// Instantánea del servidor y de la hidratación: aún no se ha leído el almacenamiento, no se pinta nada.
const SERVER_SNAPSHOT = "ssr"

const ACTION_BUTTON =
  "rounded-xl px-5 py-3 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-section-dark"
// «Aceptar todas» y «Rechazar todas» comparten estilo y tamaño: rechazar debe ser tan fácil como aceptar.
const EQUAL_BUTTON = `${ACTION_BUTTON} bg-[var(--primary)] text-on-light hover:brightness-110`
const SECONDARY_BUTTON = `${ACTION_BUTTON} border border-white/25 text-white hover:bg-white/[0.08]`

/**
 * Banner de consentimiento + carga condicionada de GA4. Se monta solo si hay ID de medición.
 * - Sin elección válida: banner con Aceptar todas / Rechazar todas / Configurar. Seguir navegando,
 *   desplazarse o cerrar con Esc NO es consentimiento (no se guarda nada y GA4 no se carga).
 * - `gtag.js` solo se inyecta cuando `analytics === true`.
 * - Se puede reabrir desde el footer (evento `OPEN_EVENT`) para cambiar o retirar la elección.
 */
export function CookieConsent({ gaId, locale }: CookieConsentProps) {
  const t = useTranslations("cookieBanner")
  const raw = useSyncExternalStore(subscribe, readRawConsent, () => SERVER_SNAPSHOT)
  const ready = raw !== SERVER_SNAPSHOT
  const consent = ready ? parseConsent(raw) : null

  const [panelOpen, setPanelOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [draftAnalytics, setDraftAnalytics] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const visible = ready && (panelOpen || (consent === null && !dismissed))

  const openPanel = useCallback(() => {
    setDraftAnalytics(readConsent()?.analytics ?? false)
    setPanelOpen(true)
  }, [])

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, openPanel)
    return () => window.removeEventListener(OPEN_EVENT, openPanel)
  }, [openPanel])

  // Foco al diálogo al abrirlo (teclado y lectores de pantalla). No es modal: no atrapa el foco.
  useEffect(() => {
    if (visible) dialogRef.current?.focus({ preventScroll: true })
  }, [visible, panelOpen])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (panelOpen) setPanelOpen(false)
      else setDismissed(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible, panelOpen])

  const decide = (analytics: boolean) => {
    if (analytics) enableAnalytics()
    else revokeAnalytics()
    writeConsent(analytics)
    setPanelOpen(false)
    setDismissed(false)
  }

  return (
    <>
      {consent?.analytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      )}

      {visible && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-desc"
            className="mx-auto max-h-[85vh] max-w-4xl overflow-y-auto rounded-2xl border border-white/15 bg-section-dark p-5 shadow-2xl shadow-black/60 focus:outline-none sm:p-6"
          >
            {panelOpen ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h2 id="cookie-consent-title" className="font-mono text-base font-semibold text-white">
                    {t("panelTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
                  >
                    {t("close")}
                  </button>
                </div>
                <p id="cookie-consent-desc" className="mt-2 text-sm leading-relaxed text-white/70">
                  {t("description")}{" "}
                  <Link href={`/${locale}/cookies`} className="text-[var(--primary)] underline underline-offset-2">
                    {t("policyLink")}
                  </Link>
                </p>

                <div className="mt-5 space-y-3">
                  <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-[var(--primary)]" />
                    <span>
                      <span className="block font-mono text-sm font-semibold text-white">{t("necessaryLabel")}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/65">{t("necessaryDesc")}</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={draftAnalytics}
                      onChange={(event) => setDraftAnalytics(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="block font-mono text-sm font-semibold text-white">{t("analyticsLabel")}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/65">{t("analyticsDesc")}</span>
                    </span>
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => decide(draftAnalytics)} className={EQUAL_BUTTON}>
                    {t("save")}
                  </button>
                  <button type="button" onClick={() => decide(false)} className={SECONDARY_BUTTON}>
                    {t("rejectAll")}
                  </button>
                  <button type="button" onClick={() => decide(true)} className={SECONDARY_BUTTON}>
                    {t("acceptAll")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="cookie-consent-title" className="font-mono text-base font-semibold text-white">
                  {t("title")}
                </h2>
                <p id="cookie-consent-desc" className="mt-2 text-sm leading-relaxed text-white/70">
                  {t("description")}{" "}
                  <Link href={`/${locale}/cookies`} className="text-[var(--primary)] underline underline-offset-2">
                    {t("policyLink")}
                  </Link>
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => decide(true)} className={EQUAL_BUTTON}>
                    {t("acceptAll")}
                  </button>
                  <button type="button" onClick={() => decide(false)} className={EQUAL_BUTTON}>
                    {t("rejectAll")}
                  </button>
                  <button type="button" onClick={openPanel} className={SECONDARY_BUTTON}>
                    {t("configure")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
