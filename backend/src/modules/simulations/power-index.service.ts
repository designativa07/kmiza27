import { Injectable, Logger } from '@nestjs/common';
import { StandingsService } from '../standings/standings.service';
import { PowerIndexEntry } from '../../entities/simulation-result.entity';

export interface PowerIndexWeights {
  points_per_game: number;
  goal_difference_per_game: number;
  recent_form: number;
}

export interface PowerIndexConfig {
  weights: PowerIndexWeights;
  version: string;
}

@Injectable()
export class PowerIndexService {
  private readonly logger = new Logger(PowerIndexService.name);
  
  // VERSÃO 4.0.0 - CORREÇÕES MAIS AGRESSIVAS
  private readonly VERSION = '4.0.0';
  
  // NOVOS PESOS MAIS BALANCEADOS
  private readonly POINTS_PER_GAME_WEIGHT = 0.60; // Era 0.45, agora 0.60
  private readonly GOAL_DIFFERENCE_WEIGHT = 0.20; // Era 0.25, agora 0.20
  private readonly RECENT_FORM_WEIGHT = 0.20;     // Era 0.30, agora 0.20

  // Configuração padrão dos pesos do Power Index
  // Ajustado para refletir que faltam 19 rodadas (metade do campeonato)
  private readonly defaultConfig: PowerIndexConfig = {
    weights: {
      points_per_game: 0.60,      // 60% - Desempenho geral (aumentado de 45%)
      goal_difference_per_game: 0.20, // 20% - Eficiência ofensiva/defensiva (reduzido de 25%)
      recent_form: 0.20,          // 20% - Forma recente (reduzido de 30% - mais equilibrado!)
    },
    version: '4.0.0', // Nova versão com correções mais agressivas
  };

  constructor(private readonly standingsService: StandingsService) {}

  /**
   * Calcula o Power Index para todos os times de uma competição
   */
  async calculatePowerIndexForCompetition(
    competitionId: number,
    config: PowerIndexConfig = this.defaultConfig,
  ): Promise<PowerIndexEntry[]> {
    this.logger.log(`Calculando Power Index para competição ${competitionId}`);

    // Buscar classificação atual da competição
    const standings = await this.standingsService.getCompetitionStandings(competitionId);

    if (!standings || standings.length === 0) {
      throw new Error(`Nenhum dado de classificação encontrado para a competição ${competitionId}`);
    }

    const powerIndexEntries: PowerIndexEntry[] = [];

    for (const standing of standings) {
      if (standing.played === 0) {
        // Se o time não jogou nenhuma partida, usar valores padrão
        powerIndexEntries.push({
          team_id: standing.team.id,
          team_name: standing.team.name,
          power_index: 50.0, // Valor neutro
          points_per_game: 0,
          goal_difference_per_game: 0,
          recent_form_score: 0,
          games_played: 0,
          points: 0,
          goal_difference: 0,
        });
        continue;
      }

      // 1. Calcular métricas base
      const pointsPerGame = standing.points / standing.played;
      const goalDifferencePerGame = standing.goal_difference / standing.played;
      const recentFormScore = this.calculateRecentFormScore(standing.form);

      // 2. Normalizar métricas (0-100)
      const normalizedPointsPerGame = this.normalizePointsPerGame(pointsPerGame);
      const normalizedGoalDifference = this.normalizeGoalDifferencePerGame(goalDifferencePerGame);
      const normalizedRecentForm = this.normalizeRecentForm(recentFormScore);

      // 3. Calcular Power Index final
      let powerIndex = 
        normalizedPointsPerGame * config.weights.points_per_game +
        normalizedGoalDifference * config.weights.goal_difference_per_game +
        normalizedRecentForm * config.weights.recent_form;

      // 4. APLICAR BONUS MODERADOS DE ESPERANÇA E SOBREVIVÊNCIA (V5.0.0)
      const teamPosition = standings.indexOf(standing) + 1;
      const hopeBonus = this.calculateHopeBonusRealistic(teamPosition, standing.points, 38 - standing.played);
      const survivalBonus = this.calculateSurvivalBonusRealistic(standing.points, 38 - standing.played);
      
      // Aplicar bonus REDUZIDOS ao power index final
      powerIndex += (hopeBonus + survivalBonus) * 8; // Reduzido de 20 para 8
      
      // Garantir limites SUPER comprimidos (entre 45 e 65) para MÁXIMO equilíbrio
      powerIndex = Math.max(45, Math.min(65, powerIndex));

      powerIndexEntries.push({
        team_id: standing.team.id,
        team_name: standing.team.name,
        power_index: Math.round(powerIndex * 100) / 100, // 2 casas decimais
        points_per_game: Math.round(pointsPerGame * 100) / 100,
        goal_difference_per_game: Math.round(goalDifferencePerGame * 100) / 100,
        recent_form_score: recentFormScore,
        games_played: standing.played,
        points: standing.points,
        goal_difference: standing.goal_difference,
      });
    }

    // Ordenar por Power Index (decrescente)
    powerIndexEntries.sort((a, b) => b.power_index - a.power_index);

    this.logger.log(`Power Index calculado para ${powerIndexEntries.length} times`);
    return powerIndexEntries;
  }

