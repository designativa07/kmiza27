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

  // Configuração padrão dos pesos do Power Index
  private readonly defaultConfig: PowerIndexConfig = {
    weights: {
      points_per_game: 0.45,      // 45% - Desempenho geral
      goal_difference_per_game: 0.25, // 25% - Eficiência ofensiva/defensiva
      recent_form: 0.30,          // 30% - Forma recente (últimos 5 jogos)
    },
    version: '1.0.0',
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
      const powerIndex = 
        normalizedPointsPerGame * config.weights.points_per_game +
        normalizedGoalDifference * config.weights.goal_difference_per_game +
        normalizedRecentForm * config.weights.recent_form;

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
   * 3.0 pontos por jogo = 100 (máximo teórico)
   */
  private normalizePointsPerGame(pointsPerGame: number): number {
    return Math.min(100, (pointsPerGame / 3.0) * 100);
  }

  /**
   * Normaliza saldo de gols por jogo para escala 0-100
   * +3 gols por jogo = 100, -3 gols por jogo = 0
   */
  private normalizeGoalDifferencePerGame(goalDiffPerGame: number): number {
    // Clampar entre -3 e +3
    const clampedDiff = Math.max(-3, Math.min(3, goalDiffPerGame));
    // Converter para escala 0-100
    return ((clampedDiff + 3) / 6) * 100;
  }

  /**
   * Normaliza forma recente para escala 0-100
   * 3.0 pontos por jogo na forma recente = 100
   */
  private normalizeRecentForm(recentFormScore: number): number {
    return Math.min(100, (recentFormScore / 3.0) * 100);
  }

  /**
   * Obter configuração padrão do Power Index
   */
  getDefaultConfig(): PowerIndexConfig {
    return this.defaultConfig;
  }

  /**
   * Calcula força relativa entre dois times
   * Retorna um valor entre 0.1 e 0.9 representando a probabilidade do time1 vencer
   */
  calculateRelativeStrength(powerIndex1: number, powerIndex2: number): number {
    const difference = powerIndex1 - powerIndex2;
    
    // Usar função logística para converter diferença em probabilidade
    // A fórmula garante que o resultado fique entre 0.1 e 0.9
    const rawProbability = 1 / (1 + Math.exp(-difference / 20));
    
    // Clampar entre 0.1 e 0.9 para evitar probabilidades extremas
    return Math.max(0.1, Math.min(0.9, rawProbability));
  }

  /**
   * Ajusta probabilidades para mandar de campo
   * Time da casa recebe pequeno bônus
   */
  adjustForHomeAdvantage(homeProbability: number, homeAdvantageBonus: number = 0.05): {
    homeProbability: number;
    awayProbability: number;
    drawProbability: number;
  } {
    // Aplicar bônus de casa
    const adjustedHomeProbability = Math.min(0.9, homeProbability + homeAdvantageBonus);
    const remainingProbability = 1 - adjustedHomeProbability;
    
    // Distribuir probabilidade restante entre visitante e empate
    const awayProbability = remainingProbability * 0.6; // 60% para vitória visitante
    const drawProbability = remainingProbability * 0.4;  // 40% para empate

    return {
      homeProbability: adjustedHomeProbability,
      awayProbability,
      drawProbability,
    };
  }
}
