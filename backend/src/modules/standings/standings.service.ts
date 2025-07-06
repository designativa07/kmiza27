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
  red_cards: number;
  yellow_cards: number;
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
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
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
      red_cards: number;
      yellow_cards: number;
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
        group_name: ct.group_name,
        red_cards: 0,
        yellow_cards: 0
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
        
        // Adicionar cartões do time da casa - TEMPORARIAMENTE COMENTADO
        // homeStats.yellow_cards += match.home_yellow_cards || 0;
        // homeStats.red_cards += match.home_red_cards || 0;

        // Atualizar estatísticas do time visitante
        awayStats.played++;
        awayStats.goals_for += awayScore;
        awayStats.goals_against += homeScore;
        awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against;
        
        // Adicionar cartões do time visitante - TEMPORARIAMENTE COMENTADO
        // awayStats.yellow_cards += match.away_yellow_cards || 0;
        // awayStats.red_cards += match.away_red_cards || 0;

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
        
        // Critérios de desempate do Brasileirão 2025
        // 1. Por pontos (decrescente)
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        
        // 2. Por número de vitórias (decrescente)
        if (a.won !== b.won) {
          return b.won - a.won;
        }
        
        // 3. Por saldo de gols (decrescente)
        if (a.goal_difference !== b.goal_difference) {
          return b.goal_difference - a.goal_difference;
        }
        
        // 4. Por gols marcados (decrescente)
        if (a.goals_for !== b.goals_for) {
          return b.goals_for - a.goals_for;
        }
        
        // 5. Confronto direto (apenas entre 2 times)
        // Implementar confronto direto aqui
        // TODO: Será implementado de forma assíncrona em uma versão futura
        
        // 6. Menor número de cartões vermelhos (decrescente - menos cartões = melhor)
        if (a.red_cards !== b.red_cards) {
          return a.red_cards - b.red_cards;
        }
        
        // 7. Menor número de cartões amarelos (decrescente - menos cartões = melhor)
        if (a.yellow_cards !== b.yellow_cards) {
          return a.yellow_cards - b.yellow_cards;
        }
        
        // 8. Por nome do time (alfabética) - critério final
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
          group_name: stats.group_name,
          red_cards: stats.red_cards,
          yellow_cards: stats.yellow_cards
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
    // Buscar os times primeiro, independente de terem jogado ou não
    const [team1Entity, team2Entity] = await Promise.all([
      this.teamRepository.findOne({ where: { id: team1Id } }),
      this.teamRepository.findOne({ where: { id: team2Id } })
    ]);

    if (!team1Entity || !team2Entity) {
      throw new Error('Um ou ambos os times não foram encontrados');
    }

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
      team1: team1Entity,
      team2: team2Entity,
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
    const query = this.matchRepository.createQueryBuilder('match')
      .leftJoinAndSelect('match.home_team', 'home_team')
      .leftJoinAndSelect('match.away_team', 'away_team')
      .leftJoinAndSelect('match.stadium', 'stadium')
      .leftJoinAndSelect('match.competition', 'competition')
      .leftJoinAndSelect('match.round', 'round')
      .leftJoinAndSelect('match.broadcasts', 'broadcasts') // Adicionado para carregar transmissões
      .leftJoinAndSelect('broadcasts.channel', 'channel') // Adicionado para carregar detalhes do canal
      .where('match.competition.id = :competitionId', { competitionId })
      .orderBy('match.match_date', 'ASC');

    if (group) {
      query.andWhere('match.group_name = :group', { group });
    }

    return query.getMany();
  }

  async getCompetitionRounds(competitionId: number, onlyWithGroups?: boolean): Promise<any[]> {
    let query = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.round', 'round')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere('match.round IS NOT NULL');

    // Se onlyWithGroups for true, filtrar apenas rodadas com jogos que têm grupos
    if (onlyWithGroups) {
      query = query.andWhere('match.group_name IS NOT NULL');
    }

    const rounds = await query
      .select(['round.id', 'round.name', 'round.round_number', 'round.phase', 'round.is_current', 'round.display_order'])
      .groupBy('round.id, round.name, round.round_number, round.phase, round.is_current, round.display_order')
      .orderBy('round.display_order', 'ASC')
      .addOrderBy('round.round_number', 'ASC')
      .getRawMany();

    return rounds.map(round => ({
      id: round.round_id,
      name: round.round_name,
      round_number: round.round_round_number,
      phase: round.round_phase,
      is_current: round.round_is_current,
      display_order: round.round_display_order,
    }));
  }

  async getCurrentRound(competitionId: number): Promise<any | null> {
    // Interface para os dados da rodada
    interface RoundWithDate {
      round_id: number;
      round_name: string;
      round_round_number: number;
      round_phase: string;
      min_date: string;
      max_date: string;
    }

    // Buscar todas as rodadas com suas datas e encontrar a mais próxima
    const roundsWithDates = await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.round', 'round')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere('match.round IS NOT NULL')
      .andWhere('match.match_date IS NOT NULL')
      .select([
        'round.id as round_id', 
        'round.name as round_name', 
        'round.round_number as round_round_number', 
        'round.phase as round_phase',
        'MIN(match.match_date) as min_date',
        'MAX(match.match_date) as max_date'
      ])
      .groupBy('round.id, round.name, round.round_number, round.phase, round.display_order')
      .orderBy('round.display_order', 'ASC')
      .addOrderBy('round.round_number', 'ASC')
      .getRawMany() as RoundWithDate[];

    if (roundsWithDates && roundsWithDates.length > 0) {
      const now = new Date();
      let closestRound: RoundWithDate | null = null;
      let minDiff = Infinity;

      // Encontrar a rodada com data mais próxima
      for (const round of roundsWithDates) {
        const roundDate = new Date(round.min_date);
        const diff = Math.abs(now.getTime() - roundDate.getTime());
        
        if (diff < minDiff) {
          minDiff = diff;
          closestRound = round;
        }
      }

      if (closestRound) {
        return {
          id: closestRound.round_id,
          name: closestRound.round_name,
          round_number: closestRound.round_round_number,
          phase: closestRound.round_phase,
        };
      }
    }
    
    // Se não encontrar nenhuma rodada com data, buscar a última rodada disponível
    const fallbackRound = await this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.round', 'round')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere('match.round IS NOT NULL')
      .select(['round.id', 'round.name', 'round.round_number', 'round.phase', 'round.display_order'])
      .groupBy('round.id, round.name, round.round_number, round.phase, round.display_order')
      .orderBy('round.display_order', 'DESC')
      .addOrderBy('round.round_number', 'DESC')
      .limit(1)
      .getRawOne();

    if (fallbackRound) {
      return {
        id: fallbackRound.round_id,
        name: fallbackRound.round_name,
        round_number: fallbackRound.round_round_number,
        phase: fallbackRound.round_phase,
      };
    }
    
    // Retornar null explicitamente em vez de undefined
    return null;
  }

  async getRoundMatches(competitionId: number, roundId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: {
        competition: { id: competitionId },
        round: { id: roundId },
      },
      relations: [
        'home_team',
        'away_team',
        'stadium',
        'round',
        'competition',
        'qualified_team',
        'broadcasts', // Adicionado para carregar transmissões
        'broadcasts.channel', // Adicionado para carregar detalhes do canal
      ],
      order: {
        match_date: 'ASC',
      },
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

  private async calculateHeadToHead(competitionId: number, team1Id: number, team2Id: number): Promise<number> {
    // Buscar confrontos diretos entre os dois times
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
      relations: ['home_team', 'away_team']
    });

    let team1Points = 0;
    let team2Points = 0;
    let team1Goals = 0;
    let team2Goals = 0;

    matches.forEach(match => {
      const isTeam1Home = match.home_team.id === team1Id;
      const team1Score = isTeam1Home ? match.home_score : match.away_score;
      const team2Score = isTeam1Home ? match.away_score : match.home_score;

      team1Goals += team1Score || 0;
      team2Goals += team2Score || 0;

      if (team1Score > team2Score) {
        team1Points += 3;
      } else if (team2Score > team1Score) {
        team2Points += 3;
      } else {
        team1Points += 1;
        team2Points += 1;
      }
    });

    // Retorna: 1 se team1 é melhor, -1 se team2 é melhor, 0 se empate
    if (team1Points !== team2Points) {
      return team1Points > team2Points ? 1 : -1;
    }
    
    // Se pontos iguais, verificar saldo de gols no confronto direto
    const team1GoalDiff = team1Goals - team2Goals;
    const team2GoalDiff = team2Goals - team1Goals;
    
    if (team1GoalDiff !== team2GoalDiff) {
      return team1GoalDiff > team2GoalDiff ? 1 : -1;
    }
    
    // Se saldo igual, verificar gols marcados
    if (team1Goals !== team2Goals) {
      return team1Goals > team2Goals ? 1 : -1;
    }
    
    return 0; // Empate total no confronto direto
  }
} 