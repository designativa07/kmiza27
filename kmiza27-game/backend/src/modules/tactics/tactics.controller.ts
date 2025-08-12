import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { TacticsService } from './tactics.service';

@Controller('tactics')
export class TacticsController {
  constructor(private readonly service: TacticsService) {}
  @Get('current')
  async getCurrent(@Query('teamId') teamId: string) {
    return this.service.get(teamId);
  }

  @Put()
  async saveTactics(
    @Body()
    payload: any,
  ) {
    return this.service.save(payload);
  }
}


