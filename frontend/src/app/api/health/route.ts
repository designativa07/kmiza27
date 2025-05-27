import { NextResponse } from 'next/server';

export async function GET() {
  const buildTime = process.env.BUILD_TIMESTAMP || new Date().toISOString();
  const gitCommit = process.env.GIT_COMMIT || 'unknown';
  const version = process.env.npm_package_version || '1.0.0';

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