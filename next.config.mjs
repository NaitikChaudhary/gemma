/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'async_hooks': false,
      'diagnostics_channel': false,
      'perf_hooks': false,
    };
    
    // Ensure async_hooks is treated as external
    config.externals = config.externals || [];
    config.externals.push('async_hooks', 'diagnostics_channel', 'perf_hooks');
    
    return config;
  },
};

export default nextConfig;
