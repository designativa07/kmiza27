import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class MachineTeamsService {
  private readonly logger = new Logger(MachineTeamsService.name);

  // ===== BUSCAR TIMES DA MÁQUINA =====

  /**
   * Busca todos os times da máquina de uma série específica
   */
  async getMachineTeamsByTier(tier: number) {
    try {
      this.logger.log(`🤖 Buscando times da máquina da Série ${this.getTierName(tier)}...`);

      const { data, error } = await supabase
        .from('game_machine_teams')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`Error fetching machine teams: ${error.message}`);
      }

      this.logger.log(`✅ Encontrados ${data?.length || 0} times da máquina na Série ${this.getTierName(tier)}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting machine teams by tier:', error);
      throw error;
    }
  }

  /**
   * Busca um time da máquina específico por ID
   */
  async getMachineTeamById(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('game_machine_teams')
        .select('*')
        .eq('id', teamId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new Error(`Error fetching machine team: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error getting machine team by id:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas dos times da máquina por série
   */
  async getMachineTeamsStats(tier: number) {
    try {
      const teams = await this.getMachineTeamsByTier(tier);
      
      const stats = {
        total_teams: teams.length,
        tier_name: this.getTierName(tier),
        average_overall: teams.reduce((acc, team) => acc + (team.attributes?.overall || 0), 0) / teams.length,
        strongest_team: teams.reduce((max, team) => 
          (team.attributes?.overall || 0) > (max.attributes?.overall || 0) ? team : max, teams[0]
        ),
        weakest_team: teams.reduce((min, team) => 
          (team.attributes?.overall || 0) < (min.attributes?.overall || 0) ? team : min, teams[0]
        )
      };

      return stats;
    } catch (error) {
      this.logger.error('Error getting machine teams stats:', error);
      throw error;
    }
  }

  // ===== BUSCAR TIMES PARA SIMULAÇÃO =====

  /**
   * Busca times da máquina para gerar calendário de uma temporada
   * Retorna 19 times fixos da série especificada
   */
  async getMachineTeamsForSeason(tier: number, userId: string) {
    try {
      this.logger.log(`🎯 Gerando lista de adversários para usuário ${userId} na Série ${this.getTierName(tier)}`);

      const machineTeams = await this.getMachineTeamsByTier(tier);

      if (machineTeams.length !== 19) {
        this.logger.warn(`⚠️ Série ${this.getTierName(tier)} tem ${machineTeams.length} times, esperado 19`);
      }

      // Retornar todos os 19 times da máquina como adversários fixos
      const opponents = machineTeams.map(team => ({
        id: team.id,
        name: team.name,
        attributes: team.attributes,
        stadium_name: team.stadium_name,
        stadium_capacity: team.stadium_capacity,
        colors: team.colors,
        tier: team.tier,
        is_machine: true
      }));

      this.logger.log(`✅ Lista de ${opponents.length} adversários gerada para a temporada`);
      return opponents;
    } catch (error) {
      this.logger.error('Error getting machine teams for season:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE SIMULAÇÃO =====

  /**
   * Calcula força de um time da máquina para simulação
   */
  calculateMachineTeamStrength(team: any, isHome: boolean = false): number {
    try {
      const attributes = team.attributes || {};
      
      // Calcular força base
      const baseStrength = (
        (attributes.overall || 50) +
        (attributes.attack || 50) +
        (attributes.midfield || 50) +
        (attributes.defense || 50) +
        (attributes.goalkeeper || 50)
      ) / 5;

      // Aplicar bônus de casa se aplicável
      const homeBonus = isHome ? 3 : 0;
      
      // Pequena variação aleatória para evitar resultados idênticos
      const randomVariation = (Math.random() - 0.5) * 4; // -2 a +2

      const finalStrength = baseStrength + homeBonus + randomVariation;
      
      this.logger.debug(`💪 Força do time ${team.name}: ${finalStrength.toFixed(1)} (base: ${baseStrength}, casa: ${homeBonus}, var: ${randomVariation.toFixed(1)})`);
      
      return Math.max(0, finalStrength);
    } catch (error) {
      this.logger.error('Error calculating machine team strength:', error);
      return 50; // Força padrão em caso de erro
    }
  }

  /**
   * Simula comportamento tático de um time da máquina
   */
  getMachineTeamTactics(team: any): any {
    const attributes = team.attributes || {};
    
    // Táticas baseadas nos atributos do time
    let formation = '4-4-2'; // Formação padrão
    let style = 'balanced'; // Estilo padrão

    // Determinar formação baseada nos pontos fortes
    if (attributes.attack > attributes.defense + 5) {
      formation = '4-3-3';
      style = 'attacking';
    } else if (attributes.defense > attributes.attack + 5) {
      formation = '5-4-1';
      style = 'defensive';
    } else if (attributes.midfield > attributes.attack && attributes.midfield > attributes.defense) {
      formation = '4-5-1';
      style = 'possession';
    }

    return {
      formation,
      style,
      aggression: Math.min(100, Math.max(0, 50 + (attributes.defense - 75))),
      possession_focus: Math.min(100, Math.max(0, attributes.midfield - 30)),
      counter_attack: attributes.attack > 80 ? true : false
    };
  }

  // ===== FUNÇÕES UTILITÁRIAS =====

  /**
   * Converte número da série para nome
   */
  private getTierName(tier: number): string {
    const tierNames = {
      1: 'A',
      2: 'B', 
      3: 'C',
      4: 'D'
    };
    return tierNames[tier] || 'Desconhecida';
  }

  /**
   * Verifica se o sistema de times da máquina está íntegro
   */
  async validateMachineTeamsIntegrity(): Promise<any> {
    try {
      this.logger.log('🔍 Verificando integridade dos times da máquina...');

      const results = {};

      // Verificar cada série
      for (let tier = 1; tier <= 4; tier++) {
        const teams = await this.getMachineTeamsByTier(tier);
        
        results[`serie_${this.getTierName(tier)}`] = {
          expected_teams: 19,
          actual_teams: teams.length,
          is_complete: teams.length === 19,
          teams_list: teams.map(t => ({ id: t.id, name: t.name, overall: t.attributes?.overall }))
        };
      }

      // Verificar total geral
      const totalTeams = Object.values(results).reduce((acc: number, serie: any) => acc + serie.actual_teams, 0);
      
      results['summary'] = {
        total_machine_teams: totalTeams,
        expected_total: 76, // 19 x 4 séries
        system_complete: totalTeams === 76,
        all_series_complete: Object.values(results).every((serie: any) => serie.is_complete)
      };

      this.logger.log(`✅ Verificação concluída: ${totalTeams}/76 times cadastrados`);
      
      return results;
    } catch (error) {
      this.logger.error('Error validating machine teams integrity:', error);
      throw error;
    }
  }

  /**
   * Lista todos os times da máquina organizados por série
   */
  async getAllMachineTeamsBySeries(): Promise<any> {
    try {
      const allSeries = {};

      for (let tier = 1; tier <= 4; tier++) {
        const teams = await this.getMachineTeamsByTier(tier);
        allSeries[`serie_${this.getTierName(tier)}`] = {
          tier,
          name: `Série ${this.getTierName(tier)}`,
          teams: teams.map(team => ({
            id: team.id,
            name: team.name,
            overall: team.attributes?.overall || 0,
            stadium: team.stadium_name,
            capacity: team.stadium_capacity,
            colors: team.colors
          }))
        };
      }

      return allSeries;
    } catch (error) {
      this.logger.error('Error getting all machine teams by series:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES ADMINISTRATIVAS =====

  /**
   * Reativa times da máquina desativados (uso administrativo)
   */
  async reactivateAllMachineTeams(): Promise<void> {
    try {
      this.logger.log('🔧 Reativando todos os times da máquina...');

      const { error } = await supabase
        .from('game_machine_teams')
        .update({ is_active: true })
        .eq('is_active', false);

      if (error) {
        throw new Error(`Error reactivating machine teams: ${error.message}`);
      }

      this.logger.log('✅ Todos os times da máquina foram reativados');
    } catch (error) {
      this.logger.error('Error reactivating machine teams:', error);
      throw error;
    }
  }

  /**
   * Conta times da máquina por status
   */
  async getMachineTeamsCount(): Promise<any> {
    try {
      const { data: activeTeams, error: activeError } = await supabase
        .from('game_machine_teams')
        .select('id')
        .eq('is_active', true);

      const { data: inactiveTeams, error: inactiveError } = await supabase
        .from('game_machine_teams')
        .select('id')
        .eq('is_active', false);

      if (activeError || inactiveError) {
        throw new Error('Error counting machine teams');
      }

      return {
        active: activeTeams?.length || 0,
        inactive: inactiveTeams?.length || 0,
        total: (activeTeams?.length || 0) + (inactiveTeams?.length || 0)
      };
    } catch (error) {
      this.logger.error('Error getting machine teams count:', error);
      throw error;
    }
  }
}