/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['res.cloudinary.com'] },
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/portal', destination: '/portal/index.html' },
      { source: '/portal/:path*', destination: '/portal/index.html' }
    ];
  }
};

export default nextConfig;