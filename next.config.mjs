import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false,
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Polyfill async_hooks with our empty module
    config.resolve.alias = {
      ...config.resolve.alias,
      'async_hooks': path.resolve(__dirname, './async_hooks.js'),
      'diagnostics_channel': path.resolve(__dirname, './async_hooks.js'),
    };
    
    // For server builds, explicitly exclude these
    if (isServer) {
      config.externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      
      config.externals.push('async_hooks', 'diagnostics_channel');
    }
    
    return config;
  },
};

export default nextConfig;
