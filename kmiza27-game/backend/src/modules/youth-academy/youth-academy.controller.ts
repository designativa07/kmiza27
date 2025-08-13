import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { YouthAcademyService } from './youth-academy.service';

@Controller('academy')
export class YouthAcademyController {
  constructor(private readonly service: YouthAcademyService) {}

  @Post('set-training')
  async setTraining(@Body() payload: {
    playerId: string;
    focus: string;
    intensity?: 'low'|'normal'|'high';
    inAcademy?: boolean;
    trainingType?: 'youth'|'professional'|'mixed';
  }) {
    return this.service.setTraining(payload);
  }

  @Post('apply-week')
  async applyWeek(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new Error('teamId é obrigatório');
    }
    return this.service.applyWeek(teamId);
  }

  @Get('logs')
  async getLogs(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new Error('teamId é obrigatório');
    }
    return this.service.getLogs(teamId);
  }

  @Get('players')
  async getAcademyPlayers(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new Error('teamId é obrigatório');
    }
    const players = await this.service.getPlayersInAcademy(teamId);
    return players;
  }

  @Get('stats')
  async getTrainingStats(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new Error('teamId é obrigatório');
    }
    return this.service.getTrainingStats(teamId);
  }

  @Get('overview')
  async getAcademyOverview(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new Error('teamId é obrigatório');
    }

    try {
      const [players, stats, logs] = await Promise.all([
        this.service.getPlayersInAcademy(teamId),
        this.service.getTrainingStats(teamId),
        this.service.getLogs(teamId)
      ]);

      return {
        players,
        stats,
        recentLogs: logs.slice(0, 10), // Últimos 10 logs
        totalLogs: logs.length
      };
    } catch (error) {
      throw new Error(`Erro ao buscar overview da academia: ${error.message}`);
    }
  }

  @Get('test')
  async testEndpoint() {
    return {
      message: 'Endpoint de teste da academia funcionando!',
      timestamp: new Date().toISOString(),
      status: 'OK'
    };
  }
}


