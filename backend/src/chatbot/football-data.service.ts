import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { Match } from '../entities/match.entity';
import { Competition } from '../entities/competition.entity';
import { CompetitionTeam } from '../entities/competition-team.entity';
import { Goal } from '../entities/goal.entity';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class FootballDataService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamsRepository: Repository<CompetitionTeam>,
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
  ) {}

  async getTeamStatistics(teamName: string): Promise<string> {
    try {
      const team = await this.teamsRepository
        .createQueryBuilder('team')
        .where('LOWER(team.name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .orWhere('LOWER(team.short_name) LIKE LOWER(:name)', { name: `%${teamName}%` })
        .getOne();

      if (!team) {
        return `❌ Time "${teamName}" não encontrado.`;
      }

      // Buscar estatísticas dos últimos 10 jogos
      const recentMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.competition', 'competition')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .where('(match.home_team_id = :teamId OR match.away_team_id = :teamId)', { teamId: team.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .orderBy('match.match_date', 'DESC')
        .limit(10)
        .getMany();

      if (recentMatches.length === 0) {
        return `📊 ESTATÍSTICAS DO ${team.name.toUpperCase()} 📊

😔 Não há dados de jogos finalizados para análise.`;
      }

      let wins = 0, draws = 0, losses = 0;
      let goalsFor = 0, goalsAgainst = 0;
      let homeWins = 0, awayWins = 0;

      recentMatches.forEach(match => {
        const isHome = match.home_team.id === team.id;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
          if (isHome) homeWins++;
          else awayWins++;
        } else if (teamScore === opponentScore) {
          draws++;
        } else {
          losses++;
        }
      });

      const winPercentage = ((wins / recentMatches.length) * 100).toFixed(1);
      const avgGoalsFor = (goalsFor / recentMatches.length).toFixed(1);
      const avgGoalsAgainst = (goalsAgainst / recentMatches.length).toFixed(1);

      return `📊 ESTATÍSTICAS DO ${team.name.toUpperCase()} 📊
*Últimos ${recentMatches.length} jogos*

🏆 Desempenho Geral:
✅ Vitórias: ${wins} (${winPercentage}%)
🟡 Empates: ${draws}
❌ Derrotas: ${losses}

⚽ Gols:
🥅 Marcados: ${goalsFor} (média: ${avgGoalsFor})
🚫 Sofridos: ${goalsAgainst} (média: ${avgGoalsAgainst})
📊 Saldo: ${goalsFor - goalsAgainst}

🏠 Mandante vs Visitante:
🏠 Vitórias em casa: ${homeWins}
✈️ Vitórias fora: ${awayWins}

💪 Aproveitamento: ${winPercentage}%`;

    } catch (error) {
      console.error('Erro ao buscar estatísticas do time:', error);
      return '❌ Erro ao buscar estatísticas do time.';
    }
  }

  async getTopScorers(competitionName?: string): Promise<string> {
    try {
      let query = this.goalsRepository
        .createQueryBuilder('goal')
        .leftJoinAndSelect('goal.match', 'match')
        .leftJoinAndSelect('goal.team', 'team')
        .leftJoinAndSelect('goal.player', 'player')
        .leftJoinAndSelect('match.competition', 'competition')
        .where('goal.type != :ownGoal', { ownGoal: 'own_goal' });

      if (competitionName) {
        const competition = await this.competitionsRepository
          .createQueryBuilder('competition')
          .where('LOWER(competition.name) LIKE LOWER(:name)', { name: `%${competitionName}%` })
          .getOne();

        if (competition) {
          query = query.andWhere('match.competition_id = :competitionId', { competitionId: competition.id });
        }
      }

      const goals = await query
        .orderBy('goal.created_at', 'DESC')
        .limit(100)
        .getMany();

      if (goals.length === 0) {
        return `⚽ ARTILHEIROS ⚽

😔 Não há dados de gols disponíveis.`;
      }

      // Agrupar gols por jogador
      const scorers = new Map<string, { player: string, team: string, goals: number }>();

      goals.forEach(goal => {
        const key = `${goal.player.name}-${goal.team.name}`;
        if (scorers.has(key)) {
          scorers.get(key)!.goals++;
        } else {
          scorers.set(key, {
            player: goal.player.name,
            team: goal.team.name,
            goals: 1
          });
        }
      });

      // Ordenar por número de gols
      const sortedScorers = Array.from(scorers.values())
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10);

      let response = `⚽ ARTILHEIROS ⚽`;
      if (competitionName) {
        response += ` - ${competitionName.toUpperCase()}`;
      }
      response += `\n\n`;

      sortedScorers.forEach((scorer, index) => {
        const position = index + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}º`;
        response += `${emoji} ${scorer.player} (${scorer.team}) - ${scorer.goals} gols\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar artilheiros:', error);
      return '❌ Erro ao buscar artilheiros.';
    }
  }

  async getChannelInfo(): Promise<string> {
    try {
      const channels = await this.channelsRepository
        .createQueryBuilder('channel')
        .where('channel.active = :active', { active: true })
        .orderBy('channel.type', 'ASC')
        .addOrderBy('channel.name', 'ASC')
        .getMany();

      if (channels.length === 0) {
        return `📺 CANAIS DE TRANSMISSÃO 📺

😔 Não há informações de canais disponíveis.`;
      }

      let response = `📺 CANAIS DE TRANSMISSÃO 📺\n\n`;

      const channelsByType = new Map<string, Channel[]>();
      channels.forEach(channel => {
        const type = channel.type || 'other';
        if (!channelsByType.has(type)) {
          channelsByType.set(type, []);
        }
        channelsByType.get(type)!.push(channel);
      });

      const typeEmojis = {
        'tv': '📺',
        'cable': '📡',
        'streaming': '💻',
        'other': '📱'
      };

      const typeNames = {
        'tv': 'TV Aberta',
        'cable': 'TV por Assinatura',
        'streaming': 'Streaming',
        'other': 'Outros'
      };

      channelsByType.forEach((channelList, type) => {
        const emoji = typeEmojis[type] || '📺';
        const typeName = typeNames[type] || type.toUpperCase();
        
        response += `${emoji} ${typeName}:\n`;
        
        channelList.forEach(channel => {
          response += `• ${channel.name}`;
          if (channel.channel_number) {
            response += ` (${channel.channel_number})`;
          }
          response += `\n`;
        });
        response += `\n`;
      });

      return response;

    } catch (error) {
      console.error('Erro ao buscar informações de canais:', error);
      return '❌ Erro ao buscar informações de canais.';
    }
  }

  async getCompetitionStats(competitionName: string): Promise<string> {
    try {
      const competition = await this.competitionsRepository
        .createQueryBuilder('competition')
        .where('UNACCENT(LOWER(competition.name)) LIKE UNACCENT(LOWER(:name))', { name: `%${competitionName}%` })
        .getOne();

      if (!competition) {
        return `❌ Competição "${competitionName}" não encontrada.`;
      }

      // Buscar estatísticas da competição
      const totalMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.competition_id = :competitionId', { competitionId: competition.id })
        .getCount();

      const finishedMatches = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.competition_id = :competitionId', { competitionId: competition.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .getCount();

      // Calcular gols a partir dos resultados das partidas (não da tabela goals)
      const matchResults = await this.matchesRepository
        .createQueryBuilder('match')
        .select([
          'SUM(COALESCE(match.home_score, 0)) as home_goals',
          'SUM(COALESCE(match.away_score, 0)) as away_goals'
        ])
        .where('match.competition_id = :competitionId', { competitionId: competition.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .andWhere('match.home_score IS NOT NULL')
        .andWhere('match.away_score IS NOT NULL')
        .getRawOne();

      const totalGoals = (parseInt(matchResults.home_goals) || 0) + (parseInt(matchResults.away_goals) || 0);
      const avgGoalsPerMatch = finishedMatches > 0 ? (totalGoals / finishedMatches).toFixed(2) : '0.00';

      const teamsCount = await this.competitionTeamsRepository
        .createQueryBuilder('ct')
        .where('ct.competition = :competitionId', { competitionId: competition.id })
        .getCount();

      // Buscar partida com mais gols
      const highestScoringMatch = await this.matchesRepository
        .createQueryBuilder('match')
        .leftJoinAndSelect('match.home_team', 'homeTeam')
        .leftJoinAndSelect('match.away_team', 'awayTeam')
        .select([
          'match.id',
          'match.home_score',
          'match.away_score',
          'homeTeam.name',
          'awayTeam.name'
        ])
        .where('match.competition_id = :competitionId', { competitionId: competition.id })
        .andWhere('match.status = :status', { status: 'finished' })
        .andWhere('match.home_score IS NOT NULL')
        .andWhere('match.away_score IS NOT NULL')
        .orderBy('(match.home_score + match.away_score)', 'DESC')
        .getOne();

      let highestScoringInfo = 'N/A';
      if (highestScoringMatch) {
        const totalGoalsMatch = highestScoringMatch.home_score + highestScoringMatch.away_score;
        highestScoringInfo = `${highestScoringMatch.home_team.name} ${highestScoringMatch.home_score} x ${highestScoringMatch.away_score} ${highestScoringMatch.away_team.name} (${totalGoalsMatch} gols)`;
      }

      return `📊 ESTATÍSTICAS - ${competition.name.toUpperCase()} 📊

🏆 Informações Gerais:
📅 Temporada: ${competition.season}
🌍 País: ${competition.country || 'Internacional'}
👥 Times participantes: ${teamsCount}

⚽ Estatísticas de Jogos:
🎯 Total de partidas: ${totalMatches}
✅ Partidas finalizadas: ${finishedMatches}
⏳ Partidas restantes: ${totalMatches - finishedMatches}

🥅 Estatísticas de Gols:
⚽ Total de gols: ${totalGoals}
📊 Média por jogo: ${avgGoalsPerMatch}
🔥 Jogo com mais gols: ${highestScoringInfo}

📈 Status: ${competition.is_active ? 'Ativa' : 'Inativa'}`;

    } catch (error) {
      console.error('Erro ao buscar estatísticas da competição:', error);
      return '❌ Erro ao buscar estatísticas da competição.';
    }
  }
} 