import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      success: true,
      message: '🎮 Kmiza27 Game Backend is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    };
  }

  @Get()
  getHello() {
    return {
      message: 'Welcome to Kmiza27 Game Backend!',
      endpoints: {
        health: '/api/v1/health',
        teams: '/api/v1/game-teams'
      }
    };
  }
} 