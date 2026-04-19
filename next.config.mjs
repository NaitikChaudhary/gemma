import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: false,
  },
  webpack: (config) => {
    // Polyfill async_hooks with our empty module
    config.resolve.alias = {
      ...config.resolve.alias,
      'async_hooks': path.resolve(__dirname, './async_hooks.js'),
    };
    
    return config;
  },
};

export default nextConfig;
