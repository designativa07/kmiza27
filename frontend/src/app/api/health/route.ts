import { NextResponse } from 'next/server';

export async function GET() {
  // Usar as mesmas variáveis que o backend usa
  const buildTime = process.env.BUILD_TIMESTAMP || new Date().toISOString();
  
  let gitCommit = process.env.GIT_COMMIT || 
                  process.env.VERCEL_GIT_COMMIT_SHA ||
                  process.env.RENDER_GIT_COMMIT ||
                  process.env.RAILWAY_GIT_COMMIT_SHA ||
                  process.env.COMMIT_SHA ||
                  'unknown';
  
  // Truncar para 8 caracteres se for muito longo
  if (gitCommit.length > 8) {
    gitCommit = gitCommit.substring(0, 8);
  }
  
  const version = process.env.npm_package_version || '0.1.1';

  return NextResponse.json({
    status: 'ok',
    service: 'kmiza27-frontend',
    version: buildTime,
    commit: gitCommit,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    platform: process.platform,
    nodeVersion: process.version,
    buildInfo: {
      buildTimestamp: buildTime,
      gitCommit: gitCommit,
      source: process.env.GIT_COMMIT ? 'environment' : 'unknown'
    }
  });
} 