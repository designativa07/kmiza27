import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

// Interfaces para simulação
export interface TacticalSetup {
  formation: string;
  style: 'defensivo' | 'equilibrado' | 'ofensivo';
  pressing: 'baixa' | 'média' | 'alta';
  width: 'estreito' | 'normal' | 'largo';
  tempo: 'lento' | 'normal' | 'rápido';
  lineup: Array<{ slotId: string; playerId: string }>;
}

export interface PlayerMatchData {
  id: string;
  name: string;
  position: string;
  overall: number;
  
  // Atributos específicos
  passing: number;
  shooting: number;
  dribbling: number;
  defending: number;
  speed: number;
  stamina: number;
  strength: number;
  
  // Estado atual
  morale: number;
  fitness: number;
  form: number;
  fatigue: number;
  injury_severity: number;
}

export interface MatchSimulationResult {
  homeScore: number;
  awayScore: number;
  highlights: any[];
  playerRatings: Record<string, number>;
  playerStats: Record<string, any>;
  tacticalImpact: {
    homeAdvantage: number;
    tacticalBonus: number;
    individualPerformances: Record<string, number>;
  };
}

@Injectable()
export class MatchSimulationService {
  private readonly logger = new Logger(MatchSimulationService.name);

  /**
   * Simular partida com influência das táticas
   */
  async simulateMatch(
    matchId: string,
    userTeamData: { 
      players: PlayerMatchData[]; 
      tactics: TacticalSetup;
      teamId: string;
    },
    machineTeamData: {
      attributes: { overall: number; attack: number; midfield: number; defense: number; goalkeeper: number };
      name: string;
    }
  ): Promise<MatchSimulationResult> {
    this.logger.log(`🎮 Iniciando simulação da partida ${matchId}`);

    // 1. Calcular força das equipes
    const userTeamStrength = this.calculateTeamStrength(userTeamData.players, userTeamData.tactics);
    const machineTeamStrength = this.calculateMachineTeamStrength(machineTeamData.attributes);

    // 2. Aplicar modificadores táticos
    const tacticalModifiers = this.calculateTacticalModifiers(userTeamData.tactics, userTeamData.players);
    
    // 3. Simular 90 minutos de jogo
    const simulationResult = this.runMatchSimulation(
      userTeamStrength, 
      machineTeamStrength, 
      tacticalModifiers,
      userTeamData.players
    );

    // 4. Atualizar estatísticas dos jogadores
    await this.updatePlayerExperience(userTeamData.players, simulationResult.playerRatings);

    // 5. Salvar resultado da partida
    await this.saveMatchResult(matchId, simulationResult);

    this.logger.log(`⚽ Partida finalizada: ${simulationResult.homeScore} x ${simulationResult.awayScore}`);
    
    return simulationResult;
  }

