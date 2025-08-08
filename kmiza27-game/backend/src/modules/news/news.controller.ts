import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly service: NewsService) {}
  @Get('feed')
  async feed(@Query('teamId') teamId: string) {
    return this.service.feed(teamId);
  }

  @Post('publish')
  async publish(
    @Body() payload: { teamId: string; type: string; title: string; message?: string },
  ) {
    return this.service.publish(payload.teamId, payload.type, payload.title, payload.message);
  }
}


