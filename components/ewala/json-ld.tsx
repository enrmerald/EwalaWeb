// Server Component: inyecta datos estructurados (Schema.org) generados en build a partir de
// contenido de confianza (lib/jsonld.ts), nunca de input de usuario en runtime.
// Se escapa "<" para que ningún texto pueda cerrar el <script> (p. ej. "</script>" en un título).
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON propio con "<" escapado: no puede cerrar el <script>
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
