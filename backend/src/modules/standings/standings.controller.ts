import { Controller, Get, Param, Query } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get('competition/:id')
  getCompetitionStandings(@Param('id') id: string, @Query('group') group?: string) {
    return this.standingsService.getCompetitionStandings(+id, group);
  }

  @Get('competition/:id/groups')
  getCompetitionGroups(@Param('id') id: string) {
    return this.standingsService.getCompetitionGroups(+id);
  }

  @Get('competition/:id/head-to-head')
  getHeadToHeadStats(@Param('id') competitionId: string, @Query('team1') team1: string, @Query('team2') team2: string) {
    return this.standingsService.getHeadToHeadStats(+competitionId, +team1, +team2);
  }

  @Get('competition/:id/team/:teamId/stats')
  getTeamStats(@Param('id') competitionId: string, @Param('teamId') teamId: string) {
    return this.standingsService.getTeamStats(+competitionId, +teamId);
  }

  @Get('competition/:id/matches')
  getCompetitionMatches(@Param('id') id: string, @Query('group') group?: string) {
    return this.standingsService.getCompetitionMatches(+id, group);
  }

  @Get('competition/:id/rounds')
  getCompetitionRounds(@Param('id') id: string) {
    return this.standingsService.getCompetitionRounds(+id);
  }

  @Get('competition/:id/round/:roundId/matches')
  getRoundMatches(@Param('id') competitionId: string, @Param('roundId') roundId: string) {
    return this.standingsService.getRoundMatches(+competitionId, +roundId);
  }
} 