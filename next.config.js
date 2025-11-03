// next.config.js (CommonJS)
const nextConfig = {
  // Produce a static export in the `out` directory
  output: 'export',
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'],
  },
  async rewrites() {
    return [
      { source: '/portal', destination: '/portal/index.html' },
      { source: '/portal/:path*', destination: '/portal/index.html' },
    ];
  },
};

module.exports = nextConfig;