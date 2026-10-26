import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    // Artefactos generados, dependencias y código ajeno al build de la web.
    // components/ui es shadcn/ui: no se edita a mano (ver CLAUDE.md), así que no se lintea.
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      '_livet-spa/**',
      'src/generated/**',
      'components/ui/**',
      'next-env.d.ts',
    ],
  },
  {
    // Reglas del React Compiler (eslint-plugin-react-hooks v6+). El proyecto no usa el compilador,
    // así que se dejan como aviso: siguen visibles pero no rompen `pnpm lint`.
    // Hallazgos previos: hooks/use-mobile.ts (setState en effect) e i18n/client.tsx (t.raw = …).
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
