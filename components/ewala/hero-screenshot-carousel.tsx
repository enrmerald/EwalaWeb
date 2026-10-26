'use client'

import * as React from 'react'
import Image from 'next/image'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, Maximize2, Pause, Play, X } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import type { ProductLanding } from '@/i18n/types'
import { cn } from '@/lib/utils'

type Texts = ProductLanding['hero']['carousel']
type Slide = { src: string; hd: string; alt: string; caption: string; position: string }
type Variant = 'inline' | 'lightbox'

interface HeroScreenshotCarouselProps {
  t: Texts
}

const AUTOPLAY_MS = 5000

const ROUND_BUTTON =
  'rounded-full bg-slate-950/60 backdrop-blur border border-white/10 text-white/80 inline-flex items-center justify-center transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

interface ScreenshotSliderProps {
  t: Texts
  variant: Variant
  /** Slide que debe mostrarse; si cambia desde fuera, el slider salta a ella sin animación. */
  index: number
  onIndexChange: (index: number) => void
  /** Pausa externa (p. ej. el carrusel del hero mientras la vista ampliada está abierta). */
  suspended?: boolean
  onExpand?: (index: number) => void
}

/**
 * Slider de capturas compartido por el hero y la vista ampliada, con los mismos controles en
 * ambos. El autoplay lo marca la animación CSS de la barra de progreso: al terminar
 * (`onAnimationEnd`) avanza la slide. Pausar = `animation-play-state: paused`, así al reanudar
 * continúa donde iba.
 */
