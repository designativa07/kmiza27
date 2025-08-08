import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InvestmentsService } from './investments.service';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly service: InvestmentsService) {}
  @Get('catalog')
  async getCatalog(@Query('teamId') teamId: string) {
    return this.service.getCatalog(teamId);
  }

  @Post('invest')
  async invest(
    @Body() payload: { teamId: string; itemId: string },
  ) {
    return this.service.invest(payload.teamId, payload.itemId);
  }
}


