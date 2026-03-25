/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Dev トンネル環境での _next/image 404 を回避（public からそのまま配信）
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  async headers() {
    return [
      {
        // PWA manifest (dynamic)
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // PWA manifest (static fallback)
        source: '/manifest-static.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Service Worker
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        // Public images cache policy (optional)
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
