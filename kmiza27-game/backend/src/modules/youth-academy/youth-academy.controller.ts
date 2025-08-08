import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { YouthAcademyService } from './youth-academy.service';

@Controller('academy')
export class YouthAcademyController {
  constructor(private readonly service: YouthAcademyService) {}
  @Post('apply-week')
  async applyWeek(@Query('teamId') teamId: string) {
    return this.service.applyWeek(teamId);
  }

  @Get('logs')
  async getLogs(@Query('teamId') teamId: string) {
    const logs = await this.service.getLogs(teamId);
    return { teamId, logs };
  }

  @Get('players')
  async getAcademyPlayers(@Query('teamId') teamId: string) {
    const players = await this.service.getPlayersInAcademy(teamId);
    return { success: true, data: players };
  }

  @Post('set-training')
  async setTraining(
    @Body()
    payload: {
      playerId: string;
      focus: string;
      intensity?: 'low' | 'normal' | 'high';
      inAcademy?: boolean;
    },
  ) {
    return this.service.setTraining(payload);
  }
}


