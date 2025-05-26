import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configurar CORS para permitir acesso do frontend e Easypanel
  app.enableCors({
    origin: [
      'http://localhost:3001', 
      'http://127.0.0.1:3001',
      'http://192.168.0.43:3001',
      'https://kmiza27-kmizabot.h4xd66.easypanel.host',
      'https://kmiza27-frontend.h4xd66.easypanel.host',
      'https://kmiza27-evolution.h4xd66.easypanel.host'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  
  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Configurar porta e host para produção
  const port = process.env.PORT || 3000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  console.log('🚀 Starting kmiza27-chatbot...');
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Host: ${host}`);
  console.log(`🚪 Port: ${port}`);
  
  await app.listen(port, host);
  
  console.log(`✅ Application is running on: http://${host}:${port}`);
  console.log(`🔗 Health check: http://${host}:${port}/health`);
}
bootstrap();
