import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FansService } from './fans.service';

@Controller('fans')
export class FansController {
  constructor(private readonly service: FansService) {}
  @Get('summary')
  async getSummary(@Query('teamId') teamId: string) {
    const data = await this.service.getSummary(teamId);
    return data;
  }

  @Post('apply-match')
  async applyMatch(
    @Body()
    payload: {
      teamId: string;
      result: 'win' | 'draw' | 'loss';
      goals_for?: number;
      goals_against?: number;
      opponent_prestige?: number;
      is_derby?: boolean;
    },
  ) {
    return this.service.applyMatch(payload);
  }
}


