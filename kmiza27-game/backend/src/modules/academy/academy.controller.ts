import { Controller, Get, Post, Put, Query, Body, Param } from '@nestjs/common';
import { AcademyService } from './academy.service';

@Controller('api/v2/academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  /**
   * Buscar jogadores da academia
   * GET /api/v2/academy/players?teamId=...
   */
  @Get('players')
  async getAcademyPlayers(@Query('teamId') teamId: string) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: []
      };
    }

    try {
      const players = await this.academyService.getAcademyPlayers(teamId);
      
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
   * Configurar treinamento para um jogador
   * PUT /api/v2/academy/training
   */
  @Put('training')
  async setPlayerTraining(@Body() payload: {
    playerId: string;
    teamId: string;
    focus: string;
    intensity: 'baixa' | 'normal' | 'alta';
    inAcademy: boolean;
    playerType: 'youth' | 'professional';
  }) {
    if (!payload.playerId || !payload.teamId || !payload.focus || !payload.intensity) {
      return {
        success: false,
        error: 'Todos os campos são obrigatórios',
        data: null
      };
    }

    try {
      const result = await this.academyService.setTraining(payload);
      
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
   * Aplicar semana de treinamento
   * POST /api/v2/academy/apply-week
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
      const result = await this.academyService.applyTrainingWeek(payload.teamId);
      
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
   * Buscar logs de treinamento
   * GET /api/v2/academy/logs?teamId=...&limit=50
   */
  @Get('logs')
  async getTrainingLogs(
    @Query('teamId') teamId: string,
    @Query('limit') limit: string = '50'
  ) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: []
      };
    }

    try {
      const limitNumber = parseInt(limit) || 50;
      const logs = await this.academyService.getTrainingLogs(teamId, limitNumber);
      
      return {
        success: true,
        data: logs,
        count: logs.length
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
   * Buscar estatísticas da academia
   * GET /api/v2/academy/stats?teamId=...
   */
  @Get('stats')
  async getAcademyStats(@Query('teamId') teamId: string) {
    if (!teamId) {
      return {
        success: false,
        error: 'teamId é obrigatório',
        data: null
      };
    }

    try {
      const players = await this.academyService.getAcademyPlayers(teamId);
      
      // Calcular estatísticas
      const stats = {
        totalPlayers: players.length,
        youthPlayers: players.filter(p => p.type === 'youth').length,
        professionalPlayers: players.filter(p => p.type === 'professional').length,
        averageAge: Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length),
        averageOverall: Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length),
        averagePotential: Math.round(players.reduce((sum, p) => sum + p.potential, 0) / players.length),
        playersInAcademy: players.filter(p => p.is_in_academy).length,
        trainingFocusDistribution: this.getTrainingFocusDistribution(players),
        intensityDistribution: this.getIntensityDistribution(players)
      };
      
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

  /**
   * Buscar detalhes de um jogador específico
   * GET /api/v2/academy/player-details/:playerId?teamId=...
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
      const result = await this.academyService.getPlayerDetails(playerId, teamId);
      
      return {
        success: true,
        data: result,
        message: 'Detalhes do jogador carregados com sucesso'
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
   * Calcular distribuição de foco de treinamento
   */
  private getTrainingFocusDistribution(players: any[]) {
    const distribution: any = {};
    players.forEach(player => {
      const focus = player.training_focus || 'PAS';
      distribution[focus] = (distribution[focus] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calcular distribuição de intensidade de treinamento
   */
  private getIntensityDistribution(players: any[]) {
    const distribution: any = {};
    players.forEach(player => {
      const intensity = player.training_intensity || 'normal';
      distribution[intensity] = (distribution[intensity] || 0) + 1;
    });
    return distribution;
  }
}
