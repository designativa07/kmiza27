import { NextResponse } from 'next/server';

export async function GET() {
  const buildTime = process.env.BUILD_TIMESTAMP || new Date().toISOString();
  
  // Tentar capturar commit de várias fontes
  let gitCommit = process.env.GIT_COMMIT || 
                  process.env.VERCEL_GIT_COMMIT_SHA ||
                  process.env.RENDER_GIT_COMMIT ||
                  process.env.RAILWAY_GIT_COMMIT_SHA ||
                  process.env.COMMIT_SHA ||
                  'e4bc6cfe'; // Fallback para o último commit conhecido
  
  // Se ainda for unknown, usar o commit atual conhecido
  if (gitCommit === 'unknown' || !gitCommit) {
    gitCommit = 'e4bc6cfe';
  }
  
  // Truncar para 8 caracteres se for muito longo
  if (gitCommit.length > 8) {
    gitCommit = gitCommit.substring(0, 8);
  }
  
  const version = process.env.npm_package_version || '0.1.0';

  return NextResponse.json({
    status: 'ok',
    service: 'Kmiza27 Frontend',
    version: version,
    commit: gitCommit,
    timestamp: buildTime,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    platform: process.platform,
    nodeVersion: process.version
  });
} 