import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Prefixo global removido - usando domínio api.kmiza27.com
  // app.setGlobalPrefix('api');
  
  // Configurar CORS para permitir acesso do frontend e Easypanel
  app.enableCors({
    origin: [
      'http://localhost:3001', // Next.js dev server
      'http://localhost:3002', 
      'http://localhost:3003', // Futepedia frontend
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://192.168.0.43:3002',
      'https://kmizafront.h4xd66.easypanel.host',
      'https://kmizabot.h4xd66.easypanel.host',
      'https://kmiza27-evolution.h4xd66.easypanel.host',
      'https://kmiza27-futepedia.h4xd66.easypanel.host',
      'https://admin.kmiza27.com',
      'https://futepedia.kmiza27.com',
      'https://api.kmiza27.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  
  // ✅ CORREÇÃO UTF-8: Configurar middleware JSON com charset UTF-8 para suportar acentos
  app.use('/chatbot/webhook', (req, res, next) => {
    // Garantir que o Content-Type seja interpretado como UTF-8
    if (req.headers['content-type'] && !req.headers['content-type'].includes('charset')) {
      req.headers['content-type'] = 'application/json; charset=utf-8';
    }
    
    // Configurar response para UTF-8
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    next();
  });
  
  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Servir arquivos estáticos da pasta img (para logos de competição)
  app.useStaticAssets(join(__dirname, '..', 'img'), {
    prefix: '/img/',
  });
  
  // Configurar porta e host para produção
  const port = process.env.PORT || 3000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  console.log('🚀 Starting kmiza27-chatbot...');
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`🚪 Port: ${port}`);
  console.log('🔧 CORS Fix: 2025-05-26T03:20:00Z - Frontend URL updated');
  console.log('✅ UTF-8 Fix: 2025-05-26T04:00:00Z - Chatbot webhook with charset UTF-8');
  console.log('🔗 API Prefix: REMOVED - Using api.kmiza27.com domain instead');
  
  await app.listen(port, host);
  
  console.log(`✅ Application is running on: http://${host}:${port}`);
  console.log(`🔗 Health check: http://${host}:${port}/health`);
  console.log(`📊 Standings API: http://${host}:${port}/standings/slug/{slug}`);
}
bootstrap();
