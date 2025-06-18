/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita standalone output para Docker
  output: 'standalone',
  
  // Otimizações de produção
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  // Configurações de imagem para melhor performance
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; 