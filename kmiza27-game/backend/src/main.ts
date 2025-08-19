import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurações de segurança
  app.use(helmet());
  app.use(compression());
  
  // CORS configurado para aceitar domínios de produção
  const allowedOrigins = [
    'http://localhost:3005', // Desenvolvimento local
    'https://game.kmiza27.com', // Frontend em produção
    'http://game.kmiza27.com', // Frontend HTTP (se necessário)
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // Permitir requisições sem origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`🚫 CORS bloqueado para origem: ${origin}`);
        callback(new Error('Não permitido pelo CORS'));
      }
    },
    credentials: true,
  }));

  // Validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Prefixo global da API
  app.setGlobalPrefix('api/v2');

  const port = process.env.PORT || 3004;
  const host = '0.0.0.0'; // Escutar em todas as interfaces
  
  await app.listen(port, host);
  
  console.log(`🎮 Kmiza27 Game Backend running on ${host}:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`🌐 Local: http://localhost:${port}`);
  console.log(`🌐 Network: http://0.0.0.0:${port}`);
  console.log(`🌐 Production: https://gameapi.kmiza27.com`);
}

bootstrap(); 