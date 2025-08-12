import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

// Tipos de personalidade dos jogadores
export type PlayerPersonality = 
  | 'trabalhador'      // +10% treino
  | 'preguicoso'       // -10% treino, -5 moral com treino alto
  | 'lider'            // +moral da equipe
  | 'temperamental'    // moral oscila mais
  | 'acadêmico'        // +15% foco em academia
  | 'frágil'           // +20% chance lesão leve
  | 'resistente'       // -30% chance lesão
  | 'ambicioso'        // +evolução quando ganha
  | 'acomodado';       // -evolução quando time vai bem

// Focos de treino em português
export type TrainingFocus = 'PAC' | 'FIN' | 'PAS' | 'DRI' | 'DEF' | 'FIS' | 'GOL';

// Intensidade de treino
export type TrainingIntensity = 'baixa' | 'normal' | 'alta';

export interface PlayerDevelopmentData {
  id: string;
  name: string;
  age: number;
  position: string;
  
  // Atributos atuais
  passing: number;
  shooting: number;
  dribbling: number;
  defending: number;
  speed: number;
  stamina: number;
  strength: number;
  
  // Estado de desenvolvimento
  current_ability: number;
  potential: number;
  experience: number;
  
  // Estado mental/físico
  morale: number;
  fitness: number;
  form: number;
  fatigue: number;
  
  // Sistema de treino
  training_focus?: TrainingFocus;
  training_intensity?: TrainingIntensity;
  is_in_academy: boolean;
  
  // Personalidade e características
  personality?: PlayerPersonality;
  preferred_foot: 'left' | 'right' | 'both';
  
  // Lesões
  injury_type?: string;
  injury_severity: number;
  injury_until?: string;
  
  // Estatísticas
  games_played: number;
  goals_scored: number;
  assists: number;
  average_rating: number;
  
  // Contratos e valor
  salary_monthly: number;
  market_value: number;
}

@Injectable()
export class PlayerDevelopmentService {
  private readonly logger = new Logger(PlayerDevelopmentService.name);

  /**
   * Aplicar evolução semanal completa para o time
   */
  async applyWeeklyDevelopment(teamId: string): Promise<{
    playersEvolved: number;
    totalEvolution: number;
    injuries: number;
    newsEvents: any[];
  }> {
    this.logger.log(`🎯 Aplicando desenvolvimento semanal para time ${teamId}`);

    try {
      // Buscar jogadores do time
      const { data: players, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw new Error(error.message);

      // Buscar investimentos do time para bônus
      const { data: investments } = await supabase
        .from('game_investments')
        .select('item_id')
        .eq('team_id', teamId);

      const hasInvestment = (itemId: string) => 
        investments?.some(inv => inv.item_id === itemId) || false;

      // Calcular bônus de instalações
      const developmentBonus = {
        training: hasInvestment('training_center') ? 0.15 : 0,
        academy: hasInvestment('youth_academy') ? 0.20 : 0,
        medical: hasInvestment('medical_center') ? 0.8 : 0, // Reduz chance de lesão
        recovery: hasInvestment('recovery_center') ? 0.3 : 0 // Reduz fadiga
      };

      let playersEvolved = 0;
      let totalEvolution = 0;
      let injuries = 0;
      const newsEvents: any[] = [];
      const updates: any[] = [];

      for (const player of players || []) {
        const playerData = player as PlayerDevelopmentData;
        
        // Aplicar desenvolvimento do jogador
        const developmentResult = await this.processPlayerWeeklyDevelopment(
          playerData, 
          developmentBonus
        );

        if (developmentResult.evolved) {
          playersEvolved++;
          totalEvolution += developmentResult.evolutionPoints;
        }

        if (developmentResult.injured) {
          injuries++;
          newsEvents.push({
            team_id: teamId,
            type: 'injury',
            title: `${playerData.name} se lesionou`,
            message: `${playerData.name} sofreu lesão ${developmentResult.injuryType} durante o treino.`
          });
        }

        if (developmentResult.breakthrough) {
          newsEvents.push({
            team_id: teamId,
            type: 'development',
            title: `${playerData.name} teve grande evolução!`,
            message: `${playerData.name} demonstrou excelente progresso nos treinos e evoluiu significativamente.`
          });
        }

        // Coletar atualizações
        if (Object.keys(developmentResult.updates).length > 0) {
          updates.push({
            id: playerData.id,
            ...developmentResult.updates
          });
        }
      }

      // Aplicar atualizações em lote
      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('game_players')
          .upsert(updates, { onConflict: 'id' });
        
        if (updateError) throw new Error(updateError.message);
      }

      // Criar notícias
      if (newsEvents.length > 0) {
        await supabase.from('game_news').insert(newsEvents);
      }

      // Log de desenvolvimento geral
      await supabase.from('game_academy_logs').insert({
        team_id: teamId,
        week: this.getCurrentWeek(),
        notes: `weekly_development;evolved_${playersEvolved};injuries_${injuries}`,
        delta_attributes: { 
          playersEvolved, 
          totalEvolution: Math.round(totalEvolution * 100) / 100,
          injuries 
        }
      });

      this.logger.log(`✅ Desenvolvimento aplicado: ${playersEvolved} jogadores evoluíram, ${injuries} lesões`);

      return {
        playersEvolved,
        totalEvolution,
        injuries,
        newsEvents
      };

    } catch (error) {
      this.logger.error('❌ Erro no desenvolvimento semanal:', error);
      throw error;
    }
  }

