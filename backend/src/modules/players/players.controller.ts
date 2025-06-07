import { Controller, Get, Post, Put, Delete, Param, Body, UsePipes, ValidationPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { Player } from '../../entities/player.entity';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';
import { Goal } from '../../entities/goal.entity';
import { Card } from '../../entities/card.entity';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() playerData: Partial<Player>): Promise<Player> {
    return this.playersService.createPlayer(playerData);
  }

  @Get('test')
  async test() {
    return { 
      message: 'Players endpoint funcionando!', 
      timestamp: new Date().toISOString(),
      status: 'ok' 
    };
  }

  @Get()
  async findAll(): Promise<Player[]> {
    try {
      console.log('🔍 PlayersController: Iniciando busca de jogadores...');
      const players = await this.playersService.findAllPlayers();
      console.log(`✅ PlayersController: ${players.length} jogadores encontrados`);
      return players;
    } catch (error) {
      console.error('❌ PlayersController: Erro ao buscar jogadores:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Player> {
    return this.playersService.findPlayerById(+id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() playerData: Partial<Player>): Promise<Player> {
    return this.playersService.updatePlayer(+id, playerData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.playersService.deletePlayer(+id);
  }

  @Post(':playerId/add-to-team')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addPlayerToTeam(
    @Param('playerId') playerId: string,
    @Body('teamId') teamId: string,
    @Body('startDate') startDate: string,
    @Body('jerseyNumber') jerseyNumber?: string,
    @Body('role') role?: string,
  ): Promise<PlayerTeamHistory> {
    return this.playersService.addPlayerToTeam(+playerId, +teamId, new Date(startDate), jerseyNumber, role);
  }

  @Post(':playerId/remove-from-team')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async removePlayerFromTeam(
    @Param('playerId') playerId: string,
    @Body('teamId') teamId: string,
    @Body('endDate') endDate?: string,
  ): Promise<PlayerTeamHistory> {
    return this.playersService.removePlayerFromTeam(+playerId, +teamId, endDate ? new Date(endDate) : undefined);
  }

  @Get(':playerId/current-team')
  async getPlayerCurrentTeam(@Param('playerId') playerId: string) {
    return this.playersService.getPlayerCurrentTeam(+playerId);
  }

  @Get('team/:teamId/players')
  async getTeamPlayers(@Param('teamId') teamId: string): Promise<PlayerTeamHistory[]> {
    return this.playersService.getTeamPlayers(+teamId);
  }

  @Post(':matchId/goals')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addGoal(
    @Param('matchId') matchId: string,
    @Body('playerId') playerId: string,
    @Body('teamId') teamId: string,
    @Body('minute') minute: number,
    @Body('type') type?: string,
  ): Promise<Goal> {
    return this.playersService.addGoal(+matchId, +playerId, +teamId, minute, type);
  }

  @Post(':matchId/cards')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addCard(
    @Param('matchId') matchId: string,
    @Body('playerId') playerId: string,
    @Body('type') type: 'yellow' | 'red',
    @Body('minute') minute: number,
    @Body('reason') reason?: string,
  ): Promise<Card> {
    return this.playersService.addCard(+matchId, +playerId, type, minute, reason);
  }

  @Get(':matchId/goals')
  async getMatchGoals(@Param('matchId') matchId: string): Promise<Goal[]> {
    return this.playersService.getMatchGoals(+matchId);
  }

  @Get(':matchId/cards')
  async getMatchCards(@Param('matchId') matchId: string): Promise<Card[]> {
    return this.playersService.getMatchCards(+matchId);
  }
} 