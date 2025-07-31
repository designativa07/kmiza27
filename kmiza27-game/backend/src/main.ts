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
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3005',
    credentials: true,
  }));

  // Validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3004;
  const host = '0.0.0.0'; // Escutar em todas as interfaces
  
  await app.listen(port, host);
  
  console.log(`🎮 Kmiza27 Game Backend running on ${host}:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`🌐 Local: http://localhost:${port}`);
  console.log(`🌐 Network: http://0.0.0.0:${port}`);
}

bootstrap(); 