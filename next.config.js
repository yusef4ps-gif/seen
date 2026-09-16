/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ];
  },
  images: {
    domains: ['images.unsplash.com', 'assets.coingecko.com', 'ui-avatars.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node', 'onnxruntime-web'],
  },
  webpack: (config, { webpack, isServer }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /onnxruntime-web/,
      })
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-web": false,
    };
    return config;
  }
}

module.exports = nextConfig