  /**
   * Processar desenvolvimento individual do jogador
   */
  private async processPlayerWeeklyDevelopment(
    player: PlayerDevelopmentData,
    bonuses: any
  ): Promise<{
    evolved: boolean;
    evolutionPoints: number;
    injured: boolean;
    injuryType?: string;
    breakthrough: boolean;
    updates: any;
  }> {
    const updates: any = {};
    let evolutionPoints = 0;
    let injured = false;
    let injuryType: string | undefined;
    let breakthrough = false;

    // 1. Calcular fadiga e reduzir se necessário
    const currentFatigue = player.fatigue || 0;
    const fatigueReduction = 10 + (bonuses.recovery * 10);
    updates.fatigue = Math.max(0, currentFatigue - fatigueReduction);

    // 2. Processar recuperação de lesão
    if (player.injury_until) {
      const injuryDate = new Date(player.injury_until);
      const today = new Date();
      
      if (today >= injuryDate) {
        updates.injury_type = null;
        updates.injury_severity = 0;
        updates.injury_until = null;
        updates.fitness = Math.min(100, (player.fitness || 80) + 20); // Recuperação fitness
      }
    }

    // 3. Calcular evolução base (apenas se não lesionado)
    if (!player.injury_until) {
      evolutionPoints = this.calculateWeeklyEvolution(player, bonuses);
      
      if (evolutionPoints > 0) {
        const attributeEvolution = this.distributeEvolutionPoints(player, evolutionPoints);
        Object.assign(updates, attributeEvolution);
        
        // Atualizar overall baseado nos novos atributos
        const newOverall = this.calculateOverall({...player, ...attributeEvolution});
        updates.current_ability = newOverall;
        
        // Verificar breakthrough (evolução excepcional)
        if (evolutionPoints > 3.0) {
          breakthrough = true;
        }
      }

      // 4. Aplicar fadiga de treino
      const trainingFatigue = this.calculateTrainingFatigue(player);
      updates.fatigue = Math.min(100, (updates.fatigue || 0) + trainingFatigue);

      // 5. Verificar lesão de treino
      const injuryChance = this.calculateInjuryChance(player, bonuses);
      if (Math.random() < injuryChance) {
        const injury = this.generateInjury(player);
        injured = true;
        injuryType = injury.type;
        updates.injury_type = injury.type;
        updates.injury_severity = injury.severity;
        updates.injury_until = injury.until;
        updates.fitness = Math.max(30, (player.fitness || 80) - injury.severity * 5);
      }
    }

    // 6. Atualizar moral baseado em treino e personalidade
    const moralChange = this.calculateMoraleChange(player);
    updates.morale = Math.max(1, Math.min(100, (player.morale || 60) + moralChange));

    // 7. Atualizar forma baseado em moral e treino
    const formChange = this.calculateFormChange(player, evolutionPoints > 0);
    updates.form = Math.max(1, Math.min(10, (player.form || 5) + formChange));

    // 8. Incrementar experiência
    updates.experience = (player.experience || 0) + Math.floor(evolutionPoints * 10);

    return {
      evolved: evolutionPoints > 0,
      evolutionPoints,
      injured,
      injuryType,
      breakthrough,
      updates
    };
  }

