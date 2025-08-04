import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { SeasonsService } from '../seasons/seasons.service';

@Injectable()
export class PromotionRelegationService {
  private readonly logger = new Logger(PromotionRelegationService.name);

  constructor(private readonly seasonsService: SeasonsService) {}

  // ===== SISTEMA DE PROMOÇÃO/REBAIXAMENTO =====

  /**
   * Processar fim de temporada para um usuário
   * Determina se o usuário foi promovido, rebaixado ou permanece na série
   */
  async processSeasonEnd(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      this.logger.log(`🏁 Processando fim de temporada ${seasonYear} para usuário ${userId}`);

      // Buscar progresso atual do usuário
      const progress = await this.seasonsService.getUserCurrentProgress(userId, seasonYear);
      
      if (!progress || progress.season_status !== 'active') {
        throw new Error('Usuário não tem temporada ativa para processar');
      }

      // Recalcular classificação final
      await this.seasonsService.recalculateUserStandings(userId, seasonYear);
      
      // Buscar progresso atualizado
      const updatedProgress = await this.seasonsService.getUserCurrentProgress(userId, seasonYear);
      
      if (!updatedProgress) {
        throw new Error('Erro ao buscar progresso atualizado');
      }

      // Determinar resultado da temporada
      const seasonResult = this.determineSeasonResult(updatedProgress);
      
      // Salvar no histórico
      await this.saveSeasonHistory(userId, updatedProgress, seasonResult);
      
      // Processar mudança de série se necessário
      await this.processSeriesChange(userId, updatedProgress, seasonResult);
      
      this.logger.log(`🎉 Fim de temporada processado: ${seasonResult.result}`);
      
      return {
        season_result: seasonResult,
        final_position: updatedProgress.position,
        final_points: updatedProgress.points,
        games_played: updatedProgress.games_played,
        next_tier: seasonResult.next_tier,
        message: this.getSeasonEndMessage(seasonResult)
      };
    } catch (error) {
      this.logger.error('Error processing season end:', error);
      throw error;
    }
  }

  /**
   * Determinar resultado da temporada baseado na posição final
   */
  private determineSeasonResult(progress: any) {
    const currentTier = progress.current_tier;
    const position = progress.position;
    
    // Série A (Tier 1) - Só pode ser rebaixado
    if (currentTier === 1) {
      if (position >= 17 && position <= 20) {
        return {
          result: 'relegated',
          current_tier: 1,
          next_tier: 2,
          description: 'Rebaixado para Série B'
        };
      } else {
        return {
          result: 'stayed',
          current_tier: 1,
          next_tier: 1,
          description: 'Permanece na Série A'
        };
      }
    }
    
    // Série B (Tier 2) - Pode ser promovido ou rebaixado
    if (currentTier === 2) {
      if (position >= 1 && position <= 4) {
        return {
          result: 'promoted',
          current_tier: 2,
          next_tier: 1,
          description: 'Promovido para Série A'
        };
      } else if (position >= 17 && position <= 20) {
        return {
          result: 'relegated',
          current_tier: 2,
          next_tier: 3,
          description: 'Rebaixado para Série C'
        };
      } else {
        return {
          result: 'stayed',
          current_tier: 2,
          next_tier: 2,
          description: 'Permanece na Série B'
        };
      }
    }
    
    // Série C (Tier 3) - Pode ser promovido ou rebaixado
    if (currentTier === 3) {
      if (position >= 1 && position <= 4) {
        return {
          result: 'promoted',
          current_tier: 3,
          next_tier: 2,
          description: 'Promovido para Série B'
        };
      } else if (position >= 17 && position <= 20) {
        return {
          result: 'relegated',
          current_tier: 3,
          next_tier: 4,
          description: 'Rebaixado para Série D'
        };
      } else {
        return {
          result: 'stayed',
          current_tier: 3,
          next_tier: 3,
          description: 'Permanece na Série C'
        };
      }
    }
    
    // Série D (Tier 4) - Só pode ser promovido
    if (currentTier === 4) {
      if (position >= 1 && position <= 4) {
        return {
          result: 'promoted',
          current_tier: 4,
          next_tier: 3,
          description: 'Promovido para Série C'
        };
      } else {
        return {
          result: 'stayed',
          current_tier: 4,
          next_tier: 4,
          description: 'Permanece na Série D'
        };
      }
    }
    
    // Fallback - permanece na série atual
    return {
      result: 'stayed',
      current_tier: currentTier,
      next_tier: currentTier,
      description: `Permanece na Série ${this.getTierName(currentTier)}`
    };
  }

  /**
   * Salvar resultado da temporada no histórico
   */
  private async saveSeasonHistory(userId: string, progress: any, seasonResult: any) {
    try {
      this.logger.log('📜 Salvando temporada no histórico');

      const historyData = {
        user_id: userId,
        team_id: progress.team_id,
        season_year: progress.season_year,
        tier: progress.current_tier,
        final_position: progress.position,
        final_points: progress.points,
        result: seasonResult.result
      };

      const { error } = await supabase
        .from('game_season_history')
        .insert(historyData);

      if (error) {
        this.logger.error('Error saving season history:', error);
      } else {
        this.logger.log('✅ Temporada salva no histórico');
      }
    } catch (error) {
      this.logger.error('Error in saveSeasonHistory:', error);
    }
  }

  /**
   * Processar mudança de série (promoção/rebaixamento)
   */
  private async processSeriesChange(userId: string, progress: any, seasonResult: any) {
    try {
      if (seasonResult.result === 'stayed') {
        this.logger.log('📍 Usuário permanece na mesma série, apenas resetando temporada');
        
        // Resetar progresso para nova temporada na mesma série
        await this.resetProgressForNewSeason(userId, progress.team_id, seasonResult.next_tier, progress.season_year + 1);
        return;
      }

      this.logger.log(`🔄 Processando mudança: ${seasonResult.description}`);

      // Marcar temporada atual como finalizada
      await this.finishCurrentSeason(userId, progress.team_id, progress.season_year);

      // Criar nova temporada na nova série
      await this.createNewSeasonInNewTier(userId, progress.team_id, seasonResult.next_tier, progress.season_year + 1);

      this.logger.log(`✅ Mudança processada: agora na Série ${this.getTierName(seasonResult.next_tier)}`);
    } catch (error) {
      this.logger.error('Error processing series change:', error);
      throw error;
    }
  }

  /**
   * Finalizar temporada atual
   */
  private async finishCurrentSeason(userId: string, teamId: string, seasonYear: number) {
    try {
      const { error } = await supabase
        .from('game_user_competition_progress')
        .update({ season_status: 'finished' })
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('season_year', seasonYear);

      if (error) {
        throw new Error(`Error finishing current season: ${error.message}`);
      }

      this.logger.log('✅ Temporada atual finalizada');
    } catch (error) {
      this.logger.error('Error finishing current season:', error);
      throw error;
    }
  }

  /**
   * Criar nova temporada na nova série
   */
  private async createNewSeasonInNewTier(userId: string, teamId: string, newTier: number, seasonYear: number) {
    try {
      this.logger.log(`🆕 Criando nova temporada na Série ${this.getTierName(newTier)}`);

      // Usar o SeasonsService para inicializar a nova temporada com o tier correto
      await this.seasonsService.initializeUserSeason(userId, teamId, seasonYear, newTier);

      // Criar estatísticas zeradas para os times da máquina da nova série
      await this.createZeroStatsForMachineTeams(userId, newTier, seasonYear);

      this.logger.log(`✅ Nova temporada criada na Série ${this.getTierName(newTier)}`);
    } catch (error) {
      this.logger.error('Error creating new season in new tier:', error);
      throw error;
    }
  }

  /**
   * Criar estatísticas zeradas para todos os times da máquina da série
   */
  private async createZeroStatsForMachineTeams(userId: string, tier: number, seasonYear: number) {
    try {
      this.logger.log(`📊 Criando estatísticas zeradas para usuário ${userId} na Série ${this.getTierName(tier)}`);
      
      // Buscar todos os times da máquina da série
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_machine_teams')
        .select('id, name')
        .eq('tier', tier)
        .eq('is_active', true);
      
      if (teamsError) {
        throw new Error(`Erro ao buscar times da máquina: ${teamsError.message}`);
      }
      
      if (!machineTeams || machineTeams.length === 0) {
        this.logger.warn(`⚠️ Nenhum time da máquina encontrado para Série ${this.getTierName(tier)}`);
        return;
      }
      
      this.logger.log(`🔍 Encontrados ${machineTeams.length} times da máquina para criar estatísticas zeradas`);
      
      let created = 0;
      let existing = 0;
      
      // Criar estatísticas zeradas para cada time da máquina
      for (const team of machineTeams) {
        const { data, error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert({
            user_id: userId,
            team_id: team.id,
            team_name: team.name,
            season_year: seasonYear,
            tier: tier,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          })
          .select();
        
        if (insertError) {
          if (insertError.code === '23505') {
            // Registro já existe
            existing++;
            this.logger.log(`   ⚠️ ${team.name} - estatísticas já existem`);
          } else {
            this.logger.error(`   ❌ ${team.name} - erro:`, insertError.message);
          }
        } else {
          created++;
          this.logger.log(`   ✅ ${team.name} - estatísticas zeradas criadas`);
        }
      }
      
      this.logger.log(`📊 ${created} estatísticas criadas, ${existing} já existiam`);
      
    } catch (error) {
      this.logger.error('❌ Erro ao criar estatísticas zeradas:', error);
      // Não falhar a criação da temporada se isso der erro
    }
  }

  /**
   * Resetar progresso para nova temporada na mesma série
   */
  private async resetProgressForNewSeason(userId: string, teamId: string, tier: number, seasonYear: number) {
    try {
      this.logger.log(`🔄 Resetando progresso para nova temporada na Série ${this.getTierName(tier)}`);

      // Marcar temporada atual como finalizada
      await this.finishCurrentSeason(userId, teamId, seasonYear - 1);

      // Criar nova temporada na mesma série
      await this.seasonsService.initializeUserSeason(userId, teamId, seasonYear, tier);

      this.logger.log('✅ Progresso resetado para nova temporada');
    } catch (error) {
      this.logger.error('Error resetting progress for new season:', error);
      throw error;
    }
  }

  // ===== CONSULTAS E UTILITÁRIOS =====

  /**
   * Verificar automaticamente se temporada deve ser finalizada
   */
  async checkAndProcessSeasonEnd(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      const canFinish = await this.canFinishSeason(userId, seasonYear);
      
      if (canFinish) {
        this.logger.log(`🏁 AUTO: Temporada ${seasonYear} pode ser finalizada para usuário ${userId}`);
        
        // Processar automaticamente o fim de temporada
        const result = await this.processSeasonEnd(userId, seasonYear);
        
        this.logger.log(`✅ AUTO: Fim de temporada processado automaticamente`);
        return result;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error in auto season end check:', error);
      throw error;
    }
  }

  /**
   * Verificar se temporada pode ser finalizada
   */
  async canFinishSeason(userId: string, seasonYear: number = new Date().getFullYear()): Promise<boolean> {
    try {
      // Verificar se todas as partidas foram jogadas
      const { data: matches, error } = await supabase
        .from('game_season_matches')
        .select('status')
        .eq('user_id', userId)
        .eq('season_year', seasonYear);

      if (error || !matches) {
        return false;
      }

      // Verificar se todas as partidas foram finalizadas
      const finishedMatches = matches.filter(m => m.status === 'finished').length;
      const totalMatches = matches.length;
      const allMatchesFinished = finishedMatches === totalMatches && totalMatches > 0;

      if (!allMatchesFinished) {
        return false;
      }

      // Verificar se o usuário está em posição de promoção ou rebaixamento
      const progress = await this.seasonsService.getUserCurrentProgress(userId, seasonYear);
      if (!progress) {
        return false;
      }

      const currentTier = progress.current_tier;
      const position = progress.position;

      // Verificar se está em posição de promoção (1-4) ou rebaixamento (17-20)
      const inPromotionZone = position >= 1 && position <= 4;
      const inRelegationZone = position >= 17 && position <= 20;
      const canBePromoted = currentTier > 1; // Série A não pode ser promovida
      const canBeRelegated = currentTier < 4; // Série D não pode ser rebaixada

      // Temporada pode ser finalizada se:
      // 1. Todas as partidas foram jogadas
      // 2. E o usuário está em posição de promoção OU rebaixamento
      const canFinish = (inPromotionZone && canBePromoted) || (inRelegationZone && canBeRelegated);

      this.logger.log(`🔍 Verificação fim de temporada para usuário ${userId}: posição ${position}, série ${currentTier}, pode finalizar: ${canFinish}`);

      return canFinish;
    } catch (error) {
      this.logger.error('Error checking if season can be finished:', error);
      return false;
    }
  }

  /**
   * Buscar histórico de temporadas do usuário
   */
  async getUserSeasonHistory(userId: string) {
    try {
      const { data: history, error } = await supabase
        .from('game_season_history')
        .select(`
          *,
          team:game_teams(name, colors)
        `)
        .eq('user_id', userId)
        .order('season_year', { ascending: false });

      if (error) {
        throw new Error(`Error fetching season history: ${error.message}`);
      }

      return history || [];
    } catch (error) {
      this.logger.error('Error getting user season history:', error);
      throw error;
    }
  }

  /**
   * Calcular estatísticas de carreira do usuário
   */
  async getUserCareerStats(userId: string) {
    try {
      const history = await this.getUserSeasonHistory(userId);
      
      if (history.length === 0) {
        return {
          total_seasons: 0,
          promotions: 0,
          relegations: 0,
          stays: 0,
          highest_tier: null,
          lowest_tier: null,
          best_position: null,
          total_points: 0
        };
      }

      const stats = {
        total_seasons: history.length,
        promotions: history.filter(h => h.result === 'promoted').length,
        relegations: history.filter(h => h.result === 'relegated').length,
        stays: history.filter(h => h.result === 'stayed').length,
        highest_tier: Math.min(...history.map(h => h.tier)),
        lowest_tier: Math.max(...history.map(h => h.tier)),
        best_position: Math.min(...history.map(h => h.final_position)),
        total_points: history.reduce((acc, h) => acc + (h.final_points || 0), 0)
      };

      return stats;
    } catch (error) {
      this.logger.error('Error calculating career stats:', error);
      throw error;
    }
  }

  /**
   * Gerar mensagem do fim de temporada
   */
  private getSeasonEndMessage(seasonResult: any): string {
    const messages = {
      promoted: `🎉 PARABÉNS! Você foi promovido para a Série ${this.getTierName(seasonResult.next_tier)}! Prepare-se para adversários mais fortes!`,
      relegated: `😔 Que pena! Você foi rebaixado para a Série ${this.getTierName(seasonResult.next_tier)}. Use esta oportunidade para se fortalecer!`,
      stayed: `📍 Você permanece na Série ${this.getTierName(seasonResult.next_tier)}. Continue trabalhando para conseguir a promoção!`
    };

    return messages[seasonResult.result] || 'Temporada finalizada.';
  }

  private getTierName(tier: number): string {
    const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tierNames[tier] || 'Desconhecida';
  }

  /**
   * Forçar promoção para teste (uso administrativo)
   */
  async forcePromotion(userId: string, targetTier: number, seasonYear: number = new Date().getFullYear()) {
    try {
      this.logger.log(`🔧 ADMIN: Forçando promoção para Série ${this.getTierName(targetTier)}`);

      const progress = await this.seasonsService.getUserCurrentProgress(userId, seasonYear);
      
      if (!progress) {
        throw new Error('Progresso do usuário não encontrado');
      }

      const seasonResult = {
        result: 'promoted',
        current_tier: progress.current_tier,
        next_tier: targetTier,
        description: `Promoção forçada para Série ${this.getTierName(targetTier)}`
      };

      await this.processSeriesChange(userId, progress, seasonResult);

      this.logger.log(`✅ ADMIN: Promoção forçada concluída`);
      return seasonResult;
    } catch (error) {
      this.logger.error('Error forcing promotion:', error);
      throw error;
    }
  }
}