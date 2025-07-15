import { Controller, Post, Get, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { UrlShortenerService, CreateShortUrlDto } from './url-shortener.service';

@Controller('url-shortener')
export class UrlShortenerController {
  constructor(private readonly urlShortenerService: UrlShortenerService) {}

  @Post()
  async createShortUrl(@Body() dto: CreateShortUrlDto) {
    return this.urlShortenerService.createShortUrl(dto);
  }

  @Post('match/:matchId')
  async createMatchShortUrl(
    @Param('matchId') matchId: number,
    @Body() body: { homeTeam: string; awayTeam: string }
  ) {
    return this.urlShortenerService.createMatchShortUrl(matchId, body.homeTeam, body.awayTeam);
  }

  @Post('stream')
  async createStreamShortUrl(
    @Body() body: { streamUrl: string; matchTitle: string }
  ) {
    return this.urlShortenerService.createStreamShortUrl(body.streamUrl, body.matchTitle);
  }

  @Post('team/:teamId')
  async createTeamShortUrl(
    @Param('teamId') teamId: number,
    @Body() body: { teamName: string }
  ) {
    return this.urlShortenerService.createTeamShortUrl(teamId, body.teamName);
  }

  @Post('competition/:competitionSlug')
  async createCompetitionShortUrl(
    @Param('competitionSlug') competitionSlug: string,
    @Body() body: { competitionName: string }
  ) {
    return this.urlShortenerService.createCompetitionShortUrl(competitionSlug, body.competitionName);
  }

  @Get()
  async getShortUrls(
    @Query('page') page: number = 1,
    @Query('itemsPerPage') itemsPerPage: number = 10
  ) {
    return this.urlShortenerService.getShortUrls(page, itemsPerPage);
  }

  @Get('stats/:shortCode')
  async getShortUrlStats(@Param('shortCode') shortCode: string) {
    return this.urlShortenerService.getShortUrlStats(shortCode);
  }

  @Get('health')
  async healthCheck() {
    const isHealthy = await this.urlShortenerService.healthCheck();
    
    if (!isHealthy) {
      throw new HttpException('Shlink service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    return { status: 'healthy', message: 'Shlink service is operational' };
  }
} 