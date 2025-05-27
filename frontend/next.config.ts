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
  // Configuração para produção - Build: 2025-05-26T03:10:00Z
  output: 'standalone',
  
  // Variáveis de ambiente
  env: {
    BUILD_TIMESTAMP: process.env.BUILD_TIMESTAMP || buildTimestamp,
    GIT_COMMIT: process.env.GIT_COMMIT || gitCommit,
    npm_package_version: process.env.npm_package_version || '1.0.0',
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
};

export default nextConfig;
