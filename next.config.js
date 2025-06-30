const { withCloudflarePages } = require('@cloudflare/next-on-pages/plugin');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

module.exports = withCloudflarePages(nextConfig);