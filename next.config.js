/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  reactStrictMode: true,
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
