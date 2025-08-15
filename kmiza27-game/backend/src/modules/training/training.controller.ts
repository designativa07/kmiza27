import { Controller, Get, Post, Put, Query, Body, Param } from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('api/v2/training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  /**
   * Buscar jogadores profissionais para treinamento
   * GET /api/v2/training/players?teamId=...
   */
  @Get('players')
  async getProfessionalPlayers(@Query('teamId') teamId: string) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: []
      };
    }

    try {
      const players = await this.trainingService.getProfessionalPlayers(teamId);
      
      return {
        success: true,
        data: players,
        count: players.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Configurar treinamento para um jogador profissional
   * PUT /api/v2/training/set
   */
  @Put('set')
  async setPlayerTraining(@Body() payload: {
    playerId: string;
    teamId: string;
    focus: string;
    intensity: 'baixa' | 'normal' | 'alta';
    inAcademy: boolean;
  }) {
    if (!payload.playerId || !payload.teamId || !payload.focus || !payload.intensity) {
      return {
        success: false,
        error: 'Todos os campos são obrigatórios',
        data: null
      };
    }

    try {
      const result = await this.trainingService.setTraining(payload);
      
      return {
        success: true,
        data: result,
        message: 'Treinamento configurado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Aplicar semana de treinamento para jogadores profissionais
   * POST /api/v2/training/apply-week
   */
  @Post('apply-week')
  async applyTrainingWeek(@Body() payload: { teamId: string }) {
    if (!payload.teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: null
      };
    }

    try {
      const result = await this.trainingService.applyTrainingWeek(payload.teamId);
      
      return {
        success: true,
        data: result,
        message: 'Semana de treinamento aplicada com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar detalhes de um jogador profissional
   * GET /api/v2/training/player-details/:playerId?teamId=...
   */
  @Get('player-details/:playerId')
  async getPlayerDetails(
    @Param('playerId') playerId: string,
    @Query('teamId') teamId: string
  ) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: null
      };
    }

    try {
      const result = await this.trainingService.getPlayerDetails(playerId, teamId);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar estatísticas de treinamento
   * GET /api/v2/training/stats?teamId=...
   */
  @Get('stats')
  async getTrainingStats(@Query('teamId') teamId: string) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: null
      };
    }

    try {
      const stats = await this.trainingService.getTrainingStats(teamId);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}