  /**
   * Calcular evolução semanal do jogador
   */
  private calculateWeeklyEvolution(player: PlayerDevelopmentData, bonuses: any): number {
    // Fatores base
    const age = player.age;
    const potential = player.potential || 75;
    const currentAbility = player.current_ability || this.calculateOverall(player);
    const morale = player.morale || 60;
    const fitness = player.fitness || 80;
    const fatigue = player.fatigue || 0;

    // Fator de potencial (quanto mais longe do potencial, mais evolui)
    const potentialFactor = Math.max(0.1, (potential - currentAbility) / 30);

    // Fator de idade
    let ageFactor = 1.0;
    if (age <= 18) ageFactor = 1.8;
    else if (age <= 21) ageFactor = 1.5;
    else if (age <= 25) ageFactor = 1.2;
    else if (age <= 28) ageFactor = 1.0;
    else if (age <= 32) ageFactor = 0.7;
    else ageFactor = 0.4;

    // Fator de treino
    let trainingFactor = 1.0;
    if (player.is_in_academy) {
      const intensity = player.training_intensity || 'normal';
      switch (intensity) {
        case 'baixa': trainingFactor = 0.7; break;
        case 'normal': trainingFactor = 1.0; break;
        case 'alta': trainingFactor = 1.4; break;
      }
      
      // Bônus de academia
      trainingFactor += bonuses.academy;
    } else {
      trainingFactor = 0.5; // Fora da academia evolui menos
    }

    // Bônus de instalações
    trainingFactor += bonuses.training;

    // Fatores de estado
    const moraleFactor = 0.5 + (morale / 100);
    const fitnessFactor = 0.5 + (fitness / 200);
    const fatigueFactor = Math.max(0.2, 1 - (fatigue / 100));

    // Fator de personalidade
    const personalityFactor = this.getPersonalityTrainingModifier(player.personality);

    // Cálculo final
    const baseEvolution = 1.5; // Pontos base por semana
    const evolution = baseEvolution * 
                     potentialFactor * 
                     ageFactor * 
                     trainingFactor * 
                     moraleFactor * 
                     fitnessFactor * 
                     fatigueFactor * 
                     personalityFactor;

    // Adicionar aleatoriedade (±30%)
    const randomFactor = 0.7 + (Math.random() * 0.6);
    
    return Math.max(0, evolution * randomFactor);
  }

