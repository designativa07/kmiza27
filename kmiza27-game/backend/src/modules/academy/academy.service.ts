import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class AcademyService {
  private readonly logger = new Logger(AcademyService.name);

  /**
   * Buscar jogadores da academia
   */
  async getAcademyPlayers(teamId: string) {
    try {
      this.logger.log(`🔍 Buscando jogadores da academia para time ${teamId}`);

      // Buscar jogadores juniores
      const { data: youthPlayers, error: youthError } = await supabase
        .from('youth_players')
        .select('*')
        .eq('team_id', teamId)
        .lte('age', 21);

      if (youthError) {
        this.logger.error('❌ Erro ao buscar jogadores juniores:', youthError);
        throw new Error(`Erro ao buscar jogadores juniores: ${youthError.message}`);
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
      const processedPlayers = (youthPlayers || []).map(player => {
        const playerLogs = recentLogs?.filter(log => log.player_id === player.id) || [];
        const recentTraining = playerLogs[0]; // Treinamento mais recente
        
        // Calcular mudanças nos atributos se houver treinamento recente
        let attributeChanges = {};
        if (recentTraining && recentTraining.attribute_gains) {
          attributeChanges = recentTraining.attribute_gains;
        }

        return {
          ...player,
          type: 'youth',
          overall: this.calculateOverall(player.attributes),
          potential: this.calculatePotential(player.potential),
          attributeChanges,
          lastTraining: recentTraining?.created_at || null,
          trainingCount: playerLogs.length
        };
      });

      this.logger.log(`✅ Encontrados ${processedPlayers.length} jogadores da academia`);
      return processedPlayers;

    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores da academia:', error);
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
    playerType: string;
  }) {
    try {
      this.logger.log(`🎯 Configurando treinamento para jogador ${payload.playerId}`);
      
      // Validar intensidade para jogadores juniores
      let validatedIntensity = payload.intensity;
      if (payload.playerType === 'youth') {
        // Para jogadores juniores, limitar intensidade a 'normal' para evitar lesões
        if (payload.intensity === 'alta') {
          this.logger.warn(`⚠️ Intensidade 'alta' não permitida para jogadores juniores. Alterando para 'normal'.`);
          validatedIntensity = 'normal';
        }
      }
      
      const updates = {
        training_focus: payload.focus,
        training_intensity: validatedIntensity,
        is_in_academy: payload.inAcademy,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (payload.playerType === 'youth') {
        const { data, error } = await supabase
          .from('youth_players')
          .update(updates)
          .eq('id', payload.playerId)
          .eq('team_id', payload.teamId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('game_players')
          .update(updates)
          .eq('id', payload.playerId)
          .eq('team_id', payload.teamId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      this.logger.log(`✅ Treinamento configurado: ${payload.focus} - ${validatedIntensity}`);
      return { success: true, data: result };

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
      
      // Buscar todos os jogadores da academia
      const academyPlayers = await this.getAcademyPlayers(teamId);
      
      if (academyPlayers.length === 0) {
        return { success: true, message: 'Nenhum jogador na academia para treinar' };
      }

      const trainingResults = [];
      const currentWeek = new Date().toISOString().slice(0, 10);

      // Aplicar treinamento para cada jogador
      for (const player of academyPlayers) {
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
   * Treinar um jogador específico
   */
  private async trainPlayer(player: any, week: string) {
    const focus = player.training_focus || 'PAS';
    const intensity = player.training_intensity || 'normal';
    
    // Calcular pontos de treinamento baseados na intensidade
    let intensityMultiplier = 1.0;
    if (intensity === 'baixa') intensityMultiplier = 0.7;
    else if (intensity === 'alta') intensityMultiplier = 1.3;

    // Calcular pontos baseados na idade e potencial
    let ageMultiplier = 1.0;
    if (player.age <= 18) ageMultiplier = 1.4;
    else if (player.age <= 21) ageMultiplier = 1.2;
    else if (player.age <= 25) ageMultiplier = 1.0;
    else if (player.age <= 30) ageMultiplier = 0.8;
    else ageMultiplier = 0.6;

    const potentialMultiplier = Math.min(1.5, Math.max(0.5, (player.potential - player.overall) / 20));
    const moraleMultiplier = 0.8 + (player.morale / 250);

    const basePoints = 2.0 * potentialMultiplier * ageMultiplier * intensityMultiplier * moraleMultiplier;
    const totalPoints = Math.round(basePoints * 10) / 10;

    // Calcular ganhos de atributos
    const attributeGains = this.calculateAttributeGains(focus, totalPoints, player);
    
    // Verificar risco de lesão
    const injuryRisk = intensity === 'alta' ? 0.02 : 0.005;
    const isInjured = Math.random() < injuryRisk;
    
    let injuryResult = null;
    if (isInjured) {
      injuryResult = {
        type: 'leve',
        duration: intensity === 'alta' ? 2 : 1,
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
    
    // 80% dos pontos vão para o atributo foco
    const focusPoints = totalPoints * 0.8;
    const otherPoints = totalPoints * 0.2;

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
      this.logger.log(`📝 Salvando log de treinamento para jogador ${player.name}`);
      
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

      this.logger.log(`📊 Dados do log:`, logData);

      const { error } = await supabase
        .from('game_academy_logs')
        .insert(logData);

      if (error) {
        this.logger.warn('⚠️ Erro ao salvar log de treinamento:', error);
      } else {
        this.logger.log(`✅ Log de treinamento salvo com sucesso para ${player.name}`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao salvar log de treinamento:', error);
    }
  }

  /**
   * Buscar logs de treinamento
   */
  async getTrainingLogs(teamId: string, limit: number = 50) {
    try {
      const { data: logs, error } = await supabase
        .from('game_academy_logs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar logs: ${error.message}`);
      }

      return logs || [];

    } catch (error) {
      this.logger.error('❌ Erro ao buscar logs de treinamento:', error);
      throw error;
    }
  }

  /**
   * Buscar detalhes específicos de um jogador
   */
  async getPlayerDetails(playerId: string, teamId: string) {
    try {
      this.logger.log(`🔍 Buscando detalhes do jogador ${playerId} da equipe ${teamId}`);

      // Buscar jogador júnior
      const { data: youthPlayer, error: youthError } = await supabase
        .from('youth_players')
        .select('*')
        .eq('id', playerId)
        .eq('team_id', teamId)
        .single();

      if (youthError && youthError.code !== 'PGRST116') {
        this.logger.error(`❌ Erro ao buscar jogador júnior ${playerId}:`, youthError);
        throw new Error('Jogador não encontrado');
      }

      if (youthPlayer) {
        // Buscar histórico de treinamento
        const { data: trainingLogs, error: logsError } = await supabase
          .from('game_academy_logs')
          .select('*')
          .eq('player_id', playerId)
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsError) {
          this.logger.error(`❌ Erro ao buscar logs de treinamento para ${playerId}:`, logsError);
        }

        // Processar histórico de treinamento
        const trainingHistory = (trainingLogs || []).map(log => ({
          date: log.created_at,
          focus: log.focus,
          intensity: log.intensity,
          status: 'Concluído',
          totalPoints: log.total_points,
          attributeGains: log.attribute_gains
        }));

        return {
          player: youthPlayer,
          attributes: youthPlayer.attributes,
          trainingHistory,
          lastTraining: trainingLogs?.[0]?.created_at || null,
          trainingCount: trainingLogs?.length || 0
        };
      }

      // Se não for jogador júnior, buscar como jogador profissional
      const { data: professionalPlayer, error: professionalError } = await supabase
        .from('game_players')
        .select('*')
        .eq('id', playerId)
        .eq('team_id', teamId)
        .single();

      if (professionalError && professionalError.code !== 'PGRST116') {
        this.logger.error(`❌ Erro ao buscar jogador profissional ${playerId}:`, professionalError);
        throw new Error('Jogador não encontrado');
      }

      if (professionalPlayer) {
        // Buscar histórico de treinamento
        const { data: trainingLogs, error: logsError } = await supabase
          .from('game_academy_logs')
          .select('*')
          .eq('player_id', playerId)
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsError) {
          this.logger.error(`❌ Erro ao buscar logs de treinamento para ${playerId}:`, logsError);
        }

        // Processar histórico de treinamento
        const trainingHistory = (trainingLogs || []).map(log => ({
          date: log.created_at,
          focus: log.focus,
          intensity: log.intensity,
          status: 'Concluído',
          totalPoints: log.total_points,
          attributeGains: log.attribute_gains
        }));

        return {
          player: professionalPlayer,
          attributes: {
            pace: Math.round((professionalPlayer.speed + professionalPlayer.stamina) / 2),
            shooting: professionalPlayer.shooting,
            passing: professionalPlayer.passing,
            dribbling: professionalPlayer.dribbling,
            defending: professionalPlayer.defending,
            physical: Math.round((professionalPlayer.strength + professionalPlayer.stamina) / 2)
          },
          trainingHistory,
          lastTraining: trainingLogs?.[0]?.created_at || null,
          trainingCount: trainingLogs?.length || 0
        };
      }

      throw new Error('Jogador não encontrado');
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar detalhes do jogador ${playerId}:`, error);
      throw error;
    }
  }

  /**
   * Calcular overall para jogadores juniores
   */
  private calculateOverall(attributes: any): number {
    if (!attributes) return 50;
    
    const values = [
      attributes.pace || 50,
      attributes.shooting || 50,
      attributes.passing || 50,
      attributes.dribbling || 50,
      attributes.defending || 50,
      attributes.physical || 50
    ];
    
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  /**
   * Calcular overall para jogadores profissionais
   */
  private calculateProfessionalOverall(player: any): number {
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

  /**
   * Calcular potencial para jogadores juniores
   */
  private calculatePotential(potential: any): number {
    if (!potential) return 70;
    
    const values = [
      potential.pace || 70,
      potential.shooting || 70,
      potential.passing || 70,
      potential.dribbling || 70,
      potential.defending || 70,
      potential.physical || 70
    ];
    
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }

  /**
   * Aplicar ganhos de atributos ao jogador
   */
  private async applyAttributeGains(player: any, attributeGains: any) {
    try {
      this.logger.log(`📈 Aplicando ganhos de atributos para ${player.name}:`, attributeGains);

      if (player.type === 'youth') {
        // Atualizar jogador júnior
        const { error } = await supabase
          .from('youth_players')
          .update({
            attributes: {
              pace: (player.attributes.pace || 50) + (attributeGains.pace || 0),
              shooting: (player.attributes.shooting || 50) + (attributeGains.shooting || 0),
              passing: (player.attributes.passing || 50) + (attributeGains.passing || 0),
              dribbling: (player.attributes.dribbling || 50) + (attributeGains.dribbling || 0),
              defending: (player.attributes.defending || 50) + (attributeGains.defending || 0),
              physical: (player.attributes.physical || 50) + (attributeGains.physical || 0)
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', player.id);

        if (error) {
          this.logger.error(`❌ Erro ao atualizar atributos do jogador júnior ${player.name}:`, error);
        } else {
          this.logger.log(`✅ Atributos atualizados para ${player.name}`);
        }
      } else {
        // Atualizar jogador profissional
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
          this.logger.error(`❌ Erro ao atualizar atributos do jogador profissional ${player.name}:`, error);
        } else {
          this.logger.log(`✅ Atributos atualizados para ${player.name}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao aplicar ganhos de atributos para ${player.name}:`, error);
    }
  }
}
