import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'kmiza27-chatbot',
      version: process.env.BUILD_TIMESTAMP || '1.0.0',
      commit: process.env.GIT_COMMIT || 'unknown',
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_DATABASE || 'kmiza27'
      }
    };
  }
}
