import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kmiza27-frontend',
    version: process.env.BUILD_TIMESTAMP || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown',
    port: process.env.PORT || 3002,
    environment: process.env.NODE_ENV || 'development',
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      status: 'configured'
    },
    nextjs: {
      version: '15.4.0',
      mode: process.env.NODE_ENV === 'production' ? 'standalone' : 'development'
    }
  });
} 