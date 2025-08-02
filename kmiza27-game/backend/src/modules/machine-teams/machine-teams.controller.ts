import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { MachineTeamsService } from './machine-teams.service';

@Controller('api/v2/machine-teams')
export class MachineTeamsController {
  private readonly logger = new Logger(MachineTeamsController.name);

  constructor(private readonly machineTeamsService: MachineTeamsService) {}

  /**
   * Buscar times da máquina por série
   * GET /api/v2/machine-teams/by-tier?tier=4
   */
  @Get('by-tier')
  async getMachineTeamsByTier(@Query('tier') tier: string) {
    try {
      const tierNumber = parseInt(tier);
      
      if (!tierNumber || tierNumber < 1 || tierNumber > 4) {
        throw new Error('Tier deve ser um número entre 1 e 4');
      }

      this.logger.log(`🤖 Requisição para times da máquina da Série ${tier}`);
      
      const teams = await this.machineTeamsService.getMachineTeamsByTier(tierNumber);
      
      return {
        success: true,
        data: teams,
        meta: {
          tier: tierNumber,
          tier_name: `Série ${this.getTierName(tierNumber)}`,
          total_teams: teams.length,
          expected_teams: 19
        }
      };
    } catch (error) {
      this.logger.error('Error in getMachineTeamsByTier:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Buscar time da máquina específico
   * GET /api/v2/machine-teams/:id
   */
  @Get(':id')
  async getMachineTeamById(@Param('id') id: string) {
    try {
      this.logger.log(`🤖 Requisição para time da máquina ID: ${id}`);
      
      const team = await this.machineTeamsService.getMachineTeamById(id);
      
      if (!team) {
        return {
          success: false,
          error: 'Time da máquina não encontrado',
          data: null
        };
      }
      
      return {
        success: true,
        data: team
      };
    } catch (error) {
      this.logger.error('Error in getMachineTeamById:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar estatísticas dos times da máquina por série
   * GET /api/v2/machine-teams/stats?tier=4
   */
  @Get('stats/by-tier')
  async getMachineTeamsStats(@Query('tier') tier: string) {
    try {
      const tierNumber = parseInt(tier);
      
      if (!tierNumber || tierNumber < 1 || tierNumber > 4) {
        throw new Error('Tier deve ser um número entre 1 e 4');
      }

      this.logger.log(`📊 Requisição para estatísticas da Série ${tier}`);
      
      const stats = await this.machineTeamsService.getMachineTeamsStats(tierNumber);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      this.logger.error('Error in getMachineTeamsStats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar todos os times da máquina organizados por série
   * GET /api/v2/machine-teams/all-series
   */
  @Get('all-series')
  async getAllMachineTeamsBySeries() {
    try {
      this.logger.log('📋 Requisição para todos os times da máquina por série');
      
      const allSeries = await this.machineTeamsService.getAllMachineTeamsBySeries();
      
      return {
        success: true,
        data: allSeries,
        meta: {
          total_series: 4,
          expected_total_teams: 76
        }
      };
    } catch (error) {
      this.logger.error('Error in getAllMachineTeamsBySeries:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Verificar integridade do sistema de times da máquina
   * GET /api/v2/machine-teams/admin/validate
   */
  @Get('admin/validate')
  async validateMachineTeamsIntegrity() {
    try {
      this.logger.log('🔍 Requisição de validação do sistema de times da máquina');
      
      const validation = await this.machineTeamsService.validateMachineTeamsIntegrity();
      
      return {
        success: true,
        data: validation,
        meta: {
          validation_date: new Date().toISOString(),
          system_status: validation.summary?.system_complete ? 'complete' : 'incomplete'
        }
      };
    } catch (error) {
      this.logger.error('Error in validateMachineTeamsIntegrity:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Buscar times da máquina para temporada de um usuário
   * GET /api/v2/machine-teams/season?tier=4&userId=123
   */
  @Get('season/opponents')
  async getMachineTeamsForSeason(@Query('tier') tier: string, @Query('userId') userId: string) {
    try {
      const tierNumber = parseInt(tier);
      
      if (!tierNumber || tierNumber < 1 || tierNumber > 4) {
        throw new Error('Tier deve ser um número entre 1 e 4');
      }

      if (!userId) {
        throw new Error('userId é obrigatório');
      }

      this.logger.log(`🎯 Requisição de adversários para usuário ${userId} na Série ${tier}`);
      
      const opponents = await this.machineTeamsService.getMachineTeamsForSeason(tierNumber, userId);
      
      return {
        success: true,
        data: opponents,
        meta: {
          tier: tierNumber,
          tier_name: `Série ${this.getTierName(tierNumber)}`,
          user_id: userId,
          total_opponents: opponents.length,
          season_year: new Date().getFullYear()
        }
      };
    } catch (error) {
      this.logger.error('Error in getMachineTeamsForSeason:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Contar times da máquina por status
   * GET /api/v2/machine-teams/admin/count
   */
  @Get('admin/count')
  async getMachineTeamsCount() {
    try {
      this.logger.log('📊 Requisição de contagem de times da máquina');
      
      const count = await this.machineTeamsService.getMachineTeamsCount();
      
      return {
        success: true,
        data: count,
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error in getMachineTeamsCount:', error);
      return {
        success: false,
        error: error.message,
        data: { active: 0, inactive: 0, total: 0 }
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