  /**
   * Calcular força do time do usuário baseada nos jogadores e táticas
   */
  private calculateTeamStrength(players: PlayerMatchData[], tactics: TacticalSetup): {
    attack: number;
    midfield: number;
    defense: number;
    goalkeeper: number;
    chemistry: number;
  } {
    const lineup = tactics.lineup || [];
    const activePlayerIds = new Set(lineup.map(l => l.playerId));
    const activePlayers = players.filter(p => activePlayerIds.has(p.id));

    // Calcular por linha
    const goalkeeper = activePlayers.find(p => p.position === 'GK') || activePlayers[0];
    const defenders = activePlayers.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position));
    const midfielders = activePlayers.filter(p => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p.position));
    const attackers = activePlayers.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position));

    const avgOverall = (players: PlayerMatchData[]) => 
      players.length > 0 ? players.reduce((sum, p) => sum + this.getEffectiveOverall(p), 0) / players.length : 50;

    // Força base por linha
    const attack = avgOverall(attackers.length > 0 ? attackers : midfielders.slice(-2));
    const midfield = avgOverall(midfielders.length > 0 ? midfielders : activePlayers.slice(3, 8));
    const defense = avgOverall(defenders.length > 0 ? defenders : activePlayers.slice(-4, -1));
    const gkStrength = goalkeeper ? this.getEffectiveOverall(goalkeeper) : 50;

    // Química da equipe (baseada em moral e forma)
    const chemistry = this.calculateTeamChemistry(activePlayers);

    return {
      attack,
      midfield,
      defense,
      goalkeeper: gkStrength,
      chemistry
    };
  }

  /**
   * Calcular overall efetivo do jogador considerando estado atual
   */
  private getEffectiveOverall(player: PlayerMatchData): number {
    let effectiveOverall = player.overall;

    // Aplicar modificadores de estado
    const moraleModifier = (player.morale - 50) * 0.3; // -15 a +15
    const fitnessModifier = (player.fitness - 80) * 0.2; // -4 a +4
    const formModifier = (player.form - 5) * 2; // -10 a +10
    const fatigueModifier = -player.fatigue * 0.5; // Fadiga reduz performance
    const injuryModifier = -player.injury_severity * 2; // Lesão reduz severamente

    effectiveOverall += moraleModifier + fitnessModifier + formModifier + fatigueModifier + injuryModifier;

    return Math.max(1, Math.min(99, effectiveOverall));
  }

  /**
   * Calcular modificadores táticos
   */
  private calculateTacticalModifiers(tactics: TacticalSetup, players: PlayerMatchData[]): {
    attackBonus: number;
    midfieldBonus: number;
    defenseBonus: number;
    cohesion: number;
  } {
    let attackBonus = 0;
    let midfieldBonus = 0;
    let defenseBonus = 0;
    let cohesion = 70; // Base

    // Modificadores por estilo
    switch (tactics.style) {
      case 'ofensivo':
        attackBonus += 15;
        midfieldBonus += 5;
        defenseBonus -= 10;
        break;
      case 'defensivo':
        attackBonus -= 10;
        midfieldBonus += 5;
        defenseBonus += 15;
        break;
      case 'equilibrado':
        attackBonus += 2;
        midfieldBonus += 8;
        defenseBonus += 2;
        break;
    }

    // Modificadores por formação
    switch (tactics.formation) {
      case '4-4-2':
        cohesion += 10; // Formação clássica, boa coesão
        midfieldBonus += 5;
        break;
      case '4-3-3':
        attackBonus += 8;
        defenseBonus -= 3;
        break;
      case '4-2-3-1':
        midfieldBonus += 8;
        defenseBonus += 3;
        break;
      case '3-5-2':
        midfieldBonus += 12;
        defenseBonus -= 5;
        break;
      case '5-3-2':
        defenseBonus += 12;
        attackBonus -= 8;
        break;
    }

    // Modificadores por pressing
    switch (tactics.pressing) {
      case 'alta':
        midfieldBonus += 8;
        defenseBonus += 5;
        cohesion -= 5; // Mais desgastante
        break;
      case 'baixa':
        defenseBonus += 8;
        attackBonus -= 5;
        cohesion += 5;
        break;
    }

    // Ajustar pela qualidade dos jogadores (jogadores melhores executam melhor as táticas)
    const avgOverall = players.reduce((sum, p) => sum + this.getEffectiveOverall(p), 0) / players.length;
    const tacticalExecution = (avgOverall - 50) * 0.1; // Melhor execução com jogadores melhores

    return {
      attackBonus: attackBonus + tacticalExecution,
      midfieldBonus: midfieldBonus + tacticalExecution,
      defenseBonus: defenseBonus + tacticalExecution,
      cohesion: Math.max(30, Math.min(100, cohesion + tacticalExecution))
    };
  }

  /**
   * Calcular química da equipe
   */
  private calculateTeamChemistry(players: PlayerMatchData[]): number {
    const avgMorale = players.reduce((sum, p) => sum + p.morale, 0) / players.length;
    const avgForm = players.reduce((sum, p) => sum + p.form, 0) / players.length;
    
    // Química baseada em moral e forma da equipe
    const chemistry = (avgMorale * 0.6 + avgForm * 10 * 0.4);
    
    return Math.max(30, Math.min(100, chemistry));
  }

  /**
   * Calcular força do time da máquina
   */
  private calculateMachineTeamStrength(attributes: any): {
    attack: number;
    midfield: number;
    defense: number;
    goalkeeper: number;
    chemistry: number;
  } {
    return {
      attack: attributes.attack || attributes.overall || 75,
      midfield: attributes.midfield || attributes.overall || 75,
      defense: attributes.defense || attributes.overall || 75,
      goalkeeper: attributes.goalkeeper || attributes.overall || 75,
      chemistry: 70 // Química padrão para times da máquina
    };
  }

  /**
   * Executar simulação dos 90 minutos
   */
  private runMatchSimulation(
    userTeam: any,
    machineTeam: any,
    modifiers: any,
    players: PlayerMatchData[]
  ): MatchSimulationResult {
    let homeScore = 0;
    let awayScore = 0;
    const highlights: any[] = [];
    const playerRatings: Record<string, number> = {};
    const playerStats: Record<string, any> = {};

    // Aplicar modificadores táticos
    const userAttack = userTeam.attack + modifiers.attackBonus;
    const userMidfield = userTeam.midfield + modifiers.midfieldBonus;
    const userDefense = userTeam.defense + modifiers.defenseBonus;

    // Simular 18 períodos de 5 minutos cada
    for (let period = 0; period < 18; period++) {
      const minute = period * 5 + Math.floor(Math.random() * 5);

      // Calcular chances de gol
      const userChance = this.calculateGoalChance(userAttack, machineTeam.defense, userTeam.chemistry);
      const machineChance = this.calculateGoalChance(machineTeam.attack, userDefense, machineTeam.chemistry);

      // Verificar gols
      if (Math.random() < userChance) {
        homeScore++;
        const scorer = this.selectGoalScorer(players.filter(p => ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(p.position)));
        highlights.push({
          minute,
          type: 'goal',
          team: 'home',
          player: scorer?.name || 'Jogador',
          description: `⚽ Gol! ${scorer?.name} marca para o time!`
        });
      }

      if (Math.random() < machineChance) {
        awayScore++;
        highlights.push({
          minute,
          type: 'goal',
          team: 'away',
          description: `⚽ Gol do time adversário!`
        });
      }
    }

    // Calcular ratings dos jogadores baseado na performance
    players.forEach(player => {
      const baseRating = 6.0;
      const performanceVariation = (Math.random() - 0.5) * 2; // -1 a +1
      const tacticalBonus = modifiers.cohesion > 75 ? 0.5 : 0;
      
      playerRatings[player.id] = Math.max(1, Math.min(10, 
        baseRating + performanceVariation + tacticalBonus + (homeScore > awayScore ? 0.5 : 0)
      ));

      playerStats[player.id] = {
        minutesPlayed: 90,
        goals: player.position.includes('ST') || player.position.includes('CF') ? 
          Math.floor(Math.random() * (homeScore + 1)) : 0,
        assists: Math.floor(Math.random() * 2),
        yellowCards: Math.random() < 0.1 ? 1 : 0,
        redCards: Math.random() < 0.02 ? 1 : 0
      };
    });

    return {
      homeScore,
      awayScore,
      highlights,
      playerRatings,
      playerStats,
      tacticalImpact: {
        homeAdvantage: 0,
        tacticalBonus: modifiers.cohesion - 70,
        individualPerformances: playerRatings
      }
    };
  }

  /**
   * Calcular chance de gol baseada nas forças
   */
  private calculateGoalChance(attack: number, defense: number, chemistry: number): number {
    const attackStrength = attack + (chemistry - 70) * 0.2;
    const defenseStrength = defense;
    
    const difference = attackStrength - defenseStrength;
    const baseChance = 0.02; // 2% base por período
    
    // Ajustar chance baseado na diferença
    const chanceModifier = difference * 0.0005; // 0.05% por ponto de diferença
    
    return Math.max(0, Math.min(0.15, baseChance + chanceModifier)); // Max 15% por período
  }

  /**
   * Selecionar quem marca o gol
   */
  private selectGoalScorer(attackers: PlayerMatchData[]): PlayerMatchData | null {
    if (attackers.length === 0) return null;
    
    // Jogadores com mais shooting têm mais chance
    const weights = attackers.map(p => p.shooting + Math.random() * 20);
    const maxWeight = Math.max(...weights);
    const scorerIndex = weights.indexOf(maxWeight);
    
    return attackers[scorerIndex];
  }

  /**
   * Atualizar experiência dos jogadores após a partida
   */
  private async updatePlayerExperience(players: PlayerMatchData[], ratings: Record<string, number>): Promise<void> {
    try {
      const updates = players.map(player => {
        const rating = ratings[player.id] || 6.0;
        const experienceGain = this.calculateExperienceGain(player, rating);
        const newExperience = (player as any).experience || 0 + experienceGain;
        
        // Chance de evolução baseada na performance
        const evolutionChance = this.calculateEvolutionChance(player, rating);
        let attributeBonus = {};
        
        if (Math.random() < evolutionChance) {
          attributeBonus = this.generateAttributeEvolution(player, rating);
        }

        return {
          id: player.id,
          experience: newExperience,
          games_played: (player as any).games_played + 1,
          average_rating: ((player as any).average_rating * (player as any).games_played + rating) / ((player as any).games_played + 1),
          ...attributeBonus
        };
      });

      // Atualizar no banco
      for (const update of updates) {
        await supabase.from('game_players').update(update).eq('id', update.id);
      }

    } catch (error) {
      this.logger.error('❌ Erro ao atualizar experiência dos jogadores:', error);
    }
  }

  /**
   * Calcular ganho de experiência
   */
  private calculateExperienceGain(player: PlayerMatchData, rating: number): number {
    const baseGain = 10;
    const ratingBonus = (rating - 6.0) * 5; // Bônus por boa performance
    const ageModifier = player.overall < 25 ? 1.5 : player.overall > 30 ? 0.8 : 1.0;
    
    return Math.max(1, baseGain + ratingBonus * ageModifier);
  }

  /**
   * Calcular chance de evolução após partida
   */
  private calculateEvolutionChance(player: PlayerMatchData, rating: number): number {
    let baseChance = 0.05; // 5% base
    
    // Bônus por boa performance
    if (rating >= 8.0) baseChance += 0.15;
    else if (rating >= 7.0) baseChance += 0.08;
    else if (rating >= 6.5) baseChance += 0.03;
    
    // Modificador por idade
    if (player.overall < 23) baseChance *= 1.8; // Jovens evoluem mais
    else if (player.overall > 30) baseChance *= 0.4; // Veteranos evoluem menos
    
    // Modificador por moral
    const moraleModifier = (player.morale - 50) * 0.002;
    baseChance += moraleModifier;
    
    return Math.max(0, Math.min(0.3, baseChance)); // Max 30%
  }

  /**
   * Gerar evolução de atributos
   */
  private generateAttributeEvolution(player: PlayerMatchData, rating: number): any {
    const evolution: any = {};
    const positionFocus = this.getPositionFocusAttributes(player.position);
    
    // Evoluir 1-3 atributos relacionados à posição
    const attributesToEvolve = Math.min(3, Math.floor(Math.random() * 3) + 1);
    
    for (let i = 0; i < attributesToEvolve; i++) {
      const attribute = positionFocus[Math.floor(Math.random() * positionFocus.length)];
      const currentValue = (player as any)[attribute] || 50;
      
      // Ganho baseado no rating da partida
      const gain = Math.floor((rating - 5) / 2) + Math.floor(Math.random() * 2) + 1;
      const newValue = Math.min(99, currentValue + gain);
      
      if (newValue > currentValue) {
        evolution[attribute] = newValue;
      }
    }
    
    return evolution;
  }

  /**
   * Obter atributos focais por posição
   */
  private getPositionFocusAttributes(position: string): string[] {
    const focusMap: Record<string, string[]> = {
      'GK': ['goalkeeping', 'concentration', 'jumping'],
      'CB': ['defending', 'tackling', 'heading', 'strength'],
      'LB': ['speed', 'stamina', 'defending', 'crossing'],
      'RB': ['speed', 'stamina', 'defending', 'crossing'],
      'CDM': ['tackling', 'defending', 'passing', 'concentration'],
      'CM': ['passing', 'stamina', 'vision', 'dribbling'],
      'CAM': ['passing', 'shooting', 'dribbling', 'vision'],
      'LW': ['speed', 'dribbling', 'crossing', 'shooting'],
      'RW': ['speed', 'dribbling', 'crossing', 'shooting'],
      'ST': ['shooting', 'finishing', 'strength', 'dribbling'],
      'CF': ['shooting', 'finishing', 'dribbling', 'passing']
    };
    
    return focusMap[position] || ['passing', 'shooting', 'defending'];
  }

  /**
   * Salvar resultado da partida
   */
  private async saveMatchResult(matchId: string, result: MatchSimulationResult): Promise<void> {
    try {
      await supabase
        .from('game_season_matches')
        .update({
          home_score: result.homeScore,
          away_score: result.awayScore,
          status: 'finished',
          highlights: result.highlights,
          simulation_data: {
            playerRatings: result.playerRatings,
            playerStats: result.playerStats,
            tacticalImpact: result.tacticalImpact
          },
          finished_at: new Date().toISOString()
        })
        .eq('id', matchId);

    } catch (error) {
      this.logger.error('❌ Erro ao salvar resultado da partida:', error);
    }
  }
}
