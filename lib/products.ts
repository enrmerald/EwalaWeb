import { Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProductId } from '@/i18n/types'

export interface ProductConfig {
  id: ProductId
  icon: LucideIcon
  accent: string
  accentForeground: string
  activeTabClass: string
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'sentryn3t',
    icon: Shield,
    accent: '#00e58d',
    accentForeground: '#020617',
    activeTabClass:
      'data-[state=active]:bg-[#00e58d] data-[state=active]:text-slate-950 data-[state=active]:shadow-lg',
  },
  // LIVET movido a _livet-spa/ — SPA independiente en construcción
]

export const DEFAULT_PRODUCT: ProductId = 'sentryn3t'

export function getProduct(id: ProductId): ProductConfig {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0]
}
