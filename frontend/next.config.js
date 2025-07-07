/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para produção
  output: 'standalone',
  
  // Configuração de porta e host (Frontend usa 3002, Backend usa 3000)
  server: {
    port: process.env.FRONTEND_PORT || 3002,
    hostname: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  },
  
  // Evitar problemas de memória
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  
  // Configurações de otimização
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

module.exports = nextConfig; 