  /**
   * Distribuir pontos de evolução pelos atributos
   */
  private distributeEvolutionPoints(player: PlayerDevelopmentData, points: number): any {
    const updates: any = {};
    const focus = player.training_focus || 'PAS';
    
    // Mapear foco para atributos
    const focusMapping: Record<TrainingFocus, { primary: string[], secondary: string[] }> = {
      'PAC': { primary: ['speed'], secondary: ['stamina'] },
      'FIN': { primary: ['shooting'], secondary: ['finishing'] },
      'PAS': { primary: ['passing'], secondary: ['vision'] },
      'DRI': { primary: ['dribbling'], secondary: ['agility'] },
      'DEF': { primary: ['defending'], secondary: ['tackling'] },
      'FIS': { primary: ['strength'], secondary: ['stamina', 'jumping'] },
      'GOL': { primary: ['goalkeeping'], secondary: ['concentration'] }
    };

    const mapping = focusMapping[focus];
    if (!mapping) return updates;

    // 70% dos pontos vão para atributos primários
    const primaryPoints = points * 0.7;
    const secondaryPoints = points * 0.3;

    // Distribuir pontos primários
    for (const attr of mapping.primary) {
      const currentValue = (player as any)[attr] || 50;
      const softCap = Math.min(99, player.potential + Math.random() * 5);
      
      if (currentValue < softCap) {
        const gain = Math.min(
          primaryPoints / mapping.primary.length,
          softCap - currentValue
        );
        updates[attr] = Math.min(99, currentValue + Math.round(gain * 10) / 10);
      }
    }

    // Distribuir pontos secundários
    for (const attr of mapping.secondary) {
      const currentValue = (player as any)[attr] || 50;
      const softCap = Math.min(99, player.potential - 5 + Math.random() * 10);
      
      if (currentValue < softCap) {
        const gain = Math.min(
          secondaryPoints / mapping.secondary.length,
          softCap - currentValue
        );
        updates[attr] = Math.min(99, currentValue + Math.round(gain * 10) / 10);
      }
    }

    return updates;
  }

  /**
   * Modificador de personalidade para treino
   */
  private getPersonalityTrainingModifier(personality?: PlayerPersonality): number {
    switch (personality) {
      case 'trabalhador': return 1.1;
      case 'preguicoso': return 0.9;
      case 'acadêmico': return 1.15;
      case 'ambicioso': return 1.05;
      case 'acomodado': return 0.95;
      default: return 1.0;
    }
  }

  /**
   * Calcular fadiga de treino
   */
  private calculateTrainingFatigue(player: PlayerDevelopmentData): number {
    if (!player.is_in_academy) return 0;

    const intensity = player.training_intensity || 'normal';
    let baseFatigue = 0;

    switch (intensity) {
      case 'baixa': baseFatigue = 2; break;
      case 'normal': baseFatigue = 5; break;
      case 'alta': baseFatigue = 10; break;
    }

    // Modificador por idade (jovens se cansam menos)
    const ageFactor = player.age <= 21 ? 0.8 : player.age >= 30 ? 1.3 : 1.0;
    
    // Modificador por personalidade
    const personalityFactor = player.personality === 'resistente' ? 0.7 : 
                             player.personality === 'frágil' ? 1.3 : 1.0;

    return Math.round(baseFatigue * ageFactor * personalityFactor);
  }

  /**
   * Calcular chance de lesão
   */
  private calculateInjuryChance(player: PlayerDevelopmentData, bonuses: any): number {
    let baseChance = 0.01; // 1% base

    // Aumentar por intensidade
    if (player.training_intensity === 'alta') {
      baseChance += 0.02;
    }

    // Aumentar por fadiga
    const fatigue = player.fatigue || 0;
    baseChance += fatigue * 0.0003;

    // Modificador por personalidade
    if (player.personality === 'frágil') baseChance *= 1.5;
    if (player.personality === 'resistente') baseChance *= 0.5;

    // Redução por centro médico
    baseChance *= (1 - bonuses.medical);

    return Math.max(0, baseChance);
  }

  /**
   * Gerar lesão
   */
  private generateInjury(player: PlayerDevelopmentData): {
    type: string;
    severity: number;
    until: string;
  } {
    const injuries = [
      { type: 'distensão_muscular', severity: 1, days: 7 },
      { type: 'contusão', severity: 1, days: 3 },
      { type: 'fadiga_muscular', severity: 2, days: 10 },
      { type: 'lesão_leve', severity: 2, days: 14 }
    ];

    const injury = injuries[Math.floor(Math.random() * injuries.length)];
    const until = new Date();
    until.setDate(until.getDate() + injury.days);

    return {
      type: injury.type,
      severity: injury.severity,
      until: until.toISOString().split('T')[0]
    };
  }

