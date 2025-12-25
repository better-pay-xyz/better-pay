/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@better-pay/database', '@better-pay/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
}

export default nextConfig
