import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'pinkblueberrysalon.com', 'images.unsplash.com'],
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig