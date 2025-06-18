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
  },
  
  // Configurações adicionais para produção
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig; 