function ScreenshotSlider({ t, variant, index, onIndexChange, suspended = false, onExpand }: ScreenshotSliderProps) {
  const slides = t.slides as Slide[]
  const total = slides.length
  const isLightbox = variant === 'lightbox'
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [selected, setSelected] = React.useState(index)
  const [userPaused, setUserPaused] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const reducedMotion = usePrefersReducedMotion()

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => {
      const i = api.selectedScrollSnap()
      setSelected(i)
      onIndexChange(i)
    }
    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api, onIndexChange])

  React.useEffect(() => {
    if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, true)
  }, [api, index])

  // Pausa si la pestaña está oculta o el slider está fuera de pantalla
  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let inView = true
    const update = () => setVisible(inView && document.visibilityState === 'visible')
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      update()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  // En la vista ampliada el foco empieza en «Cerrar», fuera del carrusel: las flechas del teclado
  // se escuchan en window. Si el carrusel ya las gestionó (foco dentro), viene `defaultPrevented`.
  React.useEffect(() => {
    if (!isLightbox || !api) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'ArrowLeft') api.scrollPrev()
      else if (e.key === 'ArrowRight') api.scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isLightbox, api])

  // Al cerrar la vista ampliada el hero no recibe mouseleave (el overlay lo tapaba) y Radix le
  // devuelve el foco: se recalcula el hover real y se descarta ese foco para no quedarse pausado.
  React.useEffect(() => {
    if (suspended) return
    setHovered(!!rootRef.current?.querySelector('[aria-roledescription="carousel"]')?.matches(':hover'))
    setFocused(false)
  }, [suspended])

  const autoplay = !reducedMotion && !userPaused
  // En el hero, hover y foco de teclado pausan (patrón WCAG). En la vista ampliada la imagen ocupa
  // casi toda la pantalla: ahí solo pausa el botón, si no el autoplay no avanzaría nunca.
  const interacting = !isLightbox && (hovered || focused)
  const running = autoplay && !suspended && !interacting && visible

  const fill = (template: string, n: number) =>
    template.replace('{n}', String(n)).replace('{total}', String(total))

  return (
    <div ref={rootRef} className={cn(isLightbox && 'flex h-full w-full flex-col')}>
      <Carousel
        setApi={setApi}
        opts={{ loop: true, duration: 28, startIndex: index }}
        aria-label={t.label}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) =>
          // El botón de ampliar recibe el foco que devuelve Radix al cerrar el diálogo: no pausa
          setFocused(!suspended && !e.target.hasAttribute('data-expand') && e.target.matches(':focus-visible'))
        }
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
        }}
        className={cn(
          'group/slider relative',
          isLightbox
            ? 'min-h-0 flex-1 [&_[data-slot=carousel-content]]:h-full'
            : 'overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950 shadow-[0_28px_90px_rgba(0,0,0,0.60),0_0_110px_color-mix(in_oklab,var(--brand)_12%,transparent)]',
        )}
      >
        {!isLightbox && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        )}

        <CarouselContent className={cn('ml-0', isLightbox && 'h-full')} aria-live={running ? 'off' : 'polite'}>
          {slides.map((slide, i) => (
            <CarouselItem key={slide.src} className={cn('pl-0', isLightbox && 'h-full')} aria-label={fill(t.slideOf, i + 1)}>
              {isLightbox ? (
                <div className="flex h-full items-center justify-center px-12 sm:px-20">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tamaño intrínseco: nunca se amplía por encima del original */}
                  <img
                    src={slide.hd}
                    alt={slide.alt}
                    loading={i === index ? 'eager' : 'lazy'}
                    draggable={false}
                    className="max-h-full max-w-full rounded-xl border border-white/10 object-contain shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onExpand?.(i)}
                  aria-label={`${t.expand}: ${slide.caption}`}
                  data-expand=""
                  className="relative block aspect-[2/1] w-full cursor-zoom-in focus-visible:outline-none"
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: slide.position }}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority={i === 0}
                    loading={i === 0 ? undefined : 'lazy'}
                    draggable={false}
                  />
                </button>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>

        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          aria-label={t.prev}
          className={cn(
            ROUND_BUTTON,
            'absolute top-1/2 z-20 -translate-y-1/2',
            isLightbox ? 'left-0 size-11 sm:left-2' : 'left-3 size-9 lg:opacity-70 lg:group-hover/slider:opacity-100',
          )}
        >
          <ChevronLeft className={isLightbox ? 'size-6' : 'size-5'} />
        </button>
        <button
          type="button"
          onClick={() => api?.scrollNext()}
          aria-label={t.next}
          className={cn(
            ROUND_BUTTON,
            'absolute top-1/2 z-20 -translate-y-1/2',
            isLightbox ? 'right-0 size-11 sm:right-2' : 'right-3 size-9 lg:opacity-70 lg:group-hover/slider:opacity-100',
          )}
        >
          <ChevronRight className={isLightbox ? 'size-6' : 'size-5'} />
        </button>

        {!isLightbox && (
          <button
            type="button"
            onClick={() => onExpand?.(selected)}
            aria-label={t.expand}
            data-expand=""
            className={cn(ROUND_BUTTON, 'absolute top-3 right-3 z-20 size-9 lg:opacity-70 lg:group-hover/slider:opacity-100')}
          >
            <Maximize2 className="size-4" />
          </button>
        )}
      </Carousel>

      {/* Pie: título de la slide activa + indicadores + pausa */}
      <div
        className={cn(
          'relative flex items-center justify-between gap-4',
          isLightbox ? 'mx-auto mt-5 w-full max-w-3xl px-12 sm:px-20' : 'mt-4',
        )}
      >
        <p className={cn('font-mono uppercase tracking-widest truncate', isLightbox ? 'text-sm text-white/75' : 'text-xs text-white/60')}>
          {isLightbox && <span className="text-[var(--brand)]">{fill('{n}/{total}', selected + 1)} · </span>}
          {slides[selected]?.caption}
        </p>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => {
              const active = i === selected
              return (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  aria-label={fill(t.goTo, i + 1)}
                  aria-current={active ? 'true' : undefined}
                  className="group/dot flex h-6 items-center px-0.5 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      'relative block h-1.5 overflow-hidden rounded-full transition-all duration-300 group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-[var(--brand)]',
                      active ? 'w-6 bg-white/20' : 'w-1.5 bg-white/25 group-hover/dot:bg-white/50',
                    )}
                  >
                    {active && (
                      <span
                        key={selected}
                        aria-hidden="true"
                        className="absolute inset-0 origin-left rounded-full bg-[var(--brand)]"
                        style={
                          autoplay
                            ? {
                                animation: `carousel-progress ${AUTOPLAY_MS}ms linear forwards`,
                                animationPlayState: running ? 'running' : 'paused',
                              }
                            : undefined
                        }
                        onAnimationEnd={() => api?.scrollNext()}
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? t.play : t.pause}
              className="size-7 rounded-full border border-white/10 text-white/60 inline-flex items-center justify-center transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
            >
              {userPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Carrusel de capturas del hero + vista ampliada (lightbox). Todas las slides del hero se
 * renderizan en build (HTML estático con sus alts), así que el contenido es indexable aunque solo
 * se vea una. La vista ampliada solo se monta al abrirla y carga las versiones `-hd`.
 */
export function HeroScreenshotCarousel({ t }: HeroScreenshotCarouselProps) {
  const [index, setIndex] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [brandVars, setBrandVars] = React.useState<React.CSSProperties>({})
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  const expand = React.useCallback((i: number) => {
    // El diálogo va en un portal, fuera del wrapper de ProductLanding que define --brand
    if (wrapperRef.current) {
      const cs = getComputedStyle(wrapperRef.current)
      setBrandVars({
        '--brand': cs.getPropertyValue('--brand'),
        '--brand-foreground': cs.getPropertyValue('--brand-foreground'),
      } as React.CSSProperties)
    }
    setIndex(i)
    setOpen(true)
  }, [])

  return (
    <>
      <div ref={wrapperRef} className="group relative">
        {/* Glow ambiental de marca */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 rounded-[2.5rem] opacity-55 blur-3xl transition-opacity duration-500 group-hover:opacity-85"
          style={{
            background:
              'radial-gradient(circle at 55% 35%, color-mix(in oklab, var(--brand) 25%, transparent), transparent 62%)',
          }}
        />
        <div className="relative">
          <ScreenshotSlider t={t} variant="inline" index={index} onIndexChange={setIndex} suspended={open} onExpand={expand} />
        </div>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm" />
          <DialogPrimitive.Content
            className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 fixed inset-0 z-[60] flex flex-col px-2 pt-16 pb-6 sm:px-6 sm:pb-8 focus:outline-none"
            style={brandVars}
          >
            <DialogPrimitive.Title className="sr-only">{t.dialogTitle}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{t.label}</DialogPrimitive.Description>

            <DialogPrimitive.Close
              aria-label={t.close}
              className={cn(ROUND_BUTTON, 'absolute top-4 right-4 z-30 size-10 sm:right-6')}
            >
              <X className="size-5" />
            </DialogPrimitive.Close>

            <ScreenshotSlider t={t} variant="lightbox" index={index} onIndexChange={setIndex} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
