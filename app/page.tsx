import { redirect } from 'next/navigation'

// Respaldo en cliente: en producción Netlify responde antes con un 301 de "/" a "/es/" (netlify.toml).
export default function RootPage() {
  redirect('/es/')
}
