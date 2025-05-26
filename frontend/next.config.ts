import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para produção - Build: 2025-05-26T03:10:00Z
  output: 'standalone',
  
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
};

export default nextConfig;