  /**
   * Calcula pontuação da forma recente baseada na string de resultados
   * W = Vitória (3 pontos), D = Empate (1 ponto), L = Derrota (0 pontos)
   */
  private calculateRecentFormScore(form: string): number {
    if (!form || form.length === 0) return 0;

    let totalPoints = 0;
    const games = form.split('');

    for (const result of games) {
      switch (result.toUpperCase()) {
        case 'W':
          totalPoints += 3;
          break;
        case 'D':
          totalPoints += 1;
          break;
        case 'L':
          totalPoints += 0;
          break;
      }
    }

    // Retornar pontuação média por jogo
    return games.length > 0 ? totalPoints / games.length : 0;
  }

  /**
   * Normaliza pontos por jogo para escala 0-100
   * 2.5 pontos por jogo = 100 (mais realista para Brasileirão)
   */
  private normalizePointsPerGame(pointsPerGame: number): number {
    // NORMALIZAÇÃO MAIS GENEROSA - 2.0 pts/jogo = 100%
    const normalized = (pointsPerGame / 2.0) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Normaliza saldo de gols por jogo para escala 0-100
   * +1.0 gol por jogo = 100, -1.0 gol por jogo = 0 (mais realista)
   */
  private normalizeGoalDifferencePerGame(goalDifferencePerGame: number): number {
    // NORMALIZAÇÃO MAIS GENEROSA - Range [-1.0, 1.0] gols/jogo
    const clamped = Math.max(-1.0, Math.min(1.0, goalDifferencePerGame));
    const normalized = ((clamped + 1.0) / 2.0) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Normaliza forma recente para escala 0-100
   * 2.5 pontos por jogo na forma recente = 100 (mais realista)
   */
  private normalizeRecentForm(recentForm: number): number {
    // NORMALIZAÇÃO MAIS GENEROSA - 2.0 pts/jogo = 100%
    const normalized = (recentForm / 2.0) * 100;
    return Math.max(0, Math.min(100, normalized));
  }

  /**
   * Obter configuração padrão do Power Index
   */
  getDefaultConfig(): PowerIndexConfig {
    return this.defaultConfig;
  }



  /**
   * Ajusta probabilidades para mandar de campo
   * Time da casa recebe bônus mais realista
   */
  adjustForHomeAdvantage(homeProbability: number, homeAdvantageBonus: number = 0.20): {
    homeProbability: number;
    awayProbability: number;
    drawProbability: number;
  } {
    // Aplicar bônus de casa mais realista (20% em vez de 25%)
    const adjustedHomeProbability = Math.min(0.75, homeProbability + homeAdvantageBonus);
    const remainingProbability = 1 - adjustedHomeProbability;
    
    // Distribuir probabilidade restante entre visitante e empate
    const awayProbability = remainingProbability * 0.65; // 65% para vitória visitante
    const drawProbability = remainingProbability * 0.35;  // 35% para empate

    return {
      homeProbability: adjustedHomeProbability,
      awayProbability,
      drawProbability,
    };
  }

  // VERSÃO 5.0.0: BONUS DE ESPERANÇA REALISTA PARA TIMES NA ZONA
  private calculateHopeBonusRealistic(teamPosition: number, teamPoints: number, gamesRemaining: number): number {
    let bonus = 0;
    
    // Fator de tempo: menos bonus com muitos jogos restantes
    const timeReductionFactor = Math.max(0.4, (38 - gamesRemaining) / 38);
    
    // Times na zona de rebaixamento (17º-20º) - bonus muito reduzido
    if (teamPosition >= 17) {
      const baseBonus = 0.15 + (0.10 * (20 - teamPosition)); // 0.15 a 0.25 (reduzido)
      bonus = baseBonus * timeReductionFactor;
    }
    // Times próximos da zona - bonus mínimo
    else if (teamPoints < 25) {
      const pointsFromSafety = 25 - teamPoints;
      const baseBonus = 0.05 + (0.10 * (pointsFromSafety / 10)); // 0.05 a 0.15
      bonus = baseBonus * timeReductionFactor;
    }
    
    return bonus;
  }

  // VERSÃO 5.0.0: BONUS DE SOBREVIVÊNCIA REALISTA
  private calculateSurvivalBonusRealistic(teamPoints: number, gamesRemaining: number): number {
    if (teamPoints >= 15) return 0;
    
    // Fator de tempo: menos urgência com muitos jogos restantes
    const urgencyFactor = Math.max(0.3, (38 - gamesRemaining) / 38);
    
    // Times com muito poucos pontos recebem bonus mínimo
    const pointsDeficit = Math.max(0, 15 - teamPoints);
    const baseBonus = Math.min(0.15, (pointsDeficit / 15) * 0.15); // Máximo 15%
    
    return baseBonus * urgencyFactor;
  }

  /**
   * Calcula força relativa entre dois times
   * Retorna um valor entre 0.2 e 0.8 representando a probabilidade do time1 vencer
   * Versão mais conservadora para refletir a realidade do futebol
   */
  calculateRelativeStrength(powerIndex1: number, powerIndex2: number): number {
    const difference = powerIndex1 - powerIndex2;
    
    // Usar função mais suave para converter diferença em probabilidade
    // A fórmula garante que o resultado fique entre 0.2 e 0.8 (mais realista)
    const rawProbability = 1 / (1 + Math.exp(-difference / 100)); // Divisor maior = diferenças menores
    
    // Clampar entre 0.2 e 0.8 para evitar probabilidades extremas
    return Math.max(0.2, Math.min(0.8, rawProbability));
  }
}
