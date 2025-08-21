import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../entities/match.entity';
import { Team } from '../../entities/team.entity';
import { PowerIndexEntry, TeamPrediction } from '../../entities/simulation-result.entity';
import { PowerIndexService } from './power-index.service';
import { StandingsService } from '../standings/standings.service';
import { MatchStatus } from '../../entities/match.entity';
import { MatchesService } from '../matches/matches.service';

export interface SimulationMatch {
  id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: Date;
  status: string;
  home_score?: number;
  away_score?: number;
}

export interface SimulationTeam {
  id: number;
  name: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

export interface MonteCarloResult {
  simulations: number;
  predictions: TeamPrediction[];
  execution_time_ms: number;
}

@Injectable()
export class MonteCarloService {
  private readonly logger = new Logger(MonteCarloService.name);

  constructor(
    private readonly powerIndexService: PowerIndexService,
    private readonly standingsService: StandingsService,
    @Inject(forwardRef(() => MatchesService))
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Executa a simulação Monte Carlo para uma competição
   */
  async runSimulation(
    competitionId: number,
    powerIndexData: PowerIndexEntry[],
    simulationCount: number = 1000,
  ): Promise<MonteCarloResult> {
    const startTime = Date.now();
    this.logger.log(`Iniciando simulação Monte Carlo: ${simulationCount} iterações para competição ${competitionId}`);

    // 1. Buscar TODAS as partidas da competição
    const allMatches = await this.getRemainingMatches(competitionId);
    this.logger.log(`Encontradas ${allMatches.length} partidas no total`);

    // 2. Calcular estatísticas iniciais baseado nos jogos finalizados
    const initialTeamStates = await this.calculateInitialStatsFromMatches(allMatches);
    this.logger.log(`Estatísticas iniciais calculadas para ${initialTeamStates.length} times`);

    // 3. Criar mapa de Power Index por time
    const powerIndexMap = new Map<number, number>();
    powerIndexData.forEach(entry => {
      powerIndexMap.set(entry.team_id, entry.power_index);
    });

    // 4. Executar simulações
    const simulationResults: SimulationTeam[][] = [];
    
    for (let i = 0; i < simulationCount; i++) {
      const simulationTeams = this.cloneTeamStates(initialTeamStates);
      this.simulateRemainingMatches(allMatches, simulationTeams, powerIndexMap);
      this.sortTeamsByPosition(simulationTeams);
      simulationResults.push(simulationTeams);

      // Log de progresso a cada 1000 simulações
      if ((i + 1) % 1000 === 0) {
        this.logger.log(`Progresso: ${i + 1}/${simulationCount} simulações concluídas`);
      }
    }

    // 5. Calcular estatísticas finais
    const predictions = this.calculatePredictions(simulationResults, competitionId);

    const executionTime = Date.now() - startTime;
    this.logger.log(`Simulação concluída em ${executionTime}ms`);

    return {
      simulations: simulationCount,
      predictions,
      execution_time_ms: executionTime,
    };
  }

  /**
   * Busca TODAS as partidas de uma competição para simulação
   * Inclui jogos finalizados (para estatísticas) e não finalizados (para simular)
   */
  private async getRemainingMatches(competitionId: number): Promise<SimulationMatch[]> {
    // Buscar TODOS os jogos da competição, independente do status
    const allMatches = await this.matchesService.findAllCompetitionMatches(competitionId);

    return allMatches.map(match => ({
      id: match.id,
      home_team_id: match.home_team.id,
      away_team_id: match.away_team.id,
      match_date: match.match_date,
      status: match.status, // Incluir status para lógica de simulação
      home_score: match.home_score, // Incluir placar se finalizado
      away_score: match.away_score,
    }));
  }

  /**
   * Converte standings para formato de simulação
   */
  private convertStandingsToSimulationFormat(standings: any[]): SimulationTeam[] {
    return standings.map(standing => ({
      id: standing.team.id,
      name: standing.team.name,
      points: standing.points,
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goals_for: standing.goals_for,
      goals_against: standing.goals_against,
      goal_difference: standing.goal_difference,
    }));
  }

  /**
   * Calcula estatísticas iniciais baseado nos jogos finalizados
   */
  private async calculateInitialStatsFromMatches(matches: SimulationMatch[]): Promise<SimulationTeam[]> {
    const teamMap = new Map<number, SimulationTeam>();

    matches.forEach(match => {
      const homeTeamId = match.home_team_id;
      const awayTeamId = match.away_team_id;

      if (!teamMap.has(homeTeamId)) {
        teamMap.set(homeTeamId, {
          id: homeTeamId,
          name: 'Unknown', // Placeholder, will be updated later
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
        });
      }
      if (!teamMap.has(awayTeamId)) {
        teamMap.set(awayTeamId, {
          id: awayTeamId,
          name: 'Unknown', // Placeholder, will be updated later
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
        });
      }

      const homeTeam = teamMap.get(homeTeamId)!;
      const awayTeam = teamMap.get(awayTeamId)!;

      if (match.status === 'finished' && match.home_score !== undefined && match.away_score !== undefined) {
        this.updateTeamStatsFromRealMatch(homeTeam, awayTeam, match.home_score, match.away_score);
      }
    });

    // Buscar nomes dos times do banco
    const teamNames = await this.getTeamNames(Array.from(teamMap.keys()));

    // Sort teams by ID to ensure consistent order
    const sortedTeams = Array.from(teamMap.values()).sort((a, b) => a.id - b.id);

    return sortedTeams.map(team => ({
      ...team,
      name: teamNames.get(team.id) || 'Unknown',
    }));
  }

  /**
   * Busca nomes dos times por IDs
   */
  private async getTeamNames(teamIds: number[]): Promise<Map<number, string>> {
    const teamNames = new Map<number, string>();
    
    try {
      // Buscar todos os jogos uma única vez
      const allMatches = await this.matchesService.findAllCompetitionMatches(1); // Brasileirão
      
      // Extrair nomes dos times dos jogos
      allMatches.forEach(match => {
        if (!teamNames.has(match.home_team.id)) {
          teamNames.set(match.home_team.id, match.home_team.name);
        }
        if (!teamNames.has(match.away_team.id)) {
          teamNames.set(match.away_team.id, match.away_team.name);
        }
      });
      
      // Garantir que todos os IDs solicitados tenham um nome
      teamIds.forEach(teamId => {
        if (!teamNames.has(teamId)) {
          teamNames.set(teamId, `Time ${teamId}`);
        }
      });
    } catch (error) {
      // Fallback: usar IDs como nomes
      teamIds.forEach(teamId => {
        teamNames.set(teamId, `Time ${teamId}`);
      });
    }
    
    return teamNames;
  }

  /**
   * Simula todas as partidas restantes para uma iteração
   * Jogos já finalizados são usados para estatísticas iniciais
   * Apenas jogos não finalizados são simulados
   */
  private simulateRemainingMatches(
    matches: SimulationMatch[],
    teams: SimulationTeam[],
    powerIndexMap: Map<number, number>,
  ): void {
    const teamMap = new Map<number, SimulationTeam>();
    teams.forEach(team => teamMap.set(team.id, team));

    for (const match of matches) {
      const homeTeam = teamMap.get(match.home_team_id);
      const awayTeam = teamMap.get(match.away_team_id);

      if (!homeTeam || !awayTeam) continue;

      // Se o jogo já foi finalizado, usar o resultado real
      if (match.status === 'finished' && match.home_score !== undefined && match.away_score !== undefined) {
        this.updateTeamStatsFromRealMatch(homeTeam, awayTeam, match.home_score, match.away_score);
        continue; // Pular para o próximo jogo
      }

      // Se o jogo não foi finalizado, simular o resultado
      // Obter Power Index dos times
      const homePowerIndex = powerIndexMap.get(match.home_team_id) || 50;
      const awayPowerIndex = powerIndexMap.get(match.away_team_id) || 50;

      // Calcular probabilidades do jogo
      const homeProbability = this.powerIndexService.calculateRelativeStrength(homePowerIndex, awayPowerIndex);
      const gameProbs = this.powerIndexService.adjustForHomeAdvantage(homeProbability);

      // Simular resultado
      const result = this.simulateMatchResult(gameProbs);
      
      // Atualizar estatísticas dos times
      this.updateTeamStats(homeTeam, awayTeam, result);
    }
  }

  /**
   * Simula o resultado de uma partida baseado nas probabilidades
   */
  private simulateMatchResult(probabilities: {
    homeProbability: number;
    awayProbability: number;
    drawProbability: number;
  }): 'home' | 'away' | 'draw' {
    const random = Math.random();
    
    if (random < probabilities.homeProbability) {
      return 'home';
    } else if (random < probabilities.homeProbability + probabilities.drawProbability) {
      return 'draw';
    } else {
      return 'away';
    }
  }

  /**
   * Atualiza estatísticas dos times após um jogo simulado
   */
  private updateTeamStats(
    homeTeam: SimulationTeam,
    awayTeam: SimulationTeam,
    result: 'home' | 'away' | 'draw',
  ): void {
    // Simular placar baseado no resultado
    let homeGoals = 0;
    let awayGoals = 0;

    switch (result) {
      case 'home':
        homeGoals = Math.floor(Math.random() * 3) + 1; // 1-3 gols
        awayGoals = Math.floor(Math.random() * homeGoals); // 0 a homeGoals-1
        break;
      case 'away':
        awayGoals = Math.floor(Math.random() * 3) + 1; // 1-3 gols
        homeGoals = Math.floor(Math.random() * awayGoals); // 0 a awayGoals-1
        break;
      case 'draw':
        const drawGoals = Math.floor(Math.random() * 4); // 0-3 gols cada
        homeGoals = drawGoals;
        awayGoals = drawGoals;
        break;
    }

    // Atualizar estatísticas do time da casa
    homeTeam.played++;
    homeTeam.goals_for += homeGoals;
    homeTeam.goals_against += awayGoals;
    homeTeam.goal_difference = homeTeam.goals_for - homeTeam.goals_against;

    // Atualizar estatísticas do time visitante
    awayTeam.played++;
    awayTeam.goals_for += awayGoals;
    awayTeam.goals_against += homeGoals;
    awayTeam.goal_difference = awayTeam.goals_for - awayTeam.goals_against;

    // Atualizar pontos e resultados
    if (result === 'home') {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (result === 'away') {
      awayTeam.won++;
      awayTeam.points += 3;
      homeTeam.lost++;
    } else {
      homeTeam.drawn++;
      homeTeam.points += 1;
      awayTeam.drawn++;
      awayTeam.points += 1;
    }
  }

  /**
   * Atualiza estatísticas dos times com base em um jogo real finalizado
   */
  private updateTeamStatsFromRealMatch(
    homeTeam: SimulationTeam,
    awayTeam: SimulationTeam,
    homeScore: number,
    awayScore: number,
  ): void {
    homeTeam.played++;
    homeTeam.goals_for += homeScore;
    homeTeam.goals_against += awayScore;
    homeTeam.goal_difference = homeTeam.goals_for - homeTeam.goals_against;

    awayTeam.played++;
    awayTeam.goals_for += awayScore;
    awayTeam.goals_against += homeScore;
    awayTeam.goal_difference = awayTeam.goals_for - awayTeam.goals_against;

    if (homeScore > awayScore) {
      homeTeam.won++;
      homeTeam.points += 3;
      awayTeam.lost++;
    } else if (homeScore < awayScore) {
      awayTeam.won++;
      awayTeam.points += 3;
      homeTeam.lost++;
    } else {
      homeTeam.drawn++;
      homeTeam.points += 1;
      awayTeam.drawn++;
      awayTeam.points += 1;
    }
  }

  /**
   * Ordena times por critério de classificação
   */
  private sortTeamsByPosition(teams: SimulationTeam[]): void {
    teams.sort((a, b) => {
      // 1º critério: Pontos
      if (a.points !== b.points) return b.points - a.points;
      
      // 2º critério: Saldo de gols
      if (a.goal_difference !== b.goal_difference) return b.goal_difference - a.goal_difference;
      
      // 3º critério: Gols marcados
      if (a.goals_for !== b.goals_for) return b.goals_for - a.goals_for;
      
      // 4º critério: Menos gols sofridos
      return a.goals_against - b.goals_against;
    });
  }

  /**
   * Calcula as previsões finais baseadas em todas as simulações
   */
  private calculatePredictions(
    simulationResults: SimulationTeam[][],
    competitionId: number,
  ): TeamPrediction[] {
    const teamIds = new Set<number>();
    simulationResults[0].forEach(team => teamIds.add(team.id));

    const predictions: TeamPrediction[] = [];

    for (const teamId of teamIds) {
      const teamName = simulationResults[0].find(t => t.id === teamId)?.name || 'Unknown';
      
      // Coletar dados de todas as simulações para este time
      const positions: number[] = [];
      const finalPoints: number[] = [];
      const positionCounts = new Map<number, number>();

      simulationResults.forEach(simulation => {
        const teamIndex = simulation.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
          const position = teamIndex + 1;
          positions.push(position);
          finalPoints.push(simulation[teamIndex].points);
          
          positionCounts.set(position, (positionCounts.get(position) || 0) + 1);
        }
      });

      // Calcular probabilidades
      const totalSimulations = simulationResults.length;
      const titleProbability = (positionCounts.get(1) || 0) / totalSimulations * 100;
      
      // Para Brasileirão: rebaixamento = posições 17-20
      const relegationPositions = [17, 18, 19, 20];
      const relegationCount = relegationPositions.reduce((sum, pos) => sum + (positionCounts.get(pos) || 0), 0);
      const relegationProbability = relegationCount / totalSimulations * 100;

      // G4 (Libertadores) = posições 1-4
      const top4Positions = [1, 2, 3, 4];
      const top4Count = top4Positions.reduce((sum, pos) => sum + (positionCounts.get(pos) || 0), 0);
      const top4Probability = top4Count / totalSimulations * 100;

      // G6 (Sul-Americana) = posições 5-6
      const top6Positions = [5, 6];
      const top6Count = top6Positions.reduce((sum, pos) => sum + (positionCounts.get(pos) || 0), 0);
      const top6Probability = top6Count / totalSimulations * 100;

      // Calcular médias
      const averageFinalPosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
      const averageFinalPoints = finalPoints.reduce((sum, pts) => sum + pts, 0) / finalPoints.length;

      // Converter contagem de posições para percentuais
      const positionDistribution: { [position: number]: number } = {};
      positionCounts.forEach((count, position) => {
        positionDistribution[position] = (count / totalSimulations) * 100;
      });

      // Obter posição atual (da primeira simulação como referência)
      const currentPosition = simulationResults[0].findIndex(t => t.id === teamId) + 1;

      predictions.push({
        team_id: teamId,
        team_name: teamName,
        current_position: currentPosition,
        title_probability: Math.round(titleProbability * 100) / 100,
        relegation_probability: Math.round(relegationProbability * 100) / 100,
        top4_probability: Math.round(top4Probability * 100) / 100,
        top6_probability: Math.round(top6Probability * 100) / 100,
        average_final_position: Math.round(averageFinalPosition * 100) / 100,
        average_final_points: Math.round(averageFinalPoints * 100) / 100,
        position_distribution: positionDistribution,
      });
    }

    // Ordenar por probabilidade de título (decrescente)
    predictions.sort((a, b) => b.title_probability - a.title_probability);

    return predictions;
  }

  /**
   * Clona o estado dos times para uma nova simulação
   */
  private cloneTeamStates(teams: SimulationTeam[]): SimulationTeam[] {
    return teams.map(team => ({ ...team }));
  }
}
