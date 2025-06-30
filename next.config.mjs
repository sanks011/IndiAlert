/** @type {import('next').NextConfig} */
const { withCloudflarePages } = require('@cloudflare/next-on-pages/plugin');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Good, since Cloudflare does not support Next.js image optimization
  },
};

module.exports = withCloudflarePages(nextConfig);