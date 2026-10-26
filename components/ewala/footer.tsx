"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Accordion from "@radix-ui/react-accordion"
import { Linkedin, Github, ChevronDown, ArrowUpRight, FileText } from "lucide-react"
import { useTranslations } from "@/i18n/client"
import { GA_MEASUREMENT_ID, OPEN_EVENT } from "@/lib/consent"
import { SOCIAL_LINKS } from "@/lib/site"

// `action: "cookie-settings"` = botón que reabre el panel de cookies (sin href).
type FooterLink = { label: string; href?: string; action?: "cookie-settings" }

const NAV_LINK_CLASS = "text-sm text-white/60 hover:text-white transition-colors"

const isPdf = (href: string) => /\.pdf$/i.test(href)

function SocialLinks() {
  const t = useTranslations("footer")
  const profiles = [
    { label: t("social.linkedin"), href: SOCIAL_LINKS.linkedin, Icon: Linkedin },
    { label: t("social.github"), href: SOCIAL_LINKS.github, Icon: Github },
  ]
  return (
    <>
      {profiles.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/35 transition-all"
          aria-label={`${label} (${t("opensNewTab")})`}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </a>
      ))}
    </>
  )
}

// Enlaces externos (https://…) y PDFs se abren en pestaña nueva; el resto usa next/link.
function FooterNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const t = useTranslations("footer")
  if (isPdf(href)) {
    // Los nombres de los PDFs institucionales llevan espacios y tildes: se codifican aquí.
    return (
      <a
        href={encodeURI(href)}
        target="_blank"
        rel="noopener"
        className={`${NAV_LINK_CLASS} inline-flex items-start gap-1.5`}
      >
        <FileText aria-hidden="true" className="h-3.5 w-3.5 mt-[3px] shrink-0 opacity-50" />
        <span>
          {children} <span className="text-[10px] font-mono text-white/40">{t("pdfTag")}</span>
          <span className="sr-only"> ({t("opensNewTab")})</span>
        </span>
      </a>
    )
  }
  if (/^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        {children}
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 opacity-50" />
      </a>
    )
  }
  return (
    <Link href={href} className={NAV_LINK_CLASS}>
      {children}
    </Link>
  )
}

function CookieSettingsButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`${NAV_LINK_CLASS} text-left`}
    >
      {children}
    </button>
  )
}

export function Footer() {
  const t = useTranslations("footer")
  // Sin ID de GA4 no hay banner ni cookies de analítica: el enlace «Preferencias de cookies» no tiene nada que abrir.
  const sections = (t.raw("sections") as Array<{ title: string; links: FooterLink[] }>).map((section) => ({
    ...section,
    links: section.links.filter((link) => link.action !== "cookie-settings" || GA_MEASUREMENT_ID),
  }))
  const badges = t.raw("badges") as string[]
  const pathname = usePathname()
  const locale = pathname.split("/")[1] || "es"

  function resolveHref(href: string) {
    if (!href.startsWith("/")) return href // externos
    if (isPdf(href)) return href // PDFs institucionales: viven en la raíz, sin prefijo de idioma
    if (href === "/") return `/${locale}`
    if (href.startsWith("/#")) return `/${locale}${href.slice(1)}` // ancla de la home → /es#showcase
    return `/${locale}${href}`
  }

  return (
    <footer className="bg-section-black pt-16 pb-8 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-7 gap-8 pb-12 border-b border-white/[0.06]">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <Image
                src="/logo_ewala_blanco.png"
                alt="Ewala"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <p className="text-sm text-white/65 max-w-xs leading-relaxed text-justify hyphens-auto">
              {t("tagline")}
            </p>

            <div className="flex gap-3 mt-5">
              <SocialLinks />
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs uppercase tracking-widest text-white/50 mb-4 font-mono">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.action === "cookie-settings" ? (
                      <CookieSettingsButton>{link.label}</CookieSettingsButton>
                    ) : (
                      <FooterNavLink href={resolveHref(link.href ?? "/")}>{link.label}</FooterNavLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Top Section - Mobile (Accordion) */}
        <div className="lg:hidden pb-8 border-b border-white/[0.06]">
          <div className="mb-8">
            <div className="mb-4">
              <Image
                src="/logo_ewala_blanco.png"
                alt="Ewala"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
            <p className="text-sm text-white/65 leading-relaxed">
              {t("tagline")}
            </p>

            <div className="flex gap-3 mt-4">
              <SocialLinks />
            </div>
          </div>

          <Accordion.Root type="single" collapsible className="space-y-0">
            {sections.map((section) => (
              <Accordion.Item
                key={section.title}
                value={section.title}
                className="border-t border-white/10"
              >
                <Accordion.Trigger className="flex items-center justify-between w-full py-4 text-white text-sm font-medium group font-mono">
                  {section.title}
                  <ChevronDown className="w-4 h-4 text-white/50 transition-transform group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
                <Accordion.Content className="pb-4">
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        {link.action === "cookie-settings" ? (
                          <CookieSettingsButton>{link.label}</CookieSettingsButton>
                        ) : (
                          <FooterNavLink href={resolveHref(link.href ?? "/")}>{link.label}</FooterNavLink>
                        )}
                      </li>
                    ))}
                  </ul>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8">
          <span className="text-xs text-white/55 text-center sm:text-left">
            {t("copyright")}
          </span>
          <div className="flex gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="text-xs text-white/55 bg-white/[0.06] border border-white/[0.1] rounded px-2 py-1"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