  /**
   * Calcular mudança de moral
   */
  private calculateMoraleChange(player: PlayerDevelopmentData): number {
    let change = 0;

    // Moral base aumenta ligeiramente se treina
    if (player.is_in_academy) {
      change += 1;
      
      // Personalidade preguiçosa perde moral com treino alto
      if (player.personality === 'preguicoso' && player.training_intensity === 'alta') {
        change -= 5;
      }
    }

    // Aleatoriedade semanal
    change += (Math.random() - 0.5) * 4;

    return Math.round(change);
  }

  /**
   * Calcular mudança de forma
   */
  private calculateFormChange(player: PlayerDevelopmentData, evolved: boolean): number {
    let change = 0;

    if (evolved) change += 0.2;
    if (player.is_in_academy) change += 0.1;
    
    // Aleatoriedade
    change += (Math.random() - 0.5) * 0.3;

    return Math.round(change * 10) / 10;
  }

  /**
   * Calcular overall do jogador
   */
  private calculateOverall(player: any): number {
    const attributes = [
      player.passing, player.shooting, player.dribbling,
      player.defending, player.speed, player.stamina, player.strength
    ];
    
    const validAttributes = attributes.filter(attr => typeof attr === 'number');
    if (validAttributes.length === 0) return 50;
    
    return Math.round(validAttributes.reduce((sum, attr) => sum + attr, 0) / validAttributes.length);
  }

  /**
   * Obter semana atual
   */
  private getCurrentWeek(): number {
    const now = new Date();
    return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(Math.ceil(now.getUTCDate() / 7)).padStart(2, '0')}`);
  }

  /**
   * Aplicar evolução por experiência de jogo
   */
  async applyMatchExperience(
    playerId: string, 
    minutesPlayed: number, 
    rating: number,
    matchResult: 'win' | 'draw' | 'loss'
  ): Promise<void> {
    try {
      const { data: player, error } = await supabase
        .from('game_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error || !player) return;

      const updates: any = {};
      
      // Ganho de experiência baseado nos minutos e performance
      const experienceGain = Math.floor((minutesPlayed / 90) * (rating - 5) * 10);
      updates.experience = (player.experience || 0) + Math.max(1, experienceGain);

      // Chance de evolução por jogo
      let evolutionChance = 0.05; // 5% base
      
      if (rating >= 8.0) evolutionChance = 0.2;
      else if (rating >= 7.0) evolutionChance = 0.1;
      else if (rating >= 6.5) evolutionChance = 0.05;

      // Jovens evoluem mais
      if (player.age <= 23) evolutionChance *= 1.8;
      else if (player.age >= 30) evolutionChance *= 0.4;

      // Evolução baseada no resultado
      if (Math.random() < evolutionChance) {
        const evolutionPoints = 0.5 + (rating - 6) * 0.3;
        const attributeEvolution = this.distributeEvolutionPoints(player, evolutionPoints);
        Object.assign(updates, attributeEvolution);
        
        updates.current_ability = this.calculateOverall({...player, ...attributeEvolution});
      }

      // Atualizar moral baseado no resultado
      let moraleChange = 0;
      if (matchResult === 'win') moraleChange = 3 + Math.floor(rating - 6);
      else if (matchResult === 'draw') moraleChange = 1;
      else moraleChange = -2 - Math.floor(6 - rating);

      // Personalidade influencia moral
      if (player.personality === 'temperamental') moraleChange *= 1.5;
      if (player.personality === 'lider') moraleChange = Math.max(0, moraleChange); // Líder não perde moral

      updates.morale = Math.max(1, Math.min(100, (player.morale || 60) + moraleChange));

      // Atualizar fadiga após jogo
      const matchFatigue = Math.floor((minutesPlayed / 90) * 15);
      updates.fatigue = Math.min(100, (player.fatigue || 0) + matchFatigue);

      // Aplicar atualizações
      await supabase.from('game_players').update(updates).eq('id', playerId);

    } catch (error) {
      this.logger.error('❌ Erro ao aplicar experiência de jogo:', error);
    }
  }
}
