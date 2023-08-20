/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
