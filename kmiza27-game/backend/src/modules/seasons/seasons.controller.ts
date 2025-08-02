import { Controller, Get, Post, Query, Body, Param, Logger } from '@nestjs/common';
import { SeasonsService } from './seasons.service';

@Controller('api/v2/seasons')
export class SeasonsController {
  private readonly logger = new Logger(SeasonsController.name);

  constructor(private readonly seasonsService: SeasonsService) {}

  /**
   * Inicializar temporada para um usuário
   * POST /api/v2/seasons/initialize
   */
  @Post('initialize')
  async initializeUserSeason(@Body() body: { userId: string; teamId: string; seasonYear?: number }) {
    try {
      const { userId, teamId, seasonYear } = body;

      if (!userId || !teamId) {
        throw new Error('userId e teamId são obrigatórios');
      }

      this.logger.log(`🏁 Inicializando temporada para usuário ${userId}, time ${teamId}`);

      const season = await this.seasonsService.initializeUserSeason(
        userId, 
        teamId, 
        seasonYear || new Date().getFullYear()
      );

      return {
        success: true,
        data: season,
        message: `Temporada ${season.season_info.season_year} inicializada na ${season.season_info.tier_name}`
      };
    } catch (error) {
      this.logger.error('Error in initializeUserSeason:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar progresso atual do usuário
   * GET /api/v2/seasons/progress?userId=123&seasonYear=2025
   */
  @Get('progress')
  async getUserCurrentProgress(@Query('userId') userId: string, @Query('seasonYear') seasonYear?: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const year = seasonYear ? parseInt(seasonYear) : new Date().getFullYear();

      this.logger.log(`📊 Buscando progresso do usuário ${userId} na temporada ${year}`);

      const progress = await this.seasonsService.getUserCurrentProgress(userId, year);

      if (!progress) {
        return {
          success: false,
          error: 'Usuário não tem temporada ativa',
          data: null
        };
      }

      return {
        success: true,
        data: progress,
        meta: {
          season_year: year,
          tier_name: `Série ${this.getTierName(progress.current_tier)}`
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserCurrentProgress:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar próximas partidas do usuário
   * GET /api/v2/seasons/matches/upcoming?userId=123&limit=5
   */
  @Get('matches/upcoming')
  async getUserUpcomingMatches(@Query('userId') userId: string, @Query('limit') limit?: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const matchLimit = limit ? parseInt(limit) : 5;

      this.logger.log(`📅 Buscando ${matchLimit} próximas partidas do usuário ${userId}`);

      const matches = await this.seasonsService.getUserUpcomingMatches(userId, matchLimit);

      return {
        success: true,
        data: matches,
        meta: {
          total_matches: matches.length,
          limit: matchLimit
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserUpcomingMatches:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar partidas recentes do usuário
   * GET /api/v2/seasons/matches/recent?userId=123&limit=5
   */
  @Get('matches/recent')
  async getUserRecentMatches(@Query('userId') userId: string, @Query('limit') limit?: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const matchLimit = limit ? parseInt(limit) : 5;

      this.logger.log(`📈 Buscando ${matchLimit} partidas recentes do usuário ${userId}`);

      const matches = await this.seasonsService.getUserRecentMatches(userId, matchLimit);

      return {
        success: true,
        data: matches,
        meta: {
          total_matches: matches.length,
          limit: matchLimit
        }
      };
    } catch (error) {
      this.logger.error('Error in getUserRecentMatches:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar resumo completo da temporada
   * GET /api/v2/seasons/summary?userId=123&seasonYear=2025
   */
  @Get('summary')
  async getSeasonSummary(@Query('userId') userId: string, @Query('seasonYear') seasonYear?: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const year = seasonYear ? parseInt(seasonYear) : new Date().getFullYear();

      this.logger.log(`📋 Buscando resumo da temporada ${year} para usuário ${userId}`);

      const summary = await this.seasonsService.getSeasonSummary(userId, year);

      return {
        success: true,
        data: summary,
        meta: {
          season_year: year,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error in getSeasonSummary:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Verificar se temporada está ativa
   * GET /api/v2/seasons/status?userId=123&seasonYear=2025
   */
  @Get('status')
  async isSeasonActive(@Query('userId') userId: string, @Query('seasonYear') seasonYear?: string) {
    const year = seasonYear ? parseInt(seasonYear) : new Date().getFullYear();
    
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`🔍 Verificando status da temporada ${year} para usuário ${userId}`);

      const isActive = await this.seasonsService.isSeasonActive(userId, year);

      return {
        success: true,
        data: {
          is_active: isActive,
          season_year: year,
          status: isActive ? 'active' : 'inactive'
        }
      };
    } catch (error) {
      this.logger.error('Error in isSeasonActive:', error);
      return {
        success: false,
        error: error.message,
        data: { is_active: false, season_year: year, status: 'error' }
      };
    }
  }

  /**
   * Recalcular classificação do usuário
   * POST /api/v2/seasons/recalculate-standings
   */
  @Post('recalculate-standings')
  async recalculateUserStandings(@Body() body: { userId: string; seasonYear?: number }) {
    try {
      const { userId, seasonYear } = body;

      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      const year = seasonYear || new Date().getFullYear();

      this.logger.log(`🔄 Recalculando classificação da temporada ${year} para usuário ${userId}`);

      const updatedProgress = await this.seasonsService.recalculateUserStandings(userId, year);

      return {
        success: true,
        data: updatedProgress,
        message: 'Classificação recalculada com sucesso'
      };
    } catch (error) {
      this.logger.error('Error in recalculateUserStandings:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Gerar novo calendário para temporada existente
   * POST /api/v2/seasons/generate-calendar
   */
  @Post('generate-calendar')
  async generateSeasonCalendar(@Body() body: { userId: string; teamId: string; tier: number; seasonYear?: number }) {
    try {
      const { userId, teamId, tier, seasonYear } = body;

      if (!userId || !teamId || !tier) {
        throw new Error('userId, teamId e tier são obrigatórios');
      }

      if (tier < 1 || tier > 4) {
        throw new Error('tier deve ser entre 1 e 4');
      }

      const year = seasonYear || new Date().getFullYear();

      this.logger.log(`📅 Gerando calendário da temporada ${year} para usuário ${userId} na Série ${this.getTierName(tier)}`);

      const calendar = await this.seasonsService.generateSeasonCalendar(userId, teamId, tier, year);

      return {
        success: true,
        data: calendar,
        message: `Calendário gerado: ${calendar.matches.length} partidas criadas`
      };
    } catch (error) {
      this.logger.error('Error in generateSeasonCalendar:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar histórico de temporadas do usuário
   * GET /api/v2/seasons/history?userId=123
   */
  @Get('history')
  async getUserSeasonHistory(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`📜 Buscando histórico de temporadas do usuário ${userId}`);

      // Por enquanto retorna vazio, mas pode ser implementado depois
      const history = [];

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
}