import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

// Carregar variáveis de ambiente manualmente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = join(__dirname, '..', '..', 'backend', envFile);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      // Sempre definir no process.env (sobrescrever se necessário)
      process.env[key] = value;
    }
  });
}

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
      'https://kmiza27.h4xd66.easypanel.host',
      'https://kmiza27-evolution.h4xd66.easypanel.host',
      'https://kmiza27-futepedia.h4xd66.easypanel.host',
      'https://admin.kmiza27.com',
      'https://futepedia.kmiza27.com',
      'https://api.kmiza27.com',
      'https://evolution.kmiza27.com'
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

  // Servir arquivos estáticos da pasta public (favicon, etc.)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });
  
  // Configurar porta e host para produção
  const port = process.env.PORT || 3000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  await app.listen(port, host);
  
  console.log(`✅ Application running on: http://${host}:${port}`);
}
bootstrap();
