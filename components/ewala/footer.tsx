"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Accordion from "@radix-ui/react-accordion"
import { Linkedin, Github, ChevronDown, ArrowUpRight } from "lucide-react"
import { useTranslations } from "@/i18n/client"
import { GA_MEASUREMENT_ID, OPEN_EVENT } from "@/lib/consent"

const SOCIAL_ICONS = [Linkedin, Github]

// `action: "cookie-settings"` = botón que reabre el panel de cookies (sin href).
type FooterLink = { label: string; href?: string; action?: "cookie-settings" }

const NAV_LINK_CLASS = "text-sm text-white/60 hover:text-white transition-colors"

// Enlaces externos (https://…) se abren en pestaña nueva; el resto usa next/link.
function FooterNavLink({ href, children }: { href: string; children: React.ReactNode }) {
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
    if (!href.startsWith("/")) return href // externos y "#"
    if (href === "/") return `/${locale}`
    if (href.startsWith("/#")) return `/${locale}${href.slice(1)}` // ancla de la home → /es#showcase
    return `/${locale}${href}`
  }

  return (
    <footer className="bg-section-black pt-16 pb-8 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-10 pb-12 border-b border-white/[0.06]">
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
              {[t("social.linkedin"), t("social.github")].map(
                (label, i) => {
                  const Icon = SOCIAL_ICONS[i]
                  return (
                    <a
                      key={label}
                      href="#"
                      className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/35 transition-all"
                      aria-label={label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  )
                }
              )}
            </div>

            <div className="mt-6">
              <label className="text-xs text-white/55 mb-2 block">
                {t("newsletter_label")}
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t("newsletter_placeholder")}
                  className="bg-white/[0.06] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 flex-1 focus:border-[var(--primary)] focus:outline-none transition-colors"
                />
                <button className="bg-[var(--primary)] text-on-light text-sm px-4 py-2.5 rounded-lg font-semibold hover:brightness-105 transition-all">
                  {t("newsletter_cta")}
                </button>
              </div>
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
                      <FooterNavLink href={resolveHref(link.href ?? "#")}>{link.label}</FooterNavLink>
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
              {[t("social.linkedin"), t("social.github")].map(
                (label, i) => {
                  const Icon = SOCIAL_ICONS[i]
                  return (
                    <a
                      key={label}
                      href="#"
                      className="w-9 h-9 rounded-lg bg-white/[0.07] border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/35 transition-all"
                      aria-label={label}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  )
                }
              )}
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
                          <FooterNavLink href={resolveHref(link.href ?? "#")}>{link.label}</FooterNavLink>
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
