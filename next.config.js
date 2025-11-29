const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,

  productionBrowserSourceMaps: true, // ✅ Enables readable error stack traces in production

  experimental: {
    serverComponentsExternalPackages: ["next-auth"],
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "@tanstack/react-query",
      "next-intl",
    ],
    swcMinify: true,
    workerThreads: false,
    // Add route prefetching for better performance
    optimizeCss: true,
    scrollRestoration: true,
  },

  // ✅ ignore every TS error
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ ignore every ESLint error
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Add performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Optimize bundle splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle splitting for production
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

const withNextIntl = require("next-intl/plugin")("./i18n.ts");
module.exports = withNextIntl(nextConfig);
