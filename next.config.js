/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['fonts.gstatic.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
