import { Controller, Get, Post, Query, Body, Param, Logger } from '@nestjs/common';
import { GameTeamsReformedService } from './game-teams-reformed.service';

@Controller('api/v2/game-teams')
export class GameTeamsReformedController {
  private readonly logger = new Logger(GameTeamsReformedController.name);

  constructor(private readonly gameTeamsReformedService: GameTeamsReformedService) {}

  /**
   * Criar time com sistema reformulado
   * POST /api/v2/game-teams/create
   */
  @Post('create')
  async createTeam(@Body() body: { userId: string; teamData: any }) {
    try {
      const { userId, teamData } = body;

      if (!userId || !teamData) {
        throw new Error('userId e teamData são obrigatórios');
      }

      this.logger.log(`🎮 REFORM: Criando time para usuário ${userId}`);

      const result = await this.gameTeamsReformedService.createTeam(userId, teamData);

      return {
        success: true,
        data: result,
        message: result.message
      };
    } catch (error) {
      this.logger.error('Error in createTeam:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar times do usuário
   * GET /api/v2/game-teams/user?userId=123
   */
  @Get('user')
  async getUserTeams(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`🔍 REFORM: Buscando times do usuário ${userId}`);

      const teams = await this.gameTeamsReformedService.getUserTeams(userId);

      return {
        success: true,
        data: teams,
        meta: {
          total_teams: teams.length,
          user_id: userId
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserTeams:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar time específico com progresso
   * GET /api/v2/game-teams/:teamId
   */
  @Get(':teamId')
  async getTeamWithProgress(@Param('teamId') teamId: string) {
    try {
      if (!teamId) {
        throw new Error('teamId é obrigatório');
      }

      this.logger.log(`🔍 REFORM: Buscando time ${teamId} com progresso`);

      const team = await this.gameTeamsReformedService.getTeamWithProgress(teamId);

      if (!team) {
        return {
          success: false,
          error: 'Time não encontrado',
          data: null
        };
      }

      return {
        success: true,
        data: team
      };
    } catch (error) {
      this.logger.error('Error in getTeamWithProgress:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Status de compatibilidade - informa que API foi reformulada
   * GET /api/v2/game-teams/status
   */
  @Get('status')
  async getApiStatus() {
    return {
      success: true,
      data: {
        api_version: 'v2',
        system: 'reformed',
        description: 'Sistema reformulado estilo Elifoot',
        features: [
          'Criação automática na Série D',
          'Times da máquina fixos',
          'Calendário de 38 rodadas',
          'Promoção/rebaixamento automático'
        ]
      },
      message: 'API reformulada funcionando!'
    };
  }
}