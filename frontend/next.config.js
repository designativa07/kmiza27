/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para produção (standalone permite deployment otimizado)
  output: 'standalone',
  
  // Evitar problemas de memória
  experimental: {
    workerThreads: false,
    cpus: 1
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