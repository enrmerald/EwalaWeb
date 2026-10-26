'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/types'
import { cn } from '@/lib/utils'
import { SHOW_DEMO_CTA } from '@/lib/features'

type ContactFormMessages = Messages['contact']['form']

interface ContactFormProps {
  t: ContactFormMessages
  locale: Locale
}

const NEED_VALUES = ['demo', 'livet', 'mssp', 'compliance', 'licensing', 'other'] as const
type NeedValue = (typeof NEED_VALUES)[number]

// Mientras la demo no esté activa (lib/features.ts) no se ofrece «Demo» en el selector ni se admite ?need=demo.
const VISIBLE_NEED_VALUES = NEED_VALUES.filter((value) => value !== 'demo' || SHOW_DEMO_CTA)

const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID ?? ''

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

function buildSchema(t: ContactFormMessages) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(2, t.validation.firstNameMin)
      .max(40, t.validation.firstNameMax),
    lastName: z.string().trim().max(60, t.validation.lastNameMax).optional().or(z.literal('')),
    company: z.string().trim().min(2, t.validation.companyMin).max(80, t.validation.companyMax),
    email: z.string().trim().min(1, t.validation.emailInvalid).email(t.validation.emailInvalid),
    phone: z.string().trim().optional(),
    role: z.string().trim().optional(),
    need: z.string().min(1, t.validation.needRequired),
    message: z.string().trim().max(1000, t.validation.messageMax).optional().or(z.literal('')),
    privacy: z.boolean().refine((v) => v === true, { message: t.privacy.error }),
    marketing: z.boolean().optional(),
    // Honeypot anti-spam: debe llegar vacío. Los bots suelen rellenar todos los campos.
    company_website: z.string().max(0).optional().or(z.literal('')),
  })
}

type ContactFormValues = z.infer<ReturnType<typeof buildSchema>>

export function ContactForm({ t, locale }: ContactFormProps) {
  const schema = useMemo(() => buildSchema(t), [t])
  const [status, setStatus] = useState<SubmitStatus>('idle')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      role: '',
      need: '',
      message: '',
      privacy: false,
      marketing: false,
      company_website: '',
    },
  })

  // El export estático no soporta useSearchParams() con contenido SSR completo (obligaría a
  // renderizar el fallback de <Suspense> en el HTML exportado). Leemos el query param
  // directamente en el navegador tras montar, sin bloquear el render inicial del formulario.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const need = params.get('need')
    if (need && (VISIBLE_NEED_VALUES as readonly string[]).includes(need)) {
      setValue('need', need as NeedValue)
    }
  }, [setValue])

  const messageValue = watch('message') ?? ''

  async function onSubmit(values: ContactFormValues) {
    // Honeypot: si el campo oculto tiene contenido, es muy probablemente un bot.
    // Simulamos éxito sin enviar nada, para no dar pistas al script automatizado.
    if (values.company_website) {
      setStatus('success')
      reset()
      return
    }

    if (!FORMSPREE_FORM_ID) {
      // No hay Form ID configurado todavía: no intentamos el envío real.
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          company: values.company,
          email: values.email,
          phone: values.phone,
          role: values.role,
          need: values.need,
          message: values.message,
          marketing: values.marketing,
          locale,
        }),
      })

      if (!response.ok) throw new Error('Formspree request failed')

      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-lg bg-white/[0.06] border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[var(--primary)] focus:outline-none transition-colors disabled:opacity-50'

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-[var(--primary)]/30 bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" />
        <h3 className="text-white font-mono text-xl font-semibold">{t.success.title}</h3>
        <p className="text-white/70 mt-2 leading-relaxed">{t.success.description}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
      {!FORMSPREE_FORM_ID && (
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200/90 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{t.notConfigured}</span>
        </div>
      )}

      {/* Honeypot anti-spam: oculto para personas, visible para bots. Nunca display:none. */}
      <div className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('company_website')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="firstName" className="block text-xs text-white/55 mb-1.5">
            {t.firstName.label}
          </label>
          <input
            id="firstName"
            type="text"
            placeholder={t.firstName.placeholder}
            className={inputClass}
            {...register('firstName')}
          />
          {errors.firstName && <p className="text-xs text-red-400 mt-1.5">{errors.firstName.message}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-xs text-white/55 mb-1.5">
            {t.lastName.label}
          </label>
          <input
            id="lastName"
            type="text"
            placeholder={t.lastName.placeholder}
            className={inputClass}
            {...register('lastName')}
          />
          {errors.lastName && <p className="text-xs text-red-400 mt-1.5">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="company" className="block text-xs text-white/55 mb-1.5">
            {t.company.label}
          </label>
          <input
            id="company"
            type="text"
            placeholder={t.company.placeholder}
            className={inputClass}
            {...register('company')}
          />
          {errors.company && <p className="text-xs text-red-400 mt-1.5">{errors.company.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-white/55 mb-1.5">
            {t.email.label}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t.email.placeholder}
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="phone" className="block text-xs text-white/55 mb-1.5">
            {t.phone.label}
          </label>
          <input
            id="phone"
            type="tel"
            placeholder={t.phone.placeholder}
            className={inputClass}
            {...register('phone')}
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-xs text-white/55 mb-1.5">
            {t.role.label}
          </label>
          <input
            id="role"
            type="text"
            placeholder={t.role.placeholder}
            className={inputClass}
            {...register('role')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="need" className="block text-xs text-white/55 mb-1.5">
          {t.need.label}
        </label>
        <select id="need" className={cn(inputClass, 'appearance-none')} defaultValue="" {...register('need')}>
          <option value="" disabled className="bg-slate-900">
            {t.need.placeholder}
          </option>
          {VISIBLE_NEED_VALUES.map((value) => (
            <option key={value} value={value} className="bg-slate-900">
              {t.need.options[value]}
            </option>
          ))}
        </select>
        {errors.need && <p className="text-xs text-red-400 mt-1.5">{errors.need.message}</p>}
      </div>

      <div>
        <label htmlFor="message" className="block text-xs text-white/55 mb-1.5">
          {t.message.label}
        </label>
        <textarea
          id="message"
          rows={5}
          maxLength={1000}
          placeholder={t.message.placeholder}
          className={cn(inputClass, 'resize-none')}
          {...register('message')}
        />
        <div className="flex justify-between items-start mt-1.5">
          {errors.message ? (
            <p className="text-xs text-red-400">{errors.message.message}</p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-white/35">{t.message.counter.replace('{count}', String(messageValue.length))}</span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="flex items-start gap-2.5">
          <input
            id="privacy"
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border-white/25 bg-white/[0.06] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
            {...register('privacy')}
          />
          <label htmlFor="privacy" className="text-sm text-white/70 leading-relaxed">
            {t.privacy.label}{' '}
            <a href={`/${locale}/privacidad/`} className="text-[var(--primary)] hover:underline">
              {t.privacy.linkLabel}
            </a>
          </label>
        </div>
        {errors.privacy && <p className="text-xs text-red-400">{errors.privacy.message}</p>}

        <div className="flex items-start gap-2.5">
          <input
            id="marketing"
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border-white/25 bg-white/[0.06] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
            {...register('marketing')}
          />
          <label htmlFor="marketing" className="text-sm text-white/70 leading-relaxed">
            {t.marketing.label}
          </label>
        </div>
      </div>

      {status === 'error' && (
        <div className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">{t.error.title}</p>
            <p className="text-xs text-red-300/75 mt-0.5">{t.error.description}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold px-6 py-3 rounded-lg hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'loading' ? t.submitting : status === 'error' ? t.retry : t.submit}
        </button>
      </div>
    </form>
  )
}
