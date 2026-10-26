'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import type { Messages } from '@/i18n/types'
import { cn } from '@/lib/utils'
import { SHOW_DEMO_CTA } from '@/lib/features'
import {
  CONTACT_LIMITS as L,
  NEED_VALUES,
  PHONE_PATTERN,
  type ContactErrorCode,
  type NeedValue,
} from '@/lib/contact'
import { newSubmissionId, submitContact, waitForMinimumFillTime } from '@/lib/contact-client'

type ContactFormMessages = Messages['contact']['form']

interface ContactFormProps {
  t: ContactFormMessages
  locale: Locale
}

// Mientras la demo no esté activa (lib/features.ts) no se ofrece «Demo» en el selector ni se admite ?need=demo.
const VISIBLE_NEED_VALUES = NEED_VALUES.filter((value) => value !== 'demo' || SHOW_DEMO_CTA)

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

function buildSchema(t: ContactFormMessages) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(L.firstName.min, t.validation.firstNameMin)
      .max(L.firstName.max, t.validation.firstNameMax),
    lastName: z.string().trim().max(L.lastName.max, t.validation.lastNameMax).optional().or(z.literal('')),
    company: z
      .string()
      .trim()
      .min(L.company.min, t.validation.companyMin)
      .max(L.company.max, t.validation.companyMax),
    email: z
      .string()
      .trim()
      .min(1, t.validation.emailInvalid)
      .max(L.email.max, t.validation.emailInvalid)
      .email(t.validation.emailInvalid),
    phone: z
      .string()
      .trim()
      .max(L.phone.max, t.validation.phoneInvalid)
      .regex(PHONE_PATTERN, t.validation.phoneInvalid)
      .optional(),
    role: z.string().trim().max(L.role.max, t.validation.roleMax).optional(),
    need: z.string().min(1, t.validation.needRequired),
    message: z.string().trim().max(L.message.max, t.validation.messageMax).optional().or(z.literal('')),
    privacy: z.boolean().refine((v) => v === true, { message: t.privacy.error }),
    marketing: z.boolean().optional(),
    // Honeypot anti-spam: debe llegar vacío. Los bots suelen rellenar todos los campos.
    // No se valida aquí: lo decide el servidor, que responde «éxito» sin enviar nada.
    company_website: z.string().optional(),
  })
}

type ContactFormValues = z.infer<ReturnType<typeof buildSchema>>

export function ContactForm({ t, locale }: ContactFormProps) {
  const schema = useMemo(() => buildSchema(t), [t])
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorCode, setErrorCode] = useState<ContactErrorCode>('generic')
  const [result, setResult] = useState<{ reference: string; testMode: boolean } | null>(null)
  // Se fijan al montar (no en el render): con export estático el render ocurre en el build y
  // quedarían congelados con la fecha del build y el mismo identificador para todo el mundo.
  const renderedAt = useRef(0)
  const submissionId = useRef('')

  useEffect(() => {
    renderedAt.current = Date.now()
    submissionId.current = newSubmissionId()
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
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
    setStatus('loading')
    await waitForMinimumFillTime(renderedAt.current)

    const response = await submitContact({
      submissionId: submissionId.current || newSubmissionId(),
      locale,
      renderedAt: renderedAt.current,
      firstName: values.firstName,
      lastName: values.lastName ?? '',
      company: values.company,
      email: values.email,
      phone: values.phone ?? '',
      role: values.role ?? '',
      need: values.need as NeedValue,
      message: values.message ?? '',
      privacy: true,
      marketing: values.marketing ?? false,
      website: values.company_website ?? '',
    })

    if (response.ok) {
      setResult({ reference: response.reference, testMode: response.delivery === 'skipped' })
      setStatus('success')
      reset()
      return
    }

    // El servidor indica qué campos rechazó (nunca por qué): se marcan para que la persona los revise.
    for (const field of Object.keys(response.fields ?? {})) {
      if (field in values) setError(field as keyof ContactFormValues, { message: t.validation.invalid })
    }
    setErrorCode(response.error)
    setStatus('error')
  }

  const errorText = errorCode === 'generic' ? t.error.description : t.error[errorCode]

  const inputClass =
    'w-full rounded-lg bg-white/[0.06] border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[var(--primary)] focus:outline-none transition-colors disabled:opacity-50'

  if (status === 'success') {
    return (
      <div role="status" className="rounded-2xl border border-[var(--primary)]/30 bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] p-8 text-center">
        <CheckCircle2 className="w-10 h-10 text-[var(--primary)] mx-auto mb-4" />
        <h3 className="text-white font-mono text-xl font-semibold">{t.success.title}</h3>
        <p className="text-white/70 mt-2 leading-relaxed">{t.success.description}</p>
        {result && (
          <p className="text-white/60 mt-4 font-mono text-sm">
            {t.success.reference.replace('{reference}', result.reference)}
          </p>
        )}
        {result?.testMode && (
          <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-xs text-amber-200/90">
            {t.success.testMode}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
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
          {errors.phone && <p className="text-xs text-red-400 mt-1.5">{errors.phone.message}</p>}
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
          {errors.role && <p className="text-xs text-red-400 mt-1.5">{errors.role.message}</p>}
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
        <div role="alert" className="rounded-lg border border-red-400/25 bg-red-400/[0.06] px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm text-red-300 font-medium">{t.error.title}</p>
            <p className="text-xs text-red-300/75 mt-0.5">{errorText}</p>
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
