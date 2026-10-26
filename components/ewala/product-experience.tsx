'use client'

import type { ReactNode } from 'react'
import type { ProductId } from '@/i18n/types'
import { PRODUCTS } from '@/lib/products'

interface ProductExperienceProps {
  slots: Record<ProductId, ReactNode>
  ui: {
    aria_label: string
  }
}

export function ProductExperience({ slots }: ProductExperienceProps) {
  const product = PRODUCTS[0].id
  return <div>{slots[product]}</div>
}
