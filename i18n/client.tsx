"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Messages } from "./types"

type PartialMessages = Partial<Messages>
type Namespace = keyof Messages

const I18nContext = createContext<PartialMessages>({})

export function I18nProvider({
  messages,
  children,
}: {
  locale: string
  messages: PartialMessages
  children: ReactNode
}) {
  return (
    <I18nContext.Provider value={messages}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslations<N extends Namespace>(namespace: N) {
  const messages = useContext(I18nContext)
  const ns = (messages[namespace] ?? {}) as Record<string, unknown>

  function t(key: string): string {
    const val = ns[key]
    return typeof val === "string" ? val : key
  }

  t.raw = function raw(key: string): unknown {
    return ns[key]
  }

  return t
}
