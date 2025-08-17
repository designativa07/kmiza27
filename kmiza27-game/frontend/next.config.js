/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Adiciona uma regra de proxy para o backend NestJS
  async rewrites() {
    return [
      {
        source: '/api/v2/:path*',
        destination: 'http://localhost:3004/api/v2/:path*', // <-- CORRIGIDO AQUI
      },
    ]
  },
};

module.exports = nextConfig;
