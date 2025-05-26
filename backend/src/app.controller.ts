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
      version: '1.0.0',
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
