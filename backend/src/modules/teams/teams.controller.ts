import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpException, HttpStatus, UsePipes, ValidationPipe, HttpCode, Query, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService, PaginatedTeamsResult } from './teams.service';
import { Team } from '../../entities';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() createTeamDto: Partial<Team>) {
    return this.teamsService.create(createTeamDto);
  }

  @Post(':id/upload-escudo')
  @UseInterceptors(FileInterceptor('escudo'))
  async uploadEscudo(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const filePath = `/uploads/escudos/${file.filename}`;
    
    // Atualizar o time com o novo caminho do escudo
    await this.teamsService.update(+id, { logo_url: filePath });
    
    return {
      message: 'Escudo enviado com sucesso',
      filePath: filePath,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size
    };
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('competitionId') competitionId?: string,
  ): Promise<PaginatedTeamsResult> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const competitionIdNumber = competitionId ? parseInt(competitionId, 10) : undefined;
    
    return this.teamsService.findAll(
      pageNumber, 
      limitNumber, 
      search, 
      state, 
      city, 
      country, 
      competitionIdNumber
    );
  }

  @Get('all')
  findAllForAutocomplete(): Promise<Team[]> {
    return this.teamsService.findAllForAutocomplete();
  }

  @Get('international')
  async getInternationalTeams(): Promise<Team[]> {
    return this.teamsService.getInternationalTeams();
  }

  @Post(':id/international')
  async addInternationalTeam(
    @Param('id') id: string,
    @Body('order') order: number
  ): Promise<{ message: string }> {
    await this.teamsService.addInternationalTeam(+id, order);
    return { message: 'Time adicionado à lista internacional' };
  }

  @Delete(':id/international')
  async removeInternationalTeam(@Param('id') id: string): Promise<{ message: string }> {
    await this.teamsService.removeInternationalTeam(+id);
    return { message: 'Time removido da lista internacional' };
  }

  @Put(':id/international/order')
  async updateInternationalTeamOrder(
    @Param('id') id: string,
    @Body('order') order: number
  ): Promise<{ message: string }> {
    await this.teamsService.updateInternationalTeamOrder(+id, order);
    return { message: 'Ordem do time internacional atualizada' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.teamsService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: Partial<Team>) {
    return this.teamsService.update(+id, updateTeamDto);
  }

  @Get(':id/dependencies')
  async checkDependencies(@Param('id') id: string) {
    try {
      return await this.teamsService.checkTeamDependencies(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('force') force?: string) {
    try {
      const forceDelete = force === 'true';
      await this.teamsService.remove(+id, forceDelete);
      return { message: 'Time excluído com sucesso' };
    } catch (error) {
      if (error.message.includes('Não é possível excluir')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':teamId/add-player')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addPlayerToTeam( @Param('teamId') teamId: string,
    @Body('player_id') playerId: string,
    @Body('start_date') startDate: string,
    @Body('jersey_number') jerseyNumber?: string,
    @Body('role') role?: string,
  ): Promise<PlayerTeamHistory> {
    return this.teamsService.addPlayerToTeam(
      +teamId,
      +playerId,
      new Date(startDate),
      jerseyNumber,
      role,
    );
  }

  @Patch(':teamId/players/:historyId/remove')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async removePlayerFromTeam(
    @Param('teamId') teamId: string,
    @Param('historyId') historyId: string,
    @Body('end_date') endDate: string,
  ): Promise<PlayerTeamHistory> {
    return this.teamsService.removePlayerFromTeam(+historyId, +teamId, new Date(endDate));
  }

  @Get(':teamId/players-history')
  async getTeamPlayersHistory(@Param('teamId') teamId: string): Promise<PlayerTeamHistory[]> {
    return this.teamsService.getTeamPlayersHistory(+teamId);
  }

  @Get(':teamId/players')
  async getTeamActivePlayers(@Param('teamId') teamId: string): Promise<PlayerTeamHistory[]> {
    return this.teamsService.getTeamActivePlayers(+teamId);
  }

  @Get(':teamId/recent-matches')
  async getTeamRecentMatches(@Param('teamId') teamId: string) {
    return this.teamsService.getTeamRecentMatches(+teamId);
  }

  @Get(':teamId/upcoming-matches')
  async getTeamUpcomingMatches(@Param('teamId') teamId: string) {
    return this.teamsService.getTeamUpcomingMatches(+teamId);
  }

  @Get('filters/states')
  async getUniqueStates(@Query('country') country?: string): Promise<string[]> {
    return this.teamsService.getUniqueStates(country);
  }

  @Get('filters/cities')
  async getUniqueCities(
    @Query('country') country?: string,
    @Query('state') state?: string
  ): Promise<string[]> {
    return this.teamsService.getUniqueCities(country, state);
  }

  @Get('filters/countries')
  async getUniqueCountries(): Promise<string[]> {
    return this.teamsService.getUniqueCountries();
  }

  // Endpoints para gerenciar aliases
  @Patch(':id/aliases')
  async updateAliases(@Param('id') id: string, @Body('aliases') aliases: string[]) {
    return this.teamsService.updateAliases(+id, aliases);
  }

  @Post(':id/aliases')
  async addAlias(@Param('id') id: string, @Body('alias') alias: string) {
    return this.teamsService.addAlias(+id, alias);
  }

  @Delete(':id/aliases/:alias')
  async removeAlias(@Param('id') id: string, @Param('alias') alias: string) {
    return this.teamsService.removeAlias(+id, alias);
  }
} 