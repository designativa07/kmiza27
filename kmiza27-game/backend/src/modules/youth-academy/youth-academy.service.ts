import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class YouthAcademyService {
  private readonly logger = new Logger(YouthAcademyService.name);

  /**
   * Configurar treinamento para um jogador
   */
  async setTraining(payload: { 
    playerId: string; 
    focus: string; 
    intensity?: 'low'|'normal'|'high'; 
    inAcademy?: boolean;
    trainingType?: 'youth'|'professional'|'mixed';
  }) {
    try {
      this.logger.log(`🎯 Configurando treinamento para jogador ${payload.playerId}`);

      const updates: any = {
        training_focus: payload.focus,
        training_intensity: payload.intensity || 'normal',
        training_type: payload.trainingType || 'mixed',
        updated_at: new Date().toISOString()
      };

      if (typeof payload.inAcademy === 'boolean') {
        updates.is_in_academy = payload.inAcademy;
      }

      // Atualizar tanto em game_players quanto em youth_players
      const [gameUpdate, youthUpdate] = await Promise.all([
        supabase.from('game_players').update(updates).eq('id', payload.playerId),
        supabase.from('youth_players').update(updates).eq('id', payload.playerId)
      ]);

      if (gameUpdate.error && youthUpdate.error) {
        throw new Error('Erro ao atualizar treinamento em ambas as tabelas');
      }

      this.logger.log(`✅ Treinamento configurado: ${payload.focus} - ${payload.intensity}`);
      return { success: true, message: 'Treinamento configurado com sucesso' };
    } catch (error) {
      this.logger.error('❌ Erro ao configurar treinamento:', error);
      throw error;
    }
  }

  /**
   * Aplicar semana de treinamento
   */
  async applyWeek(teamId: string) {
    try {
      this.logger.log(`🏃 Aplicando semana de treinamento para time ${teamId}`);

      // 1. Buscar jogadores da academia
      const [youthPlayers, gamePlayers] = await Promise.all([
        this.getYouthPlayers(teamId),
        this.getGamePlayers(teamId)
      ]);

      const allPlayers = [...youthPlayers, ...gamePlayers];
      this.logger.log(`📊 Total de jogadores para treinar: ${allPlayers.length}`);

      if (allPlayers.length === 0) {
        return { message: 'Nenhum jogador na academia para treinar' };
      }

      // 2. Buscar investimentos do time
      const investments = await this.getTeamInvestments(teamId);
      const trainingBonus = this.calculateTrainingBonus(investments);

      // 3. Aplicar treinamento para cada jogador
      const results = [];
      const updates = [];
      const now = new Date();

      for (const player of allPlayers) {
        try {
          const result = await this.trainPlayer(player, trainingBonus, now);
          results.push(result);
          
          if (result.attributeGains && Object.keys(result.attributeGains).length > 0) {
            const update = this.preparePlayerUpdate(player, result.attributeGains, result.injuryResult);
            if (update) { // Só adicionar se o update for válido
              updates.push(update);
            }
          }
        } catch (error) {
          this.logger.warn(`⚠️ Erro ao treinar jogador ${player.name}:`, error);
        }
      }

      // 4. Atualizar jogadores em lote
      if (updates.length > 0) {
        await this.batchUpdatePlayers(updates);
      }

      // 5. Salvar logs de treinamento
      await this.saveTrainingLogs(results, teamId);

      // 6. Criar notícia
      await this.createTrainingNews(teamId, results.length);

      this.logger.log(`✅ Semana de treinamento aplicada: ${results.length} jogadores treinados`);
      return {
        message: `Semana de treinamento aplicada para ${results.length} jogadores`,
        playersTrained: results.length,
        totalPoints: results.reduce((sum, r) => sum + (r.totalPoints || 0), 0)
      };

    } catch (error) {
      this.logger.error('❌ Erro ao aplicar semana de treinamento:', error);
      throw error;
    }
  }

  /**
   * Buscar jogadores da base
   */
  private async getYouthPlayers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('youth_players')
        .select(`
          id, name, position, age, team_id, attributes, potential
        `)
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn('⚠️ Erro ao buscar youth_players:', error);
        return [];
      }

      // Adicionar campos de treinamento com valores padrão se não existirem
      return (data || []).map(player => ({
        ...player,
        is_in_academy: true, // Youth players sempre estão na academia
        training_focus: 'PAS',
        training_intensity: 'normal',
        training_type: 'youth',
        morale: 75,
        fitness: 85
      }));
    } catch (error) {
      this.logger.warn('⚠️ Erro ao buscar youth_players:', error);
      return [];
    }
  }

  /**
   * Buscar jogadores profissionais
   */
  private async getGamePlayers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('game_players')
        .select(`
          id, name, position, age, pace, shooting, passing, dribbling, defending, physical, potential
        `)
        .eq('team_id', teamId)
        .not('name', 'is', null) // Filtrar apenas jogadores com nome
        .not('name', 'eq', ''); // Filtrar apenas jogadores com nome não vazio

      if (error) {
        this.logger.warn('⚠️ Erro ao buscar game_players:', error);
        return [];
      }

      // Filtrar jogadores válidos e adicionar campos de treinamento
      return (data || [])
        .filter(player => player.name && player.name.trim() !== '') // Filtro adicional
        .map(player => ({
          ...player,
          is_in_academy: true,
          training_focus: 'PAS',
          training_intensity: 'normal',
          training_type: 'professional',
          morale: 75,
          fitness: 85,
          // Para game_players, os atributos já estão nas colunas diretas
          // Não precisamos criar o objeto attributes
        }));
    } catch (error) {
      this.logger.warn('⚠️ Erro ao buscar game_players:', error);
      return [];
    }
  }

  /**
   * Buscar investimentos do time
   */
  private async getTeamInvestments(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('game_investments')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) {
        this.logger.warn('⚠️ Erro ao buscar investimentos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.warn('⚠️ Erro ao buscar investimentos:', error);
      return [];
    }
  }

  /**
   * Calcular bônus de treinamento baseado nos investimentos
   */
  private calculateTrainingBonus(investments: any[]) {
    let bonus = 0;
    
    investments.forEach(inv => {
      switch (inv.type) {
        case 'youth_academy':
          bonus += 0.2; // +20% para jogadores da base
          break;
        case 'training_center':
          bonus += 0.15; // +15% para todos
          break;
        case 'sports_science':
          bonus += 0.1; // +10% para todos
          break;
        case 'medical_center':
          bonus += 0.05; // +5% para todos
          break;
      }
    });

    return bonus;
  }

  /**
   * Treinar um jogador individual
   */
  private async trainPlayer(player: any, trainingBonus: number, now: Date) {
    const focus = player.training_focus || 'PAS';
    const intensity = player.training_intensity || 'normal';
    const age = player.age || 18;
    const potential = player.potential || 50;
    const morale = player.morale || 75;
    const fitness = player.fitness || 85;

    // Calcular pontos base de treinamento
    let basePoints = 1.0;
    
    // Ajustar por intensidade
    switch (intensity) {
      case 'low': basePoints *= 0.7; break;
      case 'high': basePoints *= 1.3; break;
    }

    // Ajustar por idade (jogadores mais jovens aprendem mais rápido)
    const ageMultiplier = Math.max(0.5, 1.0 - (age - 18) * 0.02);
    basePoints *= ageMultiplier;

    // Ajustar por potencial
    const potentialMultiplier = 0.8 + (potential / 100) * 0.4;
    basePoints *= potentialMultiplier;

    // Ajustar por moral e fitness
    const conditionMultiplier = (morale + fitness) / 200;
    basePoints *= conditionMultiplier;

    // Aplicar bônus de investimentos
    basePoints *= (1 + trainingBonus);

    // Calcular ganhos por atributo
    const attributeGains = this.calculateAttributeGains(focus, basePoints);

    // Verificar risco de lesão
    const injuryReduction = this.getInjuryReduction(player);
    const injuryResult = this.checkInjuryRisk(player, intensity, injuryReduction, now);

    // Calcular pontos totais
    const totalPoints = Object.values(attributeGains).reduce((sum: number, gain: any) => sum + gain, 0);

    return {
      playerId: player.id,
      playerName: player.name,
      focus,
      intensity,
      totalPoints,
      attributeGains,
      injuryResult
    };
  }

  /**
   * Calcular ganhos de atributos
   */
  private calculateAttributeGains(focus: string, basePoints: number) {
    const gains: any = {};
    
    // Mapeamento de foco para atributos
    const mapping: any = {
      'PAC': { primary: ['pace'], secondary: ['shooting'] },
      'SHO': { primary: ['shooting'], secondary: ['passing'] },
      'PAS': { primary: ['passing'], secondary: ['dribbling'] },
      'DRI': { primary: ['dribbling'], secondary: ['passing'] },
      'DEF': { primary: ['defending'], secondary: ['physical'] },
      'PHY': { primary: ['physical'], secondary: ['defending'] },
      'GK': { primary: ['pace'], secondary: ['shooting'] }
    };

    const focusMapping = mapping[focus] || mapping['PAS'];
    const primaryPoints = basePoints * 0.7;
    const secondaryPoints = basePoints * 0.3;

    // Aplicar ganhos nos atributos primários
    focusMapping.primary.forEach((attr: string) => {
      const gain = Math.round(primaryPoints / focusMapping.primary.length);
      gains[attr] = Math.max(0, Math.min(5, gain)); // Limitar entre 0 e 5
    });

    // Aplicar ganhos nos atributos secundários
    focusMapping.secondary.forEach((attr: string) => {
      const gain = Math.round(secondaryPoints / focusMapping.secondary.length);
      gains[attr] = Math.max(0, Math.min(3, gain)); // Limitar entre 0 e 3
    });

    return gains;
  }

  /**
   * Obter redução de lesão baseada nos investimentos
   */
  private getInjuryReduction(player: any) {
    // Implementação básica - pode ser expandida
    return 0.5; // 50% de redução base
  }

  /**
   * Verificar risco de lesão
   */
  private checkInjuryRisk(player: any, intensity: string, injuryReduction: number, now: Date) {
    if (intensity !== 'high') {
      return { injured: false };
    }

    const baseRisk = 0.03; // 3% de risco base
    const finalRisk = Math.max(0, baseRisk * (1 - injuryReduction));
    
    if (Math.random() < finalRisk) {
      const days = 7 + Math.floor(Math.random() * 14); // 7-21 dias
      const returnDate = new Date(now);
      returnDate.setDate(returnDate.getDate() + days);
      
      return {
        injured: true,
        days,
        returnDate: returnDate.toISOString().slice(0, 10),
        severity: 'light'
      };
    }

    return { injured: false };
  }

  /**
   * Preparar dados para atualização do jogador
   */
  private preparePlayerUpdate(player: any, attributeGains: any, injuryResult: any) {
    const updateData: any = { id: player.id };

          // Atualizar atributos apenas se houver ganhos válidos
      Object.entries(attributeGains).forEach(([attr, gain]) => {
        if (gain !== undefined && gain !== null && (gain as number) > 0) {
          const currentValue = this.getPlayerAttribute(player, attr);
          const newValue = Math.round(currentValue + (gain as number));
          
          // Garantir que o valor está dentro dos limites válidos
          if (newValue >= 1 && newValue <= 99) {
            updateData[attr] = newValue;
          }
        }
      });

    // Atualizar timestamp
    updateData.updated_at = new Date().toISOString();

    // Verificar se há dados válidos para atualizar
    if (Object.keys(updateData).length <= 2) { // Apenas id e updated_at
      this.logger.warn(`⚠️ Jogador ${player.id} sem atributos válidos para atualizar`);
      return null;
    }

    return updateData;
  }

  /**
   * Obter valor do atributo do jogador
   */
  private getPlayerAttribute(player: any, attribute: string): number {
    // Para youth_players (atributos em objeto)
    if (player.attributes && player.attributes[attribute] !== undefined) {
      return player.attributes[attribute];
    }
    
    // Para game_players (atributos diretos)
    if (player[attribute] !== undefined) {
      return player[attribute];
    }
    
    // Mapear atributos para colunas corretas
    const attributeMapping: any = {
      'pace': 'pace',
      'shooting': 'shooting', 
      'passing': 'passing',
      'dribbling': 'dribbling',
      'defending': 'defending',
      'physical': 'physical'
    };
    
    const mappedAttribute = attributeMapping[attribute];
    if (mappedAttribute && player[mappedAttribute] !== undefined) {
      return player[mappedAttribute];
    }
    
    return 50; // Valor padrão
  }

  /**
   * Atualizar jogadores em lote
   */
  private async batchUpdatePlayers(updates: any[]) {
    try {
      // Filtrar apenas jogadores válidos
      const validUpdates = updates.filter(update => {
        // Verificar se tem campos obrigatórios
        if (!update.id) {
          this.logger.warn(`⚠️ Jogador inválido ignorado (sem ID): ${JSON.stringify(update)}`);
          return false;
        }
        
        // Verificar se tem atributos válidos
        const hasValidAttributes = update.pace !== undefined || 
                                 update.shooting !== undefined || 
                                 update.passing !== undefined || 
                                 update.dribbling !== undefined || 
                                 update.defending !== undefined || 
                                 update.physical !== undefined;
        
        if (!hasValidAttributes) {
          this.logger.warn(`⚠️ Jogador ignorado (sem atributos válidos): ${JSON.stringify(update)}`);
          return false;
        }
        
        return true;
      });

      if (validUpdates.length === 0) {
        this.logger.warn('⚠️ Nenhum jogador válido para atualizar');
        return;
      }

      // Separar updates por tabela e limpar campos desnecessários
      const youthUpdates = validUpdates
        .filter(u => u.team_id)
        .map(u => ({
          id: u.id,
          pace: u.pace,
          shooting: u.shooting,
          passing: u.passing,
          dribbling: u.dribbling,
          defending: u.defending,
          physical: u.physical,
          updated_at: u.updated_at
        }))
        .filter(u => u.pace !== undefined || u.shooting !== undefined || u.passing !== undefined || 
                    u.dribbling !== undefined || u.defending !== undefined || u.physical !== undefined);

      const gameUpdates = validUpdates
        .filter(u => !u.team_id)
        .map(u => ({
          id: u.id,
          pace: u.pace,
          shooting: u.shooting,
          passing: u.passing,
          dribbling: u.dribbling,
          defending: u.defending,
          physical: u.physical,
          updated_at: u.updated_at
        }))
        .filter(u => u.pace !== undefined || u.shooting !== undefined || u.passing !== undefined || 
                    u.dribbling !== undefined || u.defending !== undefined || u.physical !== undefined);

      // Atualizar youth_players
      if (youthUpdates.length > 0) {
        const { error: youthError } = await supabase
          .from('youth_players')
          .upsert(youthUpdates, { onConflict: 'id' });
        
        if (youthError) {
          this.logger.warn('⚠️ Erro ao atualizar youth_players:', youthError);
        } else {
          this.logger.log(`✅ ${youthUpdates.length} youth_players atualizados`);
        }
      }

      // Atualizar game_players individualmente para evitar problemas de upsert
      if (gameUpdates.length > 0) {
        let successCount = 0;
        
        for (const update of gameUpdates) {
          try {
            // Preparar dados de atualização apenas com campos válidos
            const updateData: any = { updated_at: update.updated_at };
            
            if (update.pace !== undefined) updateData.pace = update.pace;
            if (update.shooting !== undefined) updateData.shooting = update.shooting;
            if (update.passing !== undefined) updateData.passing = update.passing;
            if (update.dribbling !== undefined) updateData.dribbling = update.dribbling;
            if (update.defending !== undefined) updateData.defending = update.defending;
            if (update.physical !== undefined) updateData.physical = update.physical;

            // Verificar se há dados para atualizar
            if (Object.keys(updateData).length <= 1) { // Apenas updated_at
              this.logger.warn(`⚠️ Jogador ${update.id} ignorado (sem atributos para atualizar)`);
              continue;
            }

            // Atualizar usando UPDATE simples
            const { error } = await supabase
              .from('game_players')
              .update(updateData)
              .eq('id', update.id);

            if (error) {
              this.logger.warn(`⚠️ Erro ao atualizar jogador ${update.id}:`, error);
            } else {
              successCount++;
            }
          } catch (error) {
            this.logger.warn(`⚠️ Erro ao processar jogador ${update.id}:`, error);
          }
        }
        
        this.logger.log(`✅ ${successCount} de ${gameUpdates.length} game_players atualizados`);
      }

      this.logger.log(`✅ ${validUpdates.length} jogadores processados em lote`);
    } catch (error) {
      this.logger.error('❌ Erro ao atualizar jogadores em lote:', error);
      throw error;
    }
  }

  /**
   * Salvar logs de treinamento
   */
  private async saveTrainingLogs(results: any[], teamId: string) {
    try {
      const logs = results.map(result => ({
        team_id: teamId,
        player_id: result.playerId,
        player_name: result.playerName,
        week: new Date().toISOString().slice(0, 10),
        focus: result.focus,
        intensity: result.intensity,
        total_points: result.totalPoints,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('game_academy_logs')
        .insert(logs);

      if (error) {
        this.logger.warn('⚠️ Erro ao salvar logs de treinamento:', error);
      } else {
        this.logger.log(`📝 ${logs.length} logs de treinamento salvos`);
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao salvar logs:', error);
    }
  }

  /**
   * Criar notícia de treinamento
   */
  private async createTrainingNews(teamId: string, playerCount: number) {
    try {
      const news = {
        team_id: teamId,
        title: 'Semana de Treinamento Concluída',
        message: `${playerCount} jogadores completaram uma semana intensiva de treinamento na academia.`,
        type: 'academy',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('game_news')
        .insert(news);

      if (error) {
        this.logger.warn('⚠️ Erro ao criar notícia:', error);
      } else {
        this.logger.log('📰 Notícia de treinamento criada');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao criar notícia:', error);
    }
  }

  /**
   * Buscar logs de treinamento
   */
  async getLogs(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('game_academy_logs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error('❌ Erro ao buscar logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('❌ Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Buscar jogadores na academia
   */
  async getPlayersInAcademy(teamId: string) {
    try {
      const [youthPlayers, gamePlayers] = await Promise.all([
        this.getYouthPlayers(teamId),
        this.getGamePlayers(teamId)
      ]);

      return [...youthPlayers, ...gamePlayers];
    } catch (error) {
      this.logger.error('❌ Erro ao buscar jogadores na academia:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas de treinamento
   */
  async getTrainingStats(teamId: string) {
    try {
      const players = await this.getPlayersInAcademy(teamId);
      
      const stats = {
        totalPlayers: players.length,
        byIntensity: { low: 0, normal: 0, high: 0 },
        byFocus: { PAC: 0, SHO: 0, PAS: 0, DRI: 0, DEF: 0, PHY: 0, GK: 0 },
        averagePotential: null,
        averageMorale: 0
      };

      let totalPotential = 0;
      let totalMorale = 0;

      players.forEach(player => {
        // Contar por intensidade
        const intensity = player.training_intensity || 'normal';
        stats.byIntensity[intensity]++;

        // Contar por foco
        const focus = player.training_focus || 'PAS';
        if (stats.byFocus[focus] !== undefined) {
          stats.byFocus[focus]++;
        }

        // Calcular médias
        if (player.potential) {
          totalPotential += player.potential;
        }
        if (player.morale) {
          totalMorale += player.morale;
        }
      });

      if (players.length > 0) {
        stats.averagePotential = Math.round(totalPotential / players.length);
        stats.averageMorale = Math.round(totalMorale / players.length);
      }

      return stats;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}
