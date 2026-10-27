/** @type {import('next').NextConfig} */
const nextConfig = {
  // HTML estático puro (out/), servido por Netlify. redirects/rewrites/headers de Next
  // NO funcionan con export: se configuran en netlify.toml.
  output: 'export',
  // Cada ruta se genera como carpeta/index.html y las URLs canónicas terminan en "/".
  // Evita el conflicto de Netlify entre es/blog.html y la carpeta es/blog/.
  trailingSlash: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
