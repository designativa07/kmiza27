import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class TrainingService {
  private readonly logger = new Logger(TrainingService.name);

  /**
   * Buscar jogadores profissionais para treinamento
   */
  async getProfessionalPlayers(teamId: string) {
    try {
      this.logger.log(`🔍 Buscando jogadores profissionais para time ${teamId}`);

      // Buscar jogadores profissionais
      const { data: players, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('team_id', teamId)
        .gt('age', 21)
        .order('age', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('❌ Erro ao buscar jogadores profissionais:', error);
        throw new Error(`Erro ao buscar jogadores profissionais: ${error.message}`);
      }

      // Buscar logs de treinamento recentes para calcular mudanças
      const { data: recentLogs, error: logsError } = await supabase
        .from('game_academy_logs')
        .select('*')
        .eq('team_id', teamId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 7 dias
        .order('created_at', { ascending: false });

      if (logsError) {
        this.logger.warn('⚠️ Erro ao buscar logs recentes:', logsError);
      }

      // Processar jogadores e adicionar informações de evolução
      const processedPlayers = (players || []).map(player => {
        const playerLogs = recentLogs?.filter(log => log.player_id === player.id) || [];
        const recentTraining = playerLogs[0]; // Treinamento mais recente
        
        // Calcular mudanças nos atributos se houver treinamento recente
        let attributeChanges = {};
        if (recentTraining && recentTraining.attribute_gains) {
          attributeChanges = recentTraining.attribute_gains;
        }

        return {
          ...player,
          overall: this.calculateOverall(player),
          attributes: {
            pace: Math.round((player.speed + player.stamina) / 2),
            shooting: player.shooting,
            passing: player.passing,
            dribbling: player.dribbling,
            defending: player.defending,
            physical: Math.round((player.strength + player.stamina) / 2)
          },
          attributeChanges,
          lastTraining: recentTraining?.created_at || null,
          trainingCount: playerLogs.length
        };
      });

      this.logger.log(`✅ Encontrados ${processedPlayers.length} jogadores profissionais`);
      return processedPlayers;

    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores profissionais:', error);
      throw error;
    }
  }

  /**
   * Configurar treinamento para um jogador
   */
  async setTraining(payload: {
    playerId: string;
    teamId: string;
    focus: string;
    intensity: 'baixa' | 'normal' | 'alta';
    inAcademy: boolean;
  }) {
    try {
      this.logger.log(`🎯 Configurando treinamento para jogador ${payload.playerId}`);
      
      // Validar intensidade para jogadores profissionais
      let validatedIntensity = payload.intensity;
      if (payload.intensity === 'alta') {
        // Verificar se o jogador tem fitness suficiente para treino intenso
        const { data: player } = await supabase
          .from('game_players')
          .select('fitness, age')
          .eq('id', payload.playerId)
          .single();
        
        if (player && (player.fitness < 80 || player.age > 30)) {
          this.logger.warn(`⚠️ Jogador ${payload.playerId} não tem fitness suficiente ou é muito velho para treino intenso. Alterando para 'normal'.`);
          validatedIntensity = 'normal';
        }
      }
      
      const updates = {
        training_focus: payload.focus,
        training_intensity: validatedIntensity,
        is_in_academy: payload.inAcademy,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('game_players')
        .update(updates)
        .eq('id', payload.playerId)
        .eq('team_id', payload.teamId)
        .select()
        .single();

      if (error) throw error;

      this.logger.log(`✅ Treinamento configurado: ${payload.focus} - ${validatedIntensity}`);
      return { success: true, data };

    } catch (error) {
      this.logger.error('❌ Erro ao configurar treinamento:', error);
      throw error;
    }
  }

  /**
   * Aplicar semana de treinamento
   */
  async applyTrainingWeek(teamId: string) {
    try {
      this.logger.log(`🏋️ Aplicando semana de treinamento para time ${teamId}`);
      
      // Buscar todos os jogadores profissionais
      const professionalPlayers = await this.getProfessionalPlayers(teamId);
      
      if (professionalPlayers.length === 0) {
        return { success: true, message: 'Nenhum jogador profissional para treinar' };
      }

      const trainingResults = [];
      const currentWeek = new Date().toISOString().slice(0, 10);

      // Aplicar treinamento para cada jogador
      for (const player of professionalPlayers) {
        if (!player.is_in_academy) continue;

        const result = await this.trainPlayer(player, currentWeek);
        trainingResults.push(result);

        // Aplicar ganhos de atributos ao jogador
        if (result.attributeGains && Object.keys(result.attributeGains).length > 0) {
          await this.applyAttributeGains(player, result.attributeGains);
        }

        // Salvar log de treinamento
        await this.saveTrainingLog(teamId, player, result, currentWeek);
      }

      this.logger.log(`✅ Semana de treinamento aplicada para ${trainingResults.length} jogadores`);
      return {
        success: true,
        message: `Treinamento aplicado para ${trainingResults.length} jogadores`,
        results: trainingResults
      };

    } catch (error) {
      this.logger.error('❌ Erro ao aplicar semana de treinamento:', error);
      throw error;
    }
  }

  /**
   * Treinar um jogador profissional específico
   */
  private async trainPlayer(player: any, week: string) {
    const focus = player.training_focus || 'PAS';
    const intensity = player.training_intensity || 'normal';
    
    // Calcular pontos de treinamento baseados na intensidade
    let intensityMultiplier = 1.0;
    if (intensity === 'baixa') intensityMultiplier = 0.6;
    else if (intensity === 'alta') intensityMultiplier = 1.2;

    // Calcular pontos baseados na idade e potencial
    let ageMultiplier = 1.0;
    if (player.age <= 25) ageMultiplier = 1.0;
    else if (player.age <= 30) ageMultiplier = 0.8;
    else if (player.age <= 35) ageMultiplier = 0.6;
    else ageMultiplier = 0.4;

    const potentialMultiplier = Math.min(1.3, Math.max(0.4, (player.potential - player.overall) / 25));
    const moraleMultiplier = 0.7 + (player.morale / 300);
    const fitnessMultiplier = 0.8 + (player.fitness / 200);

    const basePoints = 1.5 * potentialMultiplier * ageMultiplier * intensityMultiplier * moraleMultiplier * fitnessMultiplier;
    const totalPoints = Math.round(basePoints * 10) / 10;

    // Calcular ganhos de atributos
    const attributeGains = this.calculateAttributeGains(focus, totalPoints, player);
    
    // Verificar risco de lesão
    const injuryRisk = intensity === 'alta' ? 0.03 : 0.008;
    const isInjured = Math.random() < injuryRisk;
    
    let injuryResult = null;
    if (isInjured) {
      injuryResult = {
        type: 'leve',
        duration: intensity === 'alta' ? 3 : 1,
        description: 'Lesão leve durante treinamento intenso'
      };
    }

    return {
      playerId: player.id,
      playerName: player.name,
      week,
      focus,
      intensity,
      totalPoints,
      attributeGains,
      injuryResult,
      success: true
    };
  }

  /**
   * Calcular ganhos de atributos
   */
  private calculateAttributeGains(focus: string, totalPoints: number, player: any) {
    const gains: any = {};
    
    // 70% dos pontos vão para o atributo foco (menos que jogadores juniores)
    const focusPoints = totalPoints * 0.7;
    const otherPoints = totalPoints * 0.3;

    // Mapear foco para atributos
    const focusMap: any = {
      'PAC': 'pace',
      'SHO': 'shooting', 
      'PAS': 'passing',
      'DRI': 'dribbling',
      'DEF': 'defending',
      'PHY': 'physical'
    };

    const focusAttribute = focusMap[focus];
    if (focusAttribute) {
      gains[focusAttribute] = Math.round(focusPoints);
    }

    // Distribuir pontos restantes entre outros atributos
    const otherAttributes = Object.values(focusMap).filter(attr => attr !== focusAttribute);
    const pointsPerAttribute = Math.round(otherPoints / otherAttributes.length);
    
    otherAttributes.forEach(attr => {
      gains[attr as keyof typeof gains] = pointsPerAttribute;
    });

    return gains;
  }

  /**
   * Salvar log de treinamento
   */
  private async saveTrainingLog(teamId: string, player: any, result: any, week: string) {
    try {
      const logData = {
        team_id: teamId,
        player_id: player.id,
        player_name: player.name,
        week,
        focus: result.focus,
        intensity: result.intensity,
        total_points: result.totalPoints,
        attribute_gains: result.attributeGains // Adicionar ganhos de atributos ao log
      };

      const { error } = await supabase
        .from('game_academy_logs')
        .insert(logData);

      if (error) {
        this.logger.warn('⚠️ Erro ao salvar log de treinamento:', error);
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao salvar log de treinamento:', error);
    }
  }

  /**
   * Aplicar ganhos de atributos ao jogador
   */
  private async applyAttributeGains(player: any, attributeGains: any) {
    try {
      this.logger.log(`📈 Aplicando ganhos de atributos para ${player.name}:`, attributeGains);

      const updates: any = {};
      
      if (attributeGains.pace) {
        updates.speed = (player.speed || 50) + attributeGains.pace;
        updates.stamina = (player.stamina || 50) + attributeGains.pace;
      }
      if (attributeGains.shooting) updates.shooting = (player.shooting || 50) + attributeGains.shooting;
      if (attributeGains.passing) updates.passing = (player.passing || 50) + attributeGains.passing;
      if (attributeGains.dribbling) updates.dribbling = (player.dribbling || 50) + attributeGains.dribbling;
      if (attributeGains.defending) updates.defending = (player.defending || 50) + attributeGains.defending;
      if (attributeGains.physical) {
        updates.strength = (player.strength || 50) + attributeGains.physical;
        updates.stamina = (player.stamina || 50) + attributeGains.physical;
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('game_players')
        .update(updates)
        .eq('id', player.id);

      if (error) {
        this.logger.error(`❌ Erro ao atualizar atributos do jogador ${player.name}:`, error);
      } else {
        this.logger.log(`✅ Atributos atualizados para ${player.name}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao aplicar ganhos de atributos para ${player.name}:`, error);
    }
  }

  /**
   * Buscar estatísticas de treinamento
   */
  async getTrainingStats(teamId: string) {
    try {
      const players = await this.getProfessionalPlayers(teamId);
      
      // Calcular estatísticas
      const stats = {
        totalPlayers: players.length,
        averageAge: Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length),
        averageOverall: Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length),
        averagePotential: Math.round(players.reduce((sum, p) => sum + p.potential, 0) / players.length),
        playersInAcademy: players.filter(p => p.is_in_academy).length,
        trainingFocusDistribution: this.getTrainingFocusDistribution(players),
        intensityDistribution: this.getIntensityDistribution(players),
        moraleStats: this.getMoraleStats(players),
        fitnessStats: this.getFitnessStats(players)
      };
      
      return stats;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar estatísticas de treinamento:', error);
      throw error;
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

  /**
   * Calcular estatísticas de moral
   */
  private getMoraleStats(players: any[]) {
    const values = players.map(p => p.morale).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { average: 0, min: 0, max: 0 };
    
    return {
      average: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Calcular estatísticas de fitness
   */
  private getFitnessStats(players: any[]) {
    const values = players.map(p => p.fitness).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return { average: 0, min: 0, max: 0 };
    
    return {
      average: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  /**
   * Calcular overall para jogadores profissionais
   */
  private calculateOverall(player: any): number {
    const values = [
      Math.round((player.speed + player.stamina) / 2), // pace
      player.shooting,
      player.passing,
      player.dribbling,
      player.defending,
      Math.round((player.strength + player.stamina) / 2) // physical
    ];
    
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  async getPlayerDetails(playerId: string, teamId: string) {
    try {
      // Buscar jogador profissional
      const { data: player, error: playerError } = await supabase
        .from('game_players')
        .select('*')
        .eq('id', playerId)
        .eq('team_id', teamId)
        .single();

      if (playerError || !player) {
        throw new Error('Jogador não encontrado');
      }

      // Buscar histórico de treinamento
      const { data: trainingLogs, error: logsError } = await supabase
        .from('game_academy_logs')
        .select('*')
        .eq('player_id', playerId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) {
        this.logger.error('Erro ao buscar logs de treinamento:', logsError);
      }

      // Calcular estatísticas
      const lastTraining = trainingLogs && trainingLogs.length > 0 
        ? trainingLogs[0].created_at 
        : null;
      
      const trainingCount = trainingLogs ? trainingLogs.length : 0;

      // Preparar histórico formatado
      const trainingHistory = (trainingLogs || []).map(log => ({
        date: log.created_at,
        focus: log.training_focus,
        intensity: log.training_intensity,
        attributeGains: log.attribute_gains || {}
      }));

      return {
        player,
        attributes: {
          pace: player.pace || 0,
          shooting: player.shooting || 0,
          passing: player.passing || 0,
          dribbling: player.dribbling || 0,
          defending: player.defending || 0,
          physical: player.physical || 0
        },
        trainingHistory,
        lastTraining,
        trainingCount
      };

    } catch (error) {
      this.logger.error('Erro ao buscar detalhes do jogador:', error);
      throw error;
    }
  }
}
