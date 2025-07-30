import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { AmateurService } from './amateur.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AmateurPermissionsGuard } from './amateur-permissions.guard';

@Controller('amateur')
export class AmateurController {
  constructor(private readonly amateurService: AmateurService) {}

  @Get('competitions')
  async getAmateurCompetitions() {
    return this.amateurService.getAmateurCompetitions();
  }

  @Get('competitions/:id')
  async getAmateurCompetition(@Param('id') id: string) {
    return this.amateurService.getAmateurCompetition(+id);
  }

  @Get('competitions/slug/:slug')
  async getAmateurCompetitionBySlug(@Param('slug') slug: string) {
    return this.amateurService.getAmateurCompetitionBySlug(slug);
  }

  @Get('competitions/:id/teams')
  async getAmateurCompetitionTeams(@Param('id') id: string) {
    return this.amateurService.getAmateurCompetitionTeams(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('competitions/:id/teams')
  async saveAmateurCompetitionTeams(@Param('id') id: string, @Body() competitionTeamsDto: any) {
    return this.amateurService.saveAmateurCompetitionTeams(+id, competitionTeamsDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('competitions')
  async createAmateurCompetition(@Body() createCompetitionDto: any) {
    return this.amateurService.createAmateurCompetition(createCompetitionDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Patch('competitions/:id')
  async updateAmateurCompetition(@Param('id') id: string, @Body() updateCompetitionDto: any) {
    return this.amateurService.updateAmateurCompetition(+id, updateCompetitionDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Delete('competitions/:id')
  async deleteAmateurCompetition(@Param('id') id: string) {
    return this.amateurService.deleteAmateurCompetition(+id);
  }

  @Get('teams')
  async getAmateurTeams() {
    return this.amateurService.getAmateurTeams();
  }

  @Get('teams/:id')
  async getAmateurTeam(@Param('id') id: string) {
    return this.amateurService.getAmateurTeam(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('teams')
  async createAmateurTeam(@Body() createTeamDto: any) {
    return this.amateurService.createAmateurTeam(createTeamDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Patch('teams/:id')
  async updateAmateurTeam(@Param('id') id: string, @Body() updateTeamDto: any) {
    return this.amateurService.updateAmateurTeam(+id, updateTeamDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Delete('teams/:id')
  async deleteAmateurTeam(@Param('id') id: string) {
    return this.amateurService.deleteAmateurTeam(+id);
  }

  @Get('teams/:id/players')
  async getAmateurTeamPlayers(@Param('id') id: string) {
    return this.amateurService.getAmateurTeamPlayers(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('teams/:id/players')
  async saveAmateurTeamPlayers(@Param('id') id: string, @Body() teamPlayersDto: any) {
    return this.amateurService.saveAmateurTeamPlayers(+id, teamPlayersDto);
  }

  @Get('matches')
  async getAmateurMatches(@Query('competitionId') competitionId?: string) {
    return this.amateurService.getAmateurMatches(competitionId ? +competitionId : undefined);
  }

  @Get('matches/:id')
  async getAmateurMatch(@Param('id') id: string) {
    return this.amateurService.getAmateurMatch(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('matches')
  async createAmateurMatch(@Body() createMatchDto: any) {
    return this.amateurService.createAmateurMatch(createMatchDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Patch('matches/:id')
  async updateAmateurMatch(@Param('id') id: string, @Body() updateMatchDto: any) {
    return this.amateurService.updateAmateurMatch(+id, updateMatchDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Delete('matches/:id')
  async deleteAmateurMatch(@Param('id') id: string) {
    return this.amateurService.deleteAmateurMatch(+id);
  }

  @Get('stadiums')
  async getAmateurStadiums() {
    return this.amateurService.getAmateurStadiums();
  }

  @Get('stadiums/:id')
  async getAmateurStadium(@Param('id') id: string) {
    return this.amateurService.getAmateurStadium(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('stadiums')
  async createAmateurStadium(@Body() createStadiumDto: any) {
    return this.amateurService.createAmateurStadium(createStadiumDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Patch('stadiums/:id')
  async updateAmateurStadium(@Param('id') id: string, @Body() updateStadiumDto: any) {
    return this.amateurService.updateAmateurStadium(+id, updateStadiumDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Delete('stadiums/:id')
  async deleteAmateurStadium(@Param('id') id: string) {
    return this.amateurService.deleteAmateurStadium(+id);
  }

  @Get('standings/:competitionId')
  async getAmateurStandings(@Param('competitionId') competitionId: string) {
    return this.amateurService.getAmateurStandings(+competitionId);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('competitions/:competitionId/update-standings')
  async updateCompetitionStandings(@Param('competitionId') competitionId: string) {
    await this.amateurService.updateCompetitionStandings(+competitionId);
    return { success: true, message: 'Estatísticas da competição atualizadas com sucesso' };
  }

  @Get('top-scorers/:competitionId')
  async getAmateurTopScorers(@Param('competitionId') competitionId: string) {
    return this.amateurService.getAmateurTopScorers(+competitionId);
  }

  @Get('setup-teams-category')
  async setupTeamsCategory() {
    return this.amateurService.setupTeamsCategory();
  }

  @Get('setup-users-role')
  async setupUsersRole() {
    return this.amateurService.setupUsersRole();
  }

  @Get('setup-players-category')
  async setupPlayersCategory() {
    return this.amateurService.setupPlayersCategory();
  }

  @Get('players')
  async getAmateurPlayers() {
    return this.amateurService.getAmateurPlayers();
  }

  @Get('players/:id')
  async getAmateurPlayer(@Param('id') id: string) {
    return this.amateurService.getAmateurPlayer(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Post('players')
  async createAmateurPlayer(@Body() createPlayerDto: any) {
    return this.amateurService.createAmateurPlayer(createPlayerDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Patch('players/:id')
  async updateAmateurPlayer(@Param('id') id: string, @Body() updatePlayerDto: any) {
    return this.amateurService.updateAmateurPlayer(+id, updatePlayerDto);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Delete('players/:id')
  async deleteAmateurPlayer(@Param('id') id: string) {
    return this.amateurService.deleteAmateurPlayer(+id);
  }

  @UseGuards(AmateurPermissionsGuard)
  @Get('statistics')
  async getStatisticsComparison() {
    return this.amateurService.getStatisticsComparison();
  }

  @Get('competitions/:id/players')
  async getAmateurCompetitionPlayers(@Param('id', ParseIntPipe) id: number) {
    return this.amateurService.getAmateurCompetitionPlayers(id);
  }
} 