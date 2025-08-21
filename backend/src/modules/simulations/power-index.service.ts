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
  // Ajustado para refletir que faltam 19 rodadas (metade do campeonato)
  private readonly defaultConfig: PowerIndexConfig = {
    weights: {
      points_per_game: 0.30,      // 30% - Desempenho geral (reduzido de 45%)
      goal_difference_per_game: 0.20, // 20% - Eficiência ofensiva/defensiva (reduzido de 25%)
      recent_form: 0.50,          // 50% - Forma recente (aumentado de 30% - mais importante!)
    },
    version: '2.0.0',
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
   * 2.0 pontos por jogo = 100 (muito mais realista)
   */
  private normalizePointsPerGame(pointsPerGame: number): number {
    return Math.min(100, (pointsPerGame / 2.0) * 100);
  }

  /**
   * Normaliza saldo de gols por jogo para escala 0-100
   * +1.5 gols por jogo = 100, -1.5 gols por jogo = 0 (muito mais realista)
   */
  private normalizeGoalDifferencePerGame(goalDiffPerGame: number): number {
    // Clampar entre -1.5 e +1.5 (muito mais realista)
    const clampedDiff = Math.max(-1.5, Math.min(1.5, goalDiffPerGame));
    // Converter para escala 0-100
    return ((clampedDiff + 1.5) / 3) * 100;
  }

  /**
   * Normaliza forma recente para escala 0-100
   * 2.0 pontos por jogo na forma recente = 100 (muito mais realista)
   */
  private normalizeRecentForm(recentFormScore: number): number {
    return Math.min(100, (recentFormScore / 2.0) * 100);
  }

  /**
   * Obter configuração padrão do Power Index
   */
  getDefaultConfig(): PowerIndexConfig {
    return this.defaultConfig;
  }

  /**
   * Calcula força relativa entre dois times
   * Retorna um valor entre 0.3 e 0.7 representando a probabilidade do time1 vencer
   * Versão muito mais conservadora para refletir a realidade do futebol
   */
  calculateRelativeStrength(powerIndex1: number, powerIndex2: number): number {
    const difference = powerIndex1 - powerIndex2;
    
    // Usar função muito mais suave para converter diferença em probabilidade
    // A fórmula garante que o resultado fique entre 0.3 e 0.7 (muito mais realista)
    const rawProbability = 1 / (1 + Math.exp(-difference / 50)); // Divisor muito maior = diferenças mínimas
    
    // Clampar entre 0.3 e 0.7 para evitar probabilidades extremas
    return Math.max(0.3, Math.min(0.7, rawProbability));
  }

  /**
   * Ajusta probabilidades para mandar de campo
   * Time da casa recebe bônus muito mais realista
   */
  adjustForHomeAdvantage(homeProbability: number, homeAdvantageBonus: number = 0.25): {
    homeProbability: number;
    awayProbability: number;
    drawProbability: number;
  } {
    // Aplicar bônus de casa muito mais realista (25% em vez de 15%)
    const adjustedHomeProbability = Math.min(0.8, homeProbability + homeAdvantageBonus);
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
