/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita standalone output para Docker
  output: 'standalone',
  
  // Configurações para servir assets estáticos corretamente
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Otimizações de produção
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  // Configurações de imagem para melhor performance
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.kmiza27.com',
        port: '',
        pathname: '/img/**',
      },
    ],
  },
  
  // Configurações adicionais para produção
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig; 