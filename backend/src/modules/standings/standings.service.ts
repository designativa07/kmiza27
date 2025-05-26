import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitionTeam, Match, Competition, Team } from '../../entities';
import { MatchStatus } from '../../entities/match.entity';

export interface StandingEntry {
  position: number;
  team: Team;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form: string;
  group_name?: string;
}

export interface HeadToHeadStats {
  team1: Team;
  team2: Team;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  last_matches: Match[];
}

@Injectable()
export class StandingsService {
  constructor(
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
  ) {}

  async getCompetitionStandings(competitionId: number, group?: string): Promise<StandingEntry[]> {
    // Buscar todos os times da competição
    const whereClause: any = { competition: { id: competitionId } };
    if (group) {
      whereClause.group_name = group;
    }

    const competitionTeams = await this.competitionTeamRepository.find({
      where: whereClause,
      relations: ['team', 'competition']
    });

    // Buscar todas as partidas finalizadas da competição
    const matchesQuery = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere('match.status = :status', { status: MatchStatus.FINISHED });

    if (group) {
      matchesQuery.andWhere('match.group_name = :group', { group });
    }

    const matches = await matchesQuery.getMany();

    // Calcular estatísticas para cada time baseado nos jogos
    const teamStats = new Map<number, {
      team: any;
      points: number;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goals_for: number;
      goals_against: number;
      goal_difference: number;
      form: string;
      group_name?: string;
    }>();

    // Inicializar estatísticas para todos os times
    competitionTeams.forEach(ct => {
      teamStats.set(ct.team.id, {
        team: ct.team,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        form: '',
        group_name: ct.group_name
      });
    });

    // Processar cada partida para calcular estatísticas
    matches.forEach(match => {
      const homeTeamId = match.home_team.id;
      const awayTeamId = match.away_team.id;
      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      const homeStats = teamStats.get(homeTeamId);
      const awayStats = teamStats.get(awayTeamId);

      if (homeStats && awayStats) {
        // Atualizar estatísticas do time da casa
        homeStats.played++;
        homeStats.goals_for += homeScore;
        homeStats.goals_against += awayScore;
        homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against;

        // Atualizar estatísticas do time visitante
        awayStats.played++;
        awayStats.goals_for += awayScore;
        awayStats.goals_against += homeScore;
        awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;

        // Determinar resultado e atualizar pontos
        if (homeScore > awayScore) {
          // Vitória do time da casa
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
          homeStats.form = (homeStats.form + 'W').slice(-5);
          awayStats.form = (awayStats.form + 'L').slice(-5);
        } else if (awayScore > homeScore) {
          // Vitória do time visitante
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
          awayStats.form = (awayStats.form + 'W').slice(-5);
          homeStats.form = (homeStats.form + 'L').slice(-5);
        } else {
          // Empate
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points += 1;
          awayStats.points += 1;
          homeStats.form = (homeStats.form + 'D').slice(-5);
          awayStats.form = (awayStats.form + 'D').slice(-5);
        }
      }
    });

    // Converter para array e ordenar
    const standings = Array.from(teamStats.values())
      .sort((a, b) => {
        // Se não há grupos ou ambos estão no mesmo grupo, ordenar por critérios técnicos
        const groupA = a.group_name || '';
        const groupB = b.group_name || '';
        
        // Se há grupos diferentes, ordenar por grupo
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB);
        }
        
        // Dentro do mesmo grupo (ou sem grupos), ordenar por critérios técnicos
        // 1. Por pontos (decrescente)
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        // 2. Por saldo de gols (decrescente)
        if (a.goal_difference !== b.goal_difference) {
          return b.goal_difference - a.goal_difference;
        }
        // 3. Por gols marcados (decrescente)
        if (a.goals_for !== b.goals_for) {
          return b.goals_for - a.goals_for;
        }
        // 4. Por nome do time (alfabética)
        return a.team.name.localeCompare(b.team.name);
      });

    // Adicionar posições
    const standingsWithPositions: StandingEntry[] = [];
    
    // Agrupar por grupo para calcular posições corretamente
    const groupedStandings = new Map<string, typeof standings>();
    standings.forEach(stats => {
      const groupKey = stats.group_name || 'general';
      if (!groupedStandings.has(groupKey)) {
        groupedStandings.set(groupKey, []);
      }
      groupedStandings.get(groupKey)!.push(stats);
    });

    // Processar cada grupo
    groupedStandings.forEach((groupStandings, groupKey) => {
      groupStandings.forEach((stats, index) => {
        standingsWithPositions.push({
          position: index + 1, // Posição dentro do grupo
          team: stats.team,
          points: stats.points,
          played: stats.played,
          won: stats.won,
          drawn: stats.drawn,
          lost: stats.lost,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: stats.goal_difference,
          form: stats.form,
          group_name: stats.group_name
        });
      });
    });

    return standingsWithPositions;
  }

  async getCompetitionGroups(competitionId: number): Promise<string[]> {
    const groups = await this.competitionTeamRepository
      .createQueryBuilder('ct')
      .select('DISTINCT ct.group_name', 'group_name')
      .where('ct.competition_id = :competitionId', { competitionId })
      .andWhere('ct.group_name IS NOT NULL')
      .orderBy('ct.group_name', 'ASC')
      .getRawMany();

    return groups.map(g => g.group_name);
  }

  async getHeadToHeadStats(competitionId: number, team1Id: number, team2Id: number): Promise<HeadToHeadStats> {
    const matches = await this.matchRepository.find({
      where: [
        {
          competition: { id: competitionId },
          home_team: { id: team1Id },
          away_team: { id: team2Id },
          status: MatchStatus.FINISHED
        },
        {
          competition: { id: competitionId },
          home_team: { id: team2Id },
          away_team: { id: team1Id },
          status: MatchStatus.FINISHED
        }
      ],
      relations: ['home_team', 'away_team', 'competition'],
      order: { match_date: 'DESC' }
    });

    const team1 = matches[0]?.home_team.id === team1Id ? matches[0].home_team : matches[0]?.away_team;
    const team2 = matches[0]?.home_team.id === team2Id ? matches[0].home_team : matches[0]?.away_team;

    let team1_wins = 0;
    let team2_wins = 0;
    let draws = 0;
    let team1_goals = 0;
    let team2_goals = 0;

    matches.forEach(match => {
      const isTeam1Home = match.home_team.id === team1Id;
      const team1Score = isTeam1Home ? match.home_score : match.away_score;
      const team2Score = isTeam1Home ? match.away_score : match.home_score;

      team1_goals += team1Score || 0;
      team2_goals += team2Score || 0;

      if (team1Score > team2Score) {
        team1_wins++;
      } else if (team2Score > team1Score) {
        team2_wins++;
      } else {
        draws++;
      }
    });

    return {
      team1,
      team2,
      total_matches: matches.length,
      team1_wins,
      team2_wins,
      draws,
      team1_goals,
      team2_goals,
      last_matches: matches.slice(0, 5)
    };
  }

  async getTeamStats(competitionId: number, teamId: number): Promise<any> {
    const competitionTeam = await this.competitionTeamRepository.findOne({
      where: { 
        competition: { id: competitionId },
        team: { id: teamId }
      },
      relations: ['team', 'competition']
    });

    if (!competitionTeam) {
      return null;
    }

    // Buscar todas as partidas do time na competição
    const matches = await this.matchRepository.find({
      where: [
        {
          competition: { id: competitionId },
          home_team: { id: teamId }
        },
        {
          competition: { id: competitionId },
          away_team: { id: teamId }
        }
      ],
      relations: ['home_team', 'away_team', 'competition'],
      order: { match_date: 'DESC' }
    });

    // Separar partidas por casa e visitante
    const homeMatches = matches.filter(m => m.home_team.id === teamId);
    const awayMatches = matches.filter(m => m.away_team.id === teamId);
    const finishedMatches = matches.filter(m => m.status === MatchStatus.FINISHED);

    // Calcular estatísticas gerais baseadas nos jogos finalizados
    const overallStats = this.calculateRecord(finishedMatches, teamId);
    const homeRecord = this.calculateRecord(homeMatches.filter(m => m.status === MatchStatus.FINISHED), teamId);
    const awayRecord = this.calculateRecord(awayMatches.filter(m => m.status === MatchStatus.FINISHED), teamId);

    return {
      team: competitionTeam.team,
      competition: competitionTeam.competition,
      overall: overallStats,
      home: homeRecord,
      away: awayRecord,
      form: this.calculateForm(finishedMatches, teamId),
      recent_matches: matches.slice(0, 5)
    };
  }

  async getCompetitionMatches(competitionId: number, group?: string): Promise<Match[]> {
    const queryBuilder = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.competition', 'competition')
      .leftJoinAndSelect('match.stadium', 'stadium')
      .where('match.competition_id = :competitionId', { competitionId });

    if (group) {
      queryBuilder.andWhere('match.group_name = :group', { group });
    }

    return queryBuilder
      .orderBy('match.match_date', 'DESC')
      .getMany();
  }

  async getCompetitionRounds(competitionId: number): Promise<any[]> {
    const rounds = await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.round', 'round')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere('match.round IS NOT NULL')
      .select(['round.id', 'round.name', 'round.round_number', 'round.phase'])
      .groupBy('round.id, round.name, round.round_number, round.phase')
      .orderBy('round.round_number', 'ASC')
      .getRawMany();

    return rounds.map(round => ({
      id: round.round_id,
      name: round.round_name,
      round_number: round.round_round_number,
      phase: round.round_phase
    }));
  }

  async getRoundMatches(competitionId: number, roundId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: {
        competition: { id: competitionId },
        round: { id: roundId }
      },
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium'],
      order: { match_date: 'ASC' }
    });
  }

  private calculateRecord(matches: Match[], teamId: number) {
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goals_for = 0;
    let goals_against = 0;

    matches.forEach(match => {
      if (match.status === MatchStatus.FINISHED) {
        const isHome = match.home_team.id === teamId;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        goals_for += teamScore || 0;
        goals_against += opponentScore || 0;

        if (teamScore > opponentScore) {
          won++;
        } else if (teamScore < opponentScore) {
          lost++;
        } else {
          drawn++;
        }
      }
    });

    return {
      played: matches.filter(m => m.status === MatchStatus.FINISHED).length,
      won,
      drawn,
      lost,
      goals_for,
      goals_against,
      goal_difference: goals_for - goals_against,
      points: (won * 3) + drawn
    };
  }

  private calculateForm(matches: Match[], teamId: number): string {
    const recentMatches = matches
      .filter(m => m.status === MatchStatus.FINISHED)
      .slice(0, 5)
      .reverse(); // Mais antigo para mais recente

    let form = '';
    recentMatches.forEach(match => {
      const isHome = match.home_team.id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      if (teamScore > opponentScore) {
        form += 'W';
      } else if (teamScore < opponentScore) {
        form += 'L';
      } else {
        form += 'D';
      }
    });

    return form;
  }
} 