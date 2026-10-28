"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import * as NavigationMenu from "@radix-ui/react-navigation-menu"
import * as Dialog from "@radix-ui/react-dialog"
import * as Accordion from "@radix-ui/react-accordion"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  Menu,
  X,
  Shield,
  RadioTower,
  Users,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react"
import { useTranslations } from "@/i18n/client"
import type { Locale } from "@/i18n/config"
import { SHOW_DEMO_CTA } from "@/lib/features"

type IconComponent = React.ComponentType<{ className?: string }>

// Logo de producto (no icono de línea): ignora el tamaño de los iconos Lucide y se pinta algo mayor
function SentryN3tIcon(_: { className?: string }) {
  return <Image src="/sentrynet-icon.svg" alt="" aria-hidden="true" width={54} height={54} className="h-5 w-5" />
}

interface HeaderProps {
  locale: Locale
}

interface ProductItem {
  name: string
  description: string
  /** Etiqueta corta junto al nombre (p. ej. «NDR»); `badgeTitle` es su texto al pasar el ratón. */
  badge?: string
  badgeTitle?: string
  icon: IconComponent
  href: string
  external?: boolean
}

function EwalaLogo({ light }: { light?: boolean }) {
  return (
    <Image
      src={light ? "/logo_ewala_blanco.png" : "/logo_ewala_negro.png"}
      alt="Ewala"
      width={120}
      height={40}
      className="h-10 w-auto"
      priority
    />
  )
}

