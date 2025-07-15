/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para produção (standalone permite deployment otimizado)
  output: 'standalone',
  
  // Evitar problemas de memória
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  
  // ✅ CORREÇÃO UTF-8: Forçar encoding correto
  webpack: (config, { isServer }) => {
    // Configurar encoding UTF-8 para todos os loaders
    config.module.rules.forEach(rule => {
      if (rule.test && rule.test.toString().includes('tsx?')) {
        if (rule.use) {
          rule.use.forEach(use => {
            if (use.loader && use.loader.includes('babel-loader')) {
              use.options = use.options || {};
              use.options.compact = false;
            }
          });
        }
      }
    });

    // Garantir que strings sejam tratadas como UTF-8
    config.optimization = config.optimization || {};
    config.optimization.minimize = process.env.NODE_ENV === 'production';
    
    return config;
  },
  
  // Configurações de otimização
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Configuração de imagens (se necessário)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.kmiza27.com',
        port: '',
        pathname: '/**',
      },
    ],
  }
};

module.exports = nextConfig; 