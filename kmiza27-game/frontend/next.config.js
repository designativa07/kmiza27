/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração de proxy para produção
  async rewrites() {
    return [
      {
        source: '/api/v2/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'https://gameapi.kmiza27.com/api/v2/:path*'  // Produção
          : 'http://localhost:3004/api/v2/:path*',       // Desenvolvimento
      },
    ]
  },
  // Configurações para produção
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