function DesktopNavTrigger({
  children,
  scrolled,
}: {
  children: React.ReactNode
  scrolled: boolean
}) {
  return (
    <NavigationMenu.Trigger
      className={[
        "group inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
        scrolled
          ? "text-on-light-muted hover:bg-black/[0.04] hover:text-on-light"
          : "text-white/70 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      {children}
      <ChevronDown
        className={[
          "h-4 w-4 transition-all duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[var(--primary)]",
          scrolled
            ? "text-on-light-subtle group-hover:text-[var(--primary)]"
            : "text-white/40 group-hover:text-[var(--primary)]",
        ].join(" ")}
      />
    </NavigationMenu.Trigger>
  )
}

function DesktopSimpleLink({
  href,
  children,
  scrolled,
}: {
  href: string
  children: React.ReactNode
  scrolled: boolean
}) {
  return (
    <NavigationMenu.Link
      href={href}
      className={[
        "inline-flex rounded-xl px-4 py-2 text-sm font-mono transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
        scrolled
          ? "text-on-light-muted hover:bg-black/[0.04] hover:text-on-light"
          : "text-white/70 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      {children}
    </NavigationMenu.Link>
  )
}

type NavigateHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void

function ProductMenuItem({
  product,
  dark = false,
  onNavigate,
}: {
  product: ProductItem
  dark?: boolean
  /** Solo el menú móvil la usa: cierra el Dialog y gestiona las anclas de la propia página. */
  onNavigate?: NavigateHandler
}) {
  return (
    <a
      href={product.href}
      onClick={onNavigate}
      {...(product.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={[
        "group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
        dark
          ? "hover:border-white/10 hover:bg-white/[0.05]"
          : "hover:border-black/10 hover:bg-black/[0.03]",
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/10 transition-all duration-200 group-hover:border-[var(--primary)]/35 group-hover:bg-[var(--primary)]/15">
        <product.icon className="h-4 w-4 text-[var(--primary)]" />
      </div>

      <div className="min-w-0">
        <div
          className={[
            "flex items-center gap-2 font-mono text-sm font-medium transition-colors duration-200 group-hover:text-[var(--primary)]",
            dark ? "text-white" : "text-on-light",
          ].join(" ")}
        >
          {product.name}
          {product.badge && (
            <abbr
              title={product.badgeTitle}
              className="rounded bg-[var(--primary)] px-1.5 py-0.5 text-[11px] font-bold leading-none tracking-wider text-slate-950 no-underline"
            >
              {product.badge}
            </abbr>
          )}
          {product.external && <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 opacity-50" />}
        </div>
        <p
          className={[
            "mt-1 line-clamp-2 text-xs leading-5",
            dark ? "text-white/50" : "text-on-light-subtle",
          ].join(" ")}
        >
          {product.description}
        </p>
      </div>
    </a>
  )
}

interface SectorItem {
  name: string
  description: string
}

function SectorMenuItem({
  sector,
  href,
  dark = false,
  onNavigate,
}: {
  sector: SectorItem
  href: string
  dark?: boolean
  onNavigate?: NavigateHandler
}) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className={[
        "group flex flex-col gap-0.5 rounded-lg border border-transparent px-3 py-2.5 font-mono text-sm transition-all duration-200 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
        dark
          ? "text-white/70 hover:border-white/10 hover:bg-white/[0.05]"
          : "text-on-light-muted hover:border-black/10 hover:bg-black/[0.03]",
      ].join(" ")}
    >
      <span className="group-hover:text-[var(--primary)] transition-colors duration-200">{sector.name}</span>
      <span
        className={[
          "text-xs font-sans leading-snug",
          dark ? "text-white/45" : "text-on-light-subtle",
        ].join(" ")}
      >
        {sector.description}
      </span>
    </a>
  )
}

function DropdownSurface({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <NavigationMenu.Content
      className={[
        "absolute left-0 top-full mt-3 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl shadow-black/10 backdrop-blur-xl",
        "data-[motion=from-start]:animate-in data-[motion=from-start]:fade-in data-[motion=from-start]:slide-in-from-left-2",
        "data-[motion=from-end]:animate-in data-[motion=from-end]:fade-in data-[motion=from-end]:slide-in-from-right-2",
        "data-[motion=to-start]:animate-out data-[motion=to-start]:fade-out data-[motion=to-start]:slide-out-to-left-2",
        "data-[motion=to-end]:animate-out data-[motion=to-end]:fade-out data-[motion=to-end]:slide-out-to-right-2",
        "duration-200",
        className,
      ].join(" ")}
    >
      {children}
    </NavigationMenu.Content>
  )
}

function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={[
        "mb-2 px-3 font-mono text-[11px] uppercase tracking-[0.22em]",
        dark ? "text-white/40" : "text-on-light-subtle",
      ].join(" ")}
    >
      {children}
    </div>
  )
}

export function Header({ locale }: HeaderProps) {
  const t = useTranslations("nav")
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // El botón de la hamburguesa no es un Dialog.Trigger (el Dialog es controlado), así que Radix no sabe
  // a dónde devolver el foco al cerrar: se hace a mano en onCloseAutoFocus.
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const productsList = t.raw("products_list") as Array<{
    name: string
    description: string
    badge?: string
    badgeTitle?: string
    /** `true` oculta la opción del menú sin borrarla de messages/*.json. */
    hidden?: boolean
  }>
  const sectorsList = t.raw("sectors_list") as SectorItem[]
  const mobileNavItems = t.raw("mobile_items") as Array<{
    name: string
    hasDropdown: boolean
  }>

  // Mapeo posicional con messages/*.json → nav.products_list (mismo orden).
  // SentryN3t es el único producto con landing real hoy. LIVET vive en una SPA independiente aún en
  // construcción (ver _livet-spa/README.md) y está oculto con `hidden: true`; si se vuelve a mostrar,
  // su enlace lleva a Contacto (el formulario ya no tiene opción LIVET). MSSP lo presta SecNorth Labs (web externa).
  const PRODUCT_CONFIG: Array<Pick<ProductItem, "icon" | "href" | "external">> = [
    { icon: SentryN3tIcon, href: `/${locale}/#showcase` },
    { icon: RadioTower, href: `/${locale}/contacto/` },
    { icon: Users, href: "https://secnorthlabs.eu/", external: true },
  ]

  const products: ProductItem[] = productsList
    .map(({ hidden, ...product }, index) => ({
      ...product,
      hidden,
      ...(PRODUCT_CONFIG[index] ?? { icon: Shield, href: `/${locale}/#showcase` }),
    }))
    .filter((product) => !product.hidden)
  const SECTOR_HREF = `/${locale}/#sectors`
  // Orden fijo de messages/*.json → nav.mobile_items: Soluciones, Sectores, Compañía, Blog, Contacto.
  const MOBILE_SIMPLE_HREFS = [
    `/${locale}/#showcase`,
    SECTOR_HREF,
    `/${locale}/compania/`,
    `/${locale}/blog/`,
    `/${locale}/contacto/`,
  ]

  const altLocale: Locale = locale === "es" ? "en" : "es"

  // Menú móvil: siempre cierra el Dialog. Si el destino es un ancla de la página actual (/es/#showcase
  // estando en /es/) el navegador solo cambia el hash y Radix mantiene el bloqueo de scroll del <body>
  // mientras el Dialog siga montado, así que se desplaza a mano cuando ya se ha desmontado. Otras rutas
  // y enlaces externos conservan su comportamiento nativo.
  function handleMobileNavigate(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    setMobileMenuOpen(false)

    const hashIndex = href.indexOf("#")
    if (hashIndex === -1 || window.location.pathname !== href.slice(0, hashIndex)) return

    event.preventDefault()
    const id = href.slice(hashIndex + 1)
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // Dos frames: el primero desmonta el Dialog y el segundo ya encuentra el <body> sin bloqueo.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
        window.history.pushState(null, "", href)
      }),
    )
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={[
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-black/10 bg-white/95 py-3 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent py-5",
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/`}
            aria-label="Ewala"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
          >
            <EwalaLogo light={!isScrolled} />
          </Link>

          <NavigationMenu.Root aria-label={t("mainNavigation")} className="relative hidden lg:block">
            <NavigationMenu.List className="flex items-center gap-1">
              <NavigationMenu.Item>
                <DesktopNavTrigger scrolled={isScrolled}>{t("solutions")}</DesktopNavTrigger>

                <DropdownSurface className="w-[440px]">
                  <SectionLabel>{t("solutions")}</SectionLabel>

                  <div className="space-y-1">
                    {products.map((product) => (
                      <ProductMenuItem key={product.name} product={product} />
                    ))}
                  </div>
                </DropdownSurface>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <DesktopNavTrigger scrolled={isScrolled}>{t("sectors")}</DesktopNavTrigger>

                <DropdownSurface className="w-[360px]">
                  <SectionLabel>{t("sectors")}</SectionLabel>

                  <div className="space-y-1">
                    {sectorsList.map((sector) => (
                      <SectorMenuItem key={sector.name} sector={sector} href={SECTOR_HREF} />
                    ))}
                  </div>
                </DropdownSurface>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <DesktopSimpleLink href={`/${locale}/compania/`} scrolled={isScrolled}>
                  {t("company")}
                </DesktopSimpleLink>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <DesktopSimpleLink href={`/${locale}/blog/`} scrolled={isScrolled}>
                  {t("blog")}
                </DesktopSimpleLink>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <DesktopSimpleLink href={`/${locale}/contacto/`} scrolled={isScrolled}>
                  {t("contact")}
                </DesktopSimpleLink>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu.Root>

          <div className="flex items-center gap-3">
            <Link
              href={`/${altLocale}/`}
              className={[
                "hidden rounded-lg border px-2.5 py-1.5 font-mono text-xs uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 lg:inline-flex",
                isScrolled
                  ? "border-black/10 text-on-light-subtle hover:border-black/20 hover:bg-black/[0.04] hover:text-on-light"
                  : "border-white/20 text-white/60 hover:border-white/30 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
            >
              {altLocale}
            </Link>

            {SHOW_DEMO_CTA && (
              <Link
                href={`/${locale}/contacto/`}
                className="hidden rounded-xl bg-[var(--primary)] px-5 py-2.5 font-mono text-sm font-semibold text-on-light shadow-lg shadow-[var(--primary)]/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-[var(--primary)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.99] lg:inline-flex"
              >
                {t("cta")}
              </Link>
            )}

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={[
                "rounded-xl border p-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 lg:hidden",
                isScrolled
                  ? "border-black/10 bg-black/[0.03] text-on-light hover:border-black/20 hover:bg-black/[0.06]"
                  : "border-white/20 bg-white/[0.06] text-white hover:border-white/30 hover:bg-white/[0.1]",
              ].join(" ")}
              aria-label={t("openMenu")}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />

          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              menuButtonRef.current?.focus({ preventScroll: true })
            }}
            className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-sm overflow-y-auto border-l border-white/[0.08] bg-section-dark shadow-2xl shadow-black/50 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
            <VisuallyHidden.Root>
              <Dialog.Title>{t("mobileMenuTitle")}</Dialog.Title>
            </VisuallyHidden.Root>

            <VisuallyHidden.Root>
              <Dialog.Description>{t("mobileMenuDescription")}</Dialog.Description>
            </VisuallyHidden.Root>

            <div className="p-6">
              <div className="mb-8 flex items-center justify-between">
                <Link
                  href={`/${locale}/`}
                  aria-label="Ewala"
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <EwalaLogo light />
                </Link>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-xl border border-white/15 bg-white/[0.06] p-2 text-white/70 transition-all duration-200 hover:border-white/25 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                    aria-label={t("closeMenu")}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </Dialog.Close>
              </div>

              <Accordion.Root type="single" collapsible className="space-y-2">
                {mobileNavItems.map((item, index) => (
                  <Accordion.Item
                    key={item.name}
                    value={item.name}
                    className="border-b border-white/[0.08]"
                  >
                    {item.hasDropdown ? (
                      <>
                        <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left font-mono text-lg font-medium text-white/80 transition-colors duration-200 hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40">
                          {item.name}
                          <ChevronDown className="h-5 w-5 text-white/40 transition-all duration-200 group-hover:text-[var(--primary)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-[var(--primary)]" />
                        </Accordion.Trigger>

                        <Accordion.Content className="overflow-hidden pb-4 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-1 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-1">
                          {index === 0 && (
                            <div className="space-y-1">
                              <SectionLabel dark>{t("products")}</SectionLabel>

                              {products.map((product) => (
                                <ProductMenuItem
                                  key={product.name}
                                  product={product}
                                  dark
                                  onNavigate={(event) => handleMobileNavigate(event, product.href)}
                                />
                              ))}
                            </div>
                          )}

                          {index === 1 && (
                            <div className="space-y-1">
                              {sectorsList.map((sector) => (
                                <SectorMenuItem
                                  key={sector.name}
                                  sector={sector}
                                  href={SECTOR_HREF}
                                  dark
                                  onNavigate={(event) => handleMobileNavigate(event, SECTOR_HREF)}
                                />
                              ))}
                            </div>
                          )}
                        </Accordion.Content>
                      </>
                    ) : (
                      <a
                        href={MOBILE_SIMPLE_HREFS[index] ?? `/${locale}/`}
                        className="block py-4 font-mono text-lg font-medium text-white/80 transition-colors duration-200 hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                        onClick={(event) => handleMobileNavigate(event, MOBILE_SIMPLE_HREFS[index] ?? `/${locale}/`)}
                      >
                        {item.name}
                      </a>
                    )}
                  </Accordion.Item>
                ))}
              </Accordion.Root>

              <div className="mt-8 space-y-3 border-t border-white/[0.08] pt-8">
                {SHOW_DEMO_CTA && (
                  <Link
                    href={`/${locale}/contacto/`}
                    className="block w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-center font-mono font-semibold text-on-light shadow-lg shadow-[var(--primary)]/15 transition-all duration-200 hover:shadow-[var(--primary)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50 active:scale-[0.99]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("cta")}
                  </Link>
                )}

                <Link
                  href={`/${altLocale}/`}
                  className="block w-full rounded-xl border border-white/15 px-6 py-3 text-center font-mono text-sm uppercase text-white/60 transition-all duration-200 hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {altLocale}
                </Link>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  )
}
