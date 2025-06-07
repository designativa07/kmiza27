import type { NextConfig } from "next";
import { execSync } from 'child_process';

// Função para obter informações de build
function getBuildInfo() {
  try {
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const buildTimestamp = new Date().toISOString();
    return { gitCommit, buildTimestamp };
  } catch (error) {
    return { gitCommit: 'unknown', buildTimestamp: new Date().toISOString() };
  }
}

const { gitCommit, buildTimestamp } = getBuildInfo();

const nextConfig: NextConfig = {
  // Configuração para produção com cache busting otimizado
  output: 'standalone',
  
  // Gerar Build ID único para cache busting
  generateBuildId: async () => {
    const commit = process.env.GIT_COMMIT || process.env.GITHUB_SHA || gitCommit;
    const timestamp = process.env.BUILD_TIMESTAMP || buildTimestamp;
    const cacheBuster = process.env.CACHE_BUSTER || Date.now().toString();
    
    return `${commit.substring(0, 8)}-${cacheBuster}`;
  },
  
  // Variáveis de ambiente
  env: {
    BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP || buildTimestamp,
    GIT_COMMIT: process.env.GIT_COMMIT || process.env.GITHUB_SHA || gitCommit,
    CACHE_BUSTER: process.env.CACHE_BUSTER || Date.now().toString(),
    npm_package_version: process.env.npm_package_version || '1.0.0',
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost', 'kmizabot.h4xd66.easypanel.host'],
    unoptimized: true
  },
  
  // Desabilitar ESLint e TypeScript durante build para velocidade
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configurações de produção otimizadas
  poweredByHeader: false,
  compress: true,
  
  // Headers para cache busting
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
