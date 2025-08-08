import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SponsorshipsService } from './sponsorships.service';

@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly service: SponsorshipsService) {}
  @Get('list')
  async list(@Query('teamId') teamId: string) {
    return this.service.list(teamId);
  }

  @Post('negotiate')
  async negotiate(
    @Body()
    payload: { teamId: string; slot: 'shirt' | 'stadium' | 'sleeve' | 'shorts'; months: number },
  ) {
    return this.service.negotiate(payload.teamId, payload.slot, payload.months);
  }
}


