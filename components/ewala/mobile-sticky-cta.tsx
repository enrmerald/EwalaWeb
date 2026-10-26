"use client"

import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "@/i18n/client"

export function MobileStickyCta() {
  const t = useTranslations("mobileCta")
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-section-dark/98 backdrop-blur-sm border-t border-white/10 p-3 pb-5">
      <div className="flex gap-2">
        <a
          href="#"
          className="flex-1 bg-[var(--primary)] text-on-light rounded-lg py-3.5 text-sm font-semibold flex items-center justify-center gap-1"
        >
          {t("text")}
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="#"
          className="flex-1 border border-white/20 text-white rounded-lg py-3.5 text-sm font-semibold flex items-center justify-center"
        >
          {t("platform")}
        </a>
      </div>
    </div>
  )
}
