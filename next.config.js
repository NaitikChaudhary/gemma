/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('async_hooks');
    }
    return config;
  },
};

module.exports = nextConfig;
