import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { GameTeamsService } from './game-teams.service';

@Controller('game-teams')
export class GameTeamsController {
  constructor(private readonly gameTeamsService: GameTeamsService) {}

  @Get('health')
  async healthCheck() {
    return {
      success: true,
      message: '🎮 Kmiza27 Game Backend is running!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    };
  }

  @Post()
  async createTeam(@Body() requestData: any) {
    try {
      // Extrair userId do body ou usar o padrão
      const { userId, ...teamData } = requestData;
      const actualUserId = userId || '550e8400-e29b-41d4-a716-446655440000';
      
      console.log('Creating team for userId:', actualUserId);
      
      const result = await this.gameTeamsService.createTeam(actualUserId, teamData);
      return {
        success: true,
        data: result.team,
        actualUserId: result.actualUserId,
        message: 'Time criado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar time',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async getUserTeams(@Query('userId') queryUserId?: string) {
    try {
      // Usar o userId da query ou o padrão
      const userId = queryUserId || '550e8400-e29b-41d4-a716-446655440000';
      
      console.log('Getting teams for userId:', userId);
      
      const teams = await this.gameTeamsService.getUserTeams(userId);
      return {
        success: true,
        data: teams,
        message: 'Times carregados com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar times',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  async getTeamById(@Param('id') teamId: string) {
    try {
      const team = await this.gameTeamsService.getTeamById(teamId);
      return {
        success: true,
        data: team,
        message: 'Time carregado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar time',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/players')
  async getTeamPlayers(@Param('id') teamId: string) {
    try {
      const players = await this.gameTeamsService.getTeamPlayers(teamId);
      return {
        success: true,
        data: players,
        message: 'Jogadores carregados com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar jogadores',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  async updateTeam(@Param('id') teamId: string, @Body() updateData: any) {
    try {
      const team = await this.gameTeamsService.updateTeam(teamId, updateData);
      return {
        success: true,
        data: team,
        message: 'Time atualizado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar time',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':teamId')
  async deleteTeam(@Param('teamId') teamId: string, @Query('userId') userId: string) {
    try {
      const result = await this.gameTeamsService.deleteTeam(teamId, userId);
      return {
        success: true,
        data: result,
        message: 'Time deletado com sucesso!'
      };
    } catch (error) {
      // this.logger.error('Error deleting team:', error); // Assuming logger is available
      return {
        success: false,
        error: error.message,
        message: 'Erro ao deletar time'
      };
    }
  }

  @Get(':id/stats')
  async getTeamStats(@Param('id') teamId: string) {
    try {
      const stats = await this.gameTeamsService.getTeamStats(teamId);
      return {
        success: true,
        data: stats,
        message: 'Estatísticas carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar estatísticas',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/budget')
  async updateTeamBudget(
    @Param('id') teamId: string,
    @Body() budgetData: { amount: number; operation: 'add' | 'subtract' }
  ) {
    try {
      const result = await this.gameTeamsService.updateTeamBudget(
        teamId,
        budgetData.amount,
        budgetData.operation
      );
      return {
        success: true,
        data: result,
        message: 'Orçamento atualizado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar orçamento',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':id/stadium-expansion')
  async expandStadium(
    @Param('id') teamId: string,
    @Body() expansionData: { capacityIncrease: number; cost: number }
  ) {
    try {
      const result = await this.gameTeamsService.expandStadium(
        teamId,
        expansionData.capacityIncrease,
        expansionData.cost
      );
      return {
        success: true,
        data: result,
        message: 'Estádio expandido com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao expandir estádio',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/matches')
  async getTeamMatches(@Param('id') teamId: string) {
    try {
      const matches = await this.gameTeamsService.getTeamMatches(teamId);
      return {
        success: true,
        data: matches,
        message: 'Partidas carregadas com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar partidas',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('matches')
  async createMatch(@Body() matchData: any) {
    try {
      const result = await this.gameTeamsService.createMatch(matchData);
      return {
        success: true,
        data: result,
        message: 'Partida criada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao criar partida',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('matches/:matchId/simulate')
  async simulateMatch(@Param('matchId') matchId: string) {
    try {
      const result = await this.gameTeamsService.simulateMatch(matchId);
      return {
        success: true,
        data: result,
        message: 'Partida simulada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao simular partida',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
} 