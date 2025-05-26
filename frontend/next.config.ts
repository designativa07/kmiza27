import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para produção
  output: 'standalone',
  
  // Configurar API URL baseado no ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://kmizabot.h4xd66.easypanel.host' : 'http://localhost:3000'),
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost', 'kmizabot.h4xd66.easypanel.host'],
    unoptimized: true
  },
  
  // Desabilitar ESLint e TypeScript completamente durante build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configurações de produção
  poweredByHeader: false,
  compress: true,
  
  // Remover configurações experimentais problemáticas
  swcMinify: true,
};

export default nextConfig;
