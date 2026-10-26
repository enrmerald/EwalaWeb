// Server Component: inyecta datos estructurados (Schema.org) generados en build a partir de
// contenido de confianza (lib/jsonld.ts), nunca de input de usuario en runtime.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
