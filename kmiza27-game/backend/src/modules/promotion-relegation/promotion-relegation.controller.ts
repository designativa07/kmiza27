import { Controller, Get, Post, Query, Body, Param, Logger } from '@nestjs/common';
import { PromotionRelegationService } from './promotion-relegation.service';

@Controller('promotion-relegation')
export class PromotionRelegationController {
  private readonly logger = new Logger(PromotionRelegationController.name);

  constructor(private readonly promotionRelegationService: PromotionRelegationService) {}

  /**
   * Processar fim de temporada para um usuário
   * POST /api/v2/promotion-relegation/process-season-end
   */
  @Post('process-season-end')
  async processSeasonEnd(@Body() body: { userId: string; seasonYear?: number }) {
    try {
      const { userId, seasonYear } = body;

      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const year = seasonYear || new Date().getFullYear();

      this.logger.log(`🏁 Processando fim de temporada ${year} para usuário ${userId}`);

      const result = await this.promotionRelegationService.processSeasonEnd(userId, year);

      return {
        success: true,
        data: result,
        message: result.message
      };
    } catch (error) {
      this.logger.error('Error in processSeasonEnd:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Verificar se temporada pode ser finalizada
   * GET /api/v2/promotion-relegation/can-finish?userId=123&seasonYear=2025
   */
  @Get('can-finish')
  async canFinishSeason(@Query('userId') userId: string, @Query('seasonYear') seasonYear?: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const year = seasonYear ? parseInt(seasonYear) : new Date().getFullYear();

      this.logger.log(`🔍 Verificando se temporada ${year} pode ser finalizada para usuário ${userId}`);

      const canFinish = await this.promotionRelegationService.canFinishSeason(userId, year);

      return {
        success: true,
        data: {
          can_finish: canFinish,
          season_year: year,
          user_id: userId
        }
      };
    } catch (error) {
      this.logger.error('Error in canFinishSeason:', error);
      return {
        success: false,
        error: error.message,
        data: { can_finish: false }
      };
    }
  }

  /**
   * Buscar histórico de temporadas do usuário
   * GET /api/v2/promotion-relegation/history?userId=123
   */
  @Get('history')
  async getUserSeasonHistory(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`📜 Buscando histórico de temporadas para usuário ${userId}`);

      const history = await this.promotionRelegationService.getUserSeasonHistory(userId);

      return {
        success: true,
        data: history,
        meta: {
          total_seasons: history.length,
          user_id: userId
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserSeasonHistory:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar estatísticas de carreira do usuário
   * GET /api/v2/promotion-relegation/career-stats?userId=123
   */
  @Get('career-stats')
  async getUserCareerStats(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`📊 Calculando estatísticas de carreira para usuário ${userId}`);

      const stats = await this.promotionRelegationService.getUserCareerStats(userId);

      return {
        success: true,
        data: stats,
        meta: {
          user_id: userId,
          calculated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserCareerStats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Forçar promoção (uso administrativo)
   * POST /api/v2/promotion-relegation/admin/force-promotion
   */
  @Post('admin/force-promotion')
  async forcePromotion(@Body() body: { userId: string; targetTier: number; seasonYear?: number }) {
    try {
      const { userId, targetTier, seasonYear } = body;

      if (!userId || !targetTier) {
        throw new Error('userId e targetTier são obrigatórios');
      }

      if (targetTier < 1 || targetTier > 4) {
        throw new Error('targetTier deve ser entre 1 e 4');
      }

      const year = seasonYear || new Date().getFullYear();

      this.logger.log(`🔧 ADMIN: Forçando promoção do usuário ${userId} para Série ${this.getTierName(targetTier)}`);

      const result = await this.promotionRelegationService.forcePromotion(userId, targetTier, year);

      return {
        success: true,
        data: result,
        message: `Promoção forçada para Série ${this.getTierName(targetTier)} concluída`
      };
    } catch (error) {
      this.logger.error('Error in forcePromotion:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Simular resultado de fim de temporada baseado na posição
   * POST /api/v2/promotion-relegation/simulate-result
   */
  @Post('simulate-result')
  async simulateSeasonResult(@Body() body: { currentTier: number; position: number }) {
    try {
      const { currentTier, position } = body;

      if (!currentTier || !position) {
        throw new Error('currentTier e position são obrigatórios');
      }

      if (currentTier < 1 || currentTier > 4) {
        throw new Error('currentTier deve ser entre 1 e 4');
      }

      if (position < 1 || position > 20) {
        throw new Error('position deve ser entre 1 e 20');
      }

      this.logger.log(`🎯 Simulando resultado para Série ${this.getTierName(currentTier)}, posição ${position}`);

      // Lógica simplificada do resultado
      let result = 'stayed';
      let nextTier = currentTier;
      let description = `Permanece na Série ${this.getTierName(currentTier)}`;

      // Promoção (posições 1-4)
      if (position >= 1 && position <= 4 && currentTier > 1) {
        result = 'promoted';
        nextTier = currentTier - 1;
        description = `Promovido para Série ${this.getTierName(nextTier)}`;
      }
      // Rebaixamento (posições 17-20)
      else if (position >= 17 && position <= 20 && currentTier < 4) {
        result = 'relegated';
        nextTier = currentTier + 1;
        description = `Rebaixado para Série ${this.getTierName(nextTier)}`;
      }

      const simulationResult = {
        current_tier: currentTier,
        position: position,
        result: result,
        next_tier: nextTier,
        description: description,
        message: this.getResultMessage(result, nextTier)
      };

      return {
        success: true,
        data: simulationResult
      };
    } catch (error) {
      this.logger.error('Error in simulateSeasonResult:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar regras de promoção/rebaixamento
   * GET /api/v2/promotion-relegation/rules
   */
  @Get('rules')
  async getPromotionRelegationRules() {
    try {
      const rules = {
        serie_a: {
          tier: 1,
          name: 'Série A',
          promotion_spots: 0,
          relegation_spots: 4,
          relegation_positions: [17, 18, 19, 20],
          description: 'Elite do futebol. Apenas rebaixamento para Série B.'
        },
        serie_b: {
          tier: 2,
          name: 'Série B',
          promotion_spots: 4,
          relegation_spots: 4,
          promotion_positions: [1, 2, 3, 4],
          relegation_positions: [17, 18, 19, 20],
          description: 'Segunda divisão. Promoção para Série A e rebaixamento para Série C.'
        },
        serie_c: {
          tier: 3,
          name: 'Série C',
          promotion_spots: 4,
          relegation_spots: 4,
          promotion_positions: [1, 2, 3, 4],
          relegation_positions: [17, 18, 19, 20],
          description: 'Terceira divisão. Promoção para Série B e rebaixamento para Série D.'
        },
        serie_d: {
          tier: 4,
          name: 'Série D',
          promotion_spots: 4,
          relegation_spots: 0,
          promotion_positions: [1, 2, 3, 4],
          description: 'Porta de entrada. Apenas promoção para Série C.'
        }
      };

      return {
        success: true,
        data: rules,
        meta: {
          total_series: 4,
          system: 'elifoot-style'
        }
      };
    } catch (error) {
      this.logger.error('Error in getPromotionRelegationRules:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  // ===== FUNÇÕES UTILITÁRIAS =====

  private getTierName(tier: number): string {
    const tierNames = {
      1: 'A',
      2: 'B', 
      3: 'C',
      4: 'D'
    };
    return tierNames[tier] || 'Desconhecida';
  }

  private getResultMessage(result: string, nextTier: number): string {
    switch (result) {
      case 'promoted':
        return `🎉 PARABÉNS! Promovido para a Série ${this.getTierName(nextTier)}!`;
      case 'relegated':
        return `😔 Rebaixado para a Série ${this.getTierName(nextTier)}. Lute para voltar!`;
      case 'stayed':
        return `📍 Permanece na Série ${this.getTierName(nextTier)}. Continue trabalhando!`;
      default:
        return 'Temporada finalizada.';
    }
  }
}