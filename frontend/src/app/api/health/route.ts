import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const buildTime = process.env.BUILD_TIMESTAMP || new Date().toISOString();
  
  // Função para ler variáveis do .env.local se existir
  const getBuildVars = () => {
    try {
      const envPath = join(process.cwd(), '.env.local');
      const envContent = readFileSync(envPath, 'utf8');
      const vars: Record<string, string> = {};
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          vars[key.trim()] = value.trim();
        }
      });
      
      return vars;
    } catch {
      return {};
    }
  };
  
  const buildVars = getBuildVars();
  
  // Tentar capturar commit de várias fontes, incluindo build vars
  let gitCommit = process.env.GIT_COMMIT || 
                  buildVars.GIT_COMMIT ||
                  process.env.VERCEL_GIT_COMMIT_SHA ||
                  process.env.RENDER_GIT_COMMIT ||
                  process.env.RAILWAY_GIT_COMMIT_SHA ||
                  process.env.COMMIT_SHA ||
                  '84b849d'; // Fallback final
  
  // Se ainda for unknown, usar o commit do build
  if (gitCommit === 'unknown' || !gitCommit) {
    gitCommit = buildVars.GIT_COMMIT || '84b849d';
  }
  
  // Truncar para 8 caracteres se for muito longo
  if (gitCommit.length > 8) {
    gitCommit = gitCommit.substring(0, 8);
  }
  
  const version = process.env.npm_package_version || '0.1.0';
  const buildTimestamp = buildVars.BUILD_TIMESTAMP || buildTime;

  return NextResponse.json({
    status: 'ok',
    service: 'Kmiza27 Frontend',
    version: version,
    commit: gitCommit,
    timestamp: buildTimestamp,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    platform: process.platform,
    nodeVersion: process.version,
    buildInfo: {
      autoDetected: !!buildVars.GIT_COMMIT,
      source: buildVars.GIT_COMMIT ? 'docker-build' : 'fallback'
    }
  });
} 