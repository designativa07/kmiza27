import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class CompetitionsService {
  private readonly logger = new Logger(CompetitionsService.name);

  // ===== COMPETIÇÕES =====

  async getCompetitions() {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('*')
        .order('tier', { ascending: true });

      if (error) throw new Error(`Error fetching competitions: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting competitions:', error);
      throw error;
    }
  }

  async getCompetitionsForNewUsers() {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('*')
        .eq('tier', 4) // Apenas Série D
        .order('tier', { ascending: true });

      if (error) throw new Error(`Error fetching competitions for new users: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting competitions for new users:', error);
      throw error;
    }
  }

  async getCompetitionById(id: string) {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Error fetching competition: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error getting competition:', error);
      throw error;
    }
  }

  // ===== INSCRIÇÕES =====

  async registerTeamInCompetition(teamId: string, competitionId: string) {
    try {
      // Verificar se o time já está inscrito
      const { data: existingRegistration, error: checkError } = await supabase
        .from('game_competition_teams')
        .select('id')
        .eq('competition_id', competitionId)
        .eq('team_id', teamId)
        .single();

      if (existingRegistration) {
        throw new Error('Time já está inscrito nesta competição');
      }

      // Verificar se a competição está cheia e se está aberta para novos usuários
      const { data: competition, error: compError } = await supabase
        .from('game_competitions')
        .select('max_teams, current_teams, name, tier')
        .eq('id', competitionId)
        .single();

      if (compError) throw new Error(`Error fetching competition: ${compError.message}`);

      if (competition.current_teams >= competition.max_teams) {
        throw new Error('Competição está cheia');
      }

      // Verificar se a competição está aberta para novos usuários
      // Temporariamente permitir inscrição em outras séries se a Série D estiver cheia
      if (competition.tier !== 4) {
        // Verificar se a Série D está cheia
        const { data: serieD, error: serieDError } = await supabase
          .from('game_competitions')
          .select('current_teams, max_teams')
          .eq('tier', 4)
          .single();
        
        if (serieDError) {
          throw new Error(`A ${competition.name} não está aberta para novos usuários. Apenas a Série D aceita novos times.`);
        }
        
        // Se a Série D está cheia, permitir inscrição em outras séries
        if (serieD.current_teams >= serieD.max_teams) {
          console.log(`Série D está cheia (${serieD.current_teams}/${serieD.max_teams}). Permitindo inscrição em ${competition.name}.`);
        } else {
          throw new Error(`A ${competition.name} não está aberta para novos usuários. Apenas a Série D aceita novos times.`);
        }
      }

      // Inserir inscrição do usuário
      const { data: registration, error: insertError } = await supabase
        .from('game_competition_teams')
        .insert({
          competition_id: competitionId,
          team_id: teamId
        })
        .select()
        .single();

      if (insertError) throw new Error(`Error registering team: ${insertError.message}`);

      // Atualizar contador de times na competição
      const { error: updateError } = await supabase
        .from('game_competitions')
        .update({ current_teams: competition.current_teams + 1 })
        .eq('id', competitionId);

      if (updateError) {
        this.logger.error('Error updating competition team count:', updateError);
      }

      // Criar entrada na classificação
      const { error: standingsError } = await supabase
        .from('game_standings')
        .insert({
          competition_id: competitionId,
          team_id: teamId,
          season_year: new Date().getFullYear(),
          position: 0,
          games_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        });

      if (standingsError) {
        this.logger.error('Error creating standings entry:', standingsError);
      }

      // Verificar se deve criar partidas automaticamente
      await this.checkAndCreateMatches(competitionId);

      return registration;
    } catch (error) {
      this.logger.error('Error registering team in competition:', error);
      throw error;
    }
  }

  private async checkAndCreateMatches(competitionId: string) {
    try {
      // Buscar times inscritos na competição
      const { data: enrolledTeams, error: teamsError } = await supabase
        .from('game_competition_teams')
        .select(`
          *,
          game_teams!inner(id, name, team_type)
        `)
        .eq('competition_id', competitionId);

      if (teamsError) {
        this.logger.error('Error fetching enrolled teams:', teamsError);
        return;
      }

      // Verificar se já existem partidas para esta competição
      const { data: existingMatches, error: matchesError } = await supabase
        .from('game_matches')
        .select('id')
        .eq('competition_id', competitionId);

      if (matchesError) {
        this.logger.error('Error checking existing matches:', matchesError);
        return;
      }

      // Se não há partidas e há times suficientes, criar calendário
      if (existingMatches.length === 0 && enrolledTeams.length >= 2) {
        this.logger.log(`Creating match schedule for competition ${competitionId} with ${enrolledTeams.length} teams`);
        await this.createMatchSchedule(competitionId, enrolledTeams);
      }
    } catch (error) {
      this.logger.error('Error in checkAndCreateMatches:', error);
    }
  }

  private async createMatchSchedule(competitionId: string, teams: any[]) {
    try {
      // Criar rodadas (turno e returno)
      const rounds = [];
      const totalRounds = (teams.length - 1) * 2; // Turno e returno
      
      for (let round = 1; round <= totalRounds; round++) {
        rounds.push({
          competition_id: competitionId,
          round_number: round,
          name: `Rodada ${round}`
        });
      }

      // Inserir rodadas
      const { data: createdRounds, error: roundsError } = await supabase
        .from('game_rounds')
        .insert(rounds)
        .select();

      if (roundsError) {
        this.logger.error('Error creating rounds:', roundsError);
        return;
      }

      // Gerar partidas usando algoritmo de round-robin
      const matches = this.generateRoundRobinMatches(teams, competitionId, createdRounds);
      
      // Inserir partidas em lotes
      const batchSize = 10;
      for (let i = 0; i < matches.length; i += batchSize) {
        const batch = matches.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('game_matches')
          .insert(batch);

        if (insertError) {
          this.logger.error('Error inserting match batch:', insertError);
          continue;
        }
      }

      this.logger.log(`Created ${matches.length} matches for competition ${competitionId}`);
    } catch (error) {
      this.logger.error('Error creating match schedule:', error);
    }
  }

  private generateRoundRobinMatches(teams: any[], competitionId: string, rounds: any[]) {
    const matches = [];
    const teamIds = teams.map(team => team.game_teams.id);
    const teamNames = teams.map(team => team.game_teams.name);
    
    // Se número ímpar de times, adicionar "bye"
    if (teamIds.length % 2 !== 0) {
      teamIds.push(null);
      teamNames.push('BYE');
    }

    const n = teamIds.length;
    const totalRounds = n - 1;
    
    // Gerar partidas para turno e returno
    for (let round = 0; round < totalRounds * 2; round++) {
      const roundNumber = round + 1;
      const isReturnRound = round >= totalRounds;
      
      // Calcular partidas da rodada
      for (let i = 0; i < n / 2; i++) {
        const homeIndex = i;
        const awayIndex = n - 1 - i;
        
        // Pular partidas com "bye"
        if (teamIds[homeIndex] === null || teamIds[awayIndex] === null) {
          continue;
        }

        // Para returno, inverter mandante/visitante
        const actualHomeIndex = isReturnRound ? awayIndex : homeIndex;
        const actualAwayIndex = isReturnRound ? homeIndex : awayIndex;

        // Alternar casa/fora para distribuir melhor os jogos
        let finalHomeIndex = actualHomeIndex;
        let finalAwayIndex = actualAwayIndex;
        
        // Se é uma rodada par (exceto a primeira), alternar alguns jogos
        if (round > 0 && round % 2 === 1 && i % 2 === 1) {
          finalHomeIndex = actualAwayIndex;
          finalAwayIndex = actualHomeIndex;
        }

        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() + round * 7); // Uma semana entre rodadas

        matches.push({
          competition_id: competitionId,
          round: roundNumber,
          home_team_id: teamIds[finalHomeIndex],
          away_team_id: teamIds[finalAwayIndex],
          home_team_name: teamNames[finalHomeIndex],
          away_team_name: teamNames[finalAwayIndex],
          match_date: matchDate.toISOString(),
          status: 'scheduled',
          home_score: null,
          away_score: null,
          highlights: [],
          stats: {}
        });
      }

      // Rotacionar times (exceto o primeiro)
      if (round < totalRounds - 1) {
        const temp = teamIds[1];
        for (let i = 1; i < n - 1; i++) {
          teamIds[i] = teamIds[i + 1];
          teamNames[i] = teamNames[i + 1];
        }
        teamIds[n - 1] = temp;
        teamNames[n - 1] = teams.find(t => t.game_teams.id === temp)?.game_teams.name || 'Unknown';
      }
    }

    return matches;
  }

  async unregisterTeamFromCompetition(teamId: string, competitionId: string) {
    try {
      // Remover inscrição
      const { error: deleteError } = await supabase
        .from('game_competition_teams')
        .delete()
        .eq('competition_id', competitionId)
        .eq('team_id', teamId);

      if (deleteError) throw new Error(`Error unregistering team: ${deleteError.message}`);

      // Atualizar contador de times na competição
      const { data: competition } = await supabase
        .from('game_competitions')
        .select('current_teams')
        .eq('id', competitionId)
        .single();

      if (competition) {
        await supabase
          .from('game_competitions')
          .update({ current_teams: Math.max(0, competition.current_teams - 1) })
          .eq('id', competitionId);
      }

      // Remover da classificação
      await supabase
        .from('game_standings')
        .delete()
        .eq('competition_id', competitionId)
        .eq('team_id', teamId);

      this.logger.log(`Team ${teamId} unregistered from competition ${competitionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error unregistering team from competition:', error);
      throw error;
    }
  }

  // ===== CLASSIFICAÇÕES =====

  async getCompetitionStandings(competitionId: string) {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('game_standings')
        .select(`
          *,
          team:game_teams(id, name, short_name, colors, logo_url)
        `)
        .eq('competition_id', competitionId)
        .eq('season_year', currentYear)
        .order('position', { ascending: true });

      if (error) throw new Error(`Error fetching standings: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting standings:', error);
      throw error;
    }
  }

  async updateStandings(competitionId: string) {
    try {
      // Buscar todas as partidas da competição (corrigido para usar game_matches)
      const { data: matches, error: matchesError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('competition_id', competitionId)
        .eq('status', 'finished');

      if (matchesError) throw new Error(`Error fetching matches: ${matchesError.message}`);

      // Calcular estatísticas para cada time
      const teamStats = new Map();

      for (const match of matches) {
        // Time da casa
        if (!teamStats.has(match.home_team_id)) {
          teamStats.set(match.home_team_id, {
            team_id: match.home_team_id,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0
          });
        }

        // Time visitante
        if (!teamStats.has(match.away_team_id)) {
          teamStats.set(match.away_team_id, {
            team_id: match.away_team_id,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0
          });
        }

        const homeStats = teamStats.get(match.home_team_id);
        const awayStats = teamStats.get(match.away_team_id);

        // Atualizar estatísticas
        homeStats.games_played++;
        awayStats.games_played++;

        homeStats.goals_for += match.home_score;
        homeStats.goals_against += match.away_score;
        awayStats.goals_for += match.away_score;
        awayStats.goals_against += match.home_score;

        if (match.home_score > match.away_score) {
          homeStats.wins++;
          awayStats.losses++;
        } else if (match.home_score < match.away_score) {
          awayStats.wins++;
          homeStats.losses++;
        } else {
          homeStats.draws++;
          awayStats.draws++;
        }
      }

      // Calcular pontos e posições
      const standings = Array.from(teamStats.values()).map(stats => ({
        ...stats,
        points: stats.wins * 3 + stats.draws,
        goal_difference: stats.goals_for - stats.goals_against
      }));

      // Ordenar por pontos, saldo de gols, gols pró
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // Atualizar posições
      for (let i = 0; i < standings.length; i++) {
        standings[i].position = i + 1;
      }

      // Atualizar no banco
      for (const standing of standings) {
        await supabase
          .from('game_standings')
          .upsert({
            competition_id: competitionId,
            team_id: standing.team_id,
            season_year: new Date().getFullYear(),
            position: standing.position,
            points: standing.points,
            games_played: standing.games_played,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
            goals_for: standing.goals_for,
            goals_against: standing.goals_against,
            goal_difference: standing.goal_difference
          });
      }

      this.logger.log(`Standings updated for competition ${competitionId}`);
      return standings;
    } catch (error) {
      this.logger.error('Error updating standings:', error);
      throw error;
    }
  }

  // ===== RODADAS =====

  async createRound(competitionId: string, roundNumber: number, name: string) {
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .insert({
          competition_id: competitionId,
          round_number: roundNumber,
          name: name
        })
        .select()
        .single();

      if (error) throw new Error(`Error creating round: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating round:', error);
      throw error;
    }
  }

  async getRounds(competitionId: string) {
    try {
      const { data, error } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('competition_id', competitionId)
        .order('round_number', { ascending: true });

      if (error) throw new Error(`Error fetching rounds: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting rounds:', error);
      throw error;
    }
  }

  // ===== PARTIDAS DE COMPETIÇÃO =====

  async createCompetitionMatch(matchData: any) {
    try {
      const { data, error } = await supabase
        .from('game_competition_matches')
        .insert(matchData)
        .select()
        .single();

      if (error) throw new Error(`Error creating competition match: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating competition match:', error);
      throw error;
    }
  }

  async getCompetitionMatches(competitionId: string) {
    try {
      const { data, error } = await supabase
        .from('game_competition_matches')
        .select(`
          *,
          home_team:game_teams!home_team_id(id, name, short_name, colors),
          away_team:game_teams!away_team_id(id, name, short_name, colors)
        `)
        .eq('competition_id', competitionId)
        .order('match_date', { ascending: true });

      if (error) throw new Error(`Error fetching competition matches: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting competition matches:', error);
      throw error;
    }
  }

  async simulateCompetitionMatch(matchId: string) {
    try {
      // Buscar a partida (corrigido para usar game_matches)
      const { data: match, error: matchError } = await supabase
        .from('game_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw new Error(`Error fetching match: ${matchError.message}`);

      // Buscar os times
      const { data: homeTeam, error: homeError } = await supabase
        .from('game_teams')
        .select('*')
        .eq('id', match.home_team_id)
        .single();

      const { data: awayTeam, error: awayError } = await supabase
        .from('game_teams')
        .select('*')
        .eq('id', match.away_team_id)
        .single();

      if (homeError || awayError) {
        throw new Error('Error fetching teams');
      }

      // Simular a partida
      const simulation = this.simulateMatchResult(homeTeam, awayTeam);

      // Atualizar a partida
      const { data: updatedMatch, error: updateError } = await supabase
        .from('game_matches')
        .update({
          home_score: simulation.homeScore,
          away_score: simulation.awayScore,
          status: 'finished',
          highlights: simulation.highlights,
          stats: simulation.stats
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) throw new Error(`Error updating match: ${updateError.message}`);

      // Atualizar classificações
      await this.updateStandings(match.competition_id);

      this.logger.log(`Competition match simulated: ${matchId} - ${simulation.homeScore}x${simulation.awayScore}`);
      return updatedMatch;
    } catch (error) {
      this.logger.error('Error simulating competition match:', error);
      throw error;
    }
  }

  private simulateMatchResult(homeTeam: any, awayTeam: any) {
    // Fatores que influenciam o resultado
    const homeAdvantage = 1.2;
    const homeReputation = homeTeam.reputation || 50;
    const awayReputation = awayTeam.reputation || 50;
    
    // Calcular força base dos times
    const homeStrength = (homeReputation * homeAdvantage) + Math.random() * 20;
    const awayStrength = awayReputation + Math.random() * 20;

    // Simular gols baseado na diferença de força
    const strengthDiff = homeStrength - awayStrength;
    const homeGoals = Math.max(0, Math.floor((strengthDiff + 30) / 15) + Math.floor(Math.random() * 3));
    const awayGoals = Math.max(0, Math.floor((30 - strengthDiff) / 15) + Math.floor(Math.random() * 3));

    // Gerar estatísticas
    const possession = 50 + (strengthDiff / 2);
    const homeShots = Math.floor(homeGoals * 3 + Math.random() * 8);
    const awayShots = Math.floor(awayGoals * 3 + Math.random() * 8);
    const homeShotsOnTarget = Math.floor(homeShots * 0.6);
    const awayShotsOnTarget = Math.floor(awayShots * 0.6);

    // Gerar highlights
    const highlights = this.generateHighlights(homeTeam.name, awayTeam.name, homeGoals, awayGoals);

    return {
      homeScore: homeGoals,
      awayScore: awayGoals,
      highlights,
      stats: {
        possession: { home: Math.max(30, Math.min(70, possession)), away: Math.max(30, Math.min(70, 100 - possession)) },
        shots: { home: homeShots, away: awayShots },
        shots_on_target: { home: homeShotsOnTarget, away: awayShotsOnTarget },
        corners: { home: Math.floor(homeShots * 0.3), away: Math.floor(awayShots * 0.3) },
        fouls: { home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
        yellow_cards: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) },
        red_cards: { home: Math.floor(Math.random() * 2), away: Math.floor(Math.random() * 2) }
      }
    };
  }

  private generateHighlights(homeTeamName: string, awayTeamName: string, homeGoals: number, awayGoals: number) {
    const highlights = [];
    const players = ['João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Miguel Costa', 'Lucas Pereira'];
    
    let homeGoalCount = 0;
    let awayGoalCount = 0;
    
    // Simular gols em momentos aleatórios
    for (let minute = 1; minute <= 90; minute += Math.floor(Math.random() * 10) + 5) {
      if (homeGoalCount < homeGoals && Math.random() < 0.3) {
        const player = players[Math.floor(Math.random() * players.length)];
        highlights.push(`${minute}' - GOL! ${player} marca para ${homeTeamName}`);
        homeGoalCount++;
      }
      
      if (awayGoalCount < awayGoals && Math.random() < 0.3) {
        const player = players[Math.floor(Math.random() * players.length)];
        highlights.push(`${minute}' - GOL! ${player} marca para ${awayTeamName}`);
        awayGoalCount++;
      }
    }
    
    return highlights;
  }

  // ===== PARTIDAS DIRETAS =====

  async createDirectMatch(matchData: any) {
    try {
      const { data, error } = await supabase
        .from('game_direct_matches')
        .insert(matchData)
        .select()
        .single();

      if (error) throw new Error(`Error creating direct match: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating direct match:', error);
      throw error;
    }
  }

  async getDirectMatches(teamId?: string, userId?: string) {
    try {
      let query = supabase
        .from('game_direct_matches')
        .select(`
          *,
          home_team:game_teams!home_team_id(*),
          away_team:game_teams!away_team_id(*)
        `);

      if (teamId) {
        query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
      }

      if (userId) {
        query = query.or(`created_by.eq.${userId},accepted_by.eq.${userId}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new Error(`Error fetching direct matches: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting direct matches:', error);
      throw error;
    }
  }

  async simulateDirectMatch(matchId: string) {
    try {
      // Buscar a partida
      const { data: match, error: matchError } = await supabase
        .from('game_direct_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw new Error(`Error fetching match: ${matchError.message}`);

      // Buscar os times
      const { data: homeTeam, error: homeError } = await supabase
        .from('game_teams')
        .select('*')
        .eq('id', match.home_team_id)
        .single();

      const { data: awayTeam, error: awayError } = await supabase
        .from('game_teams')
        .select('*')
        .eq('id', match.away_team_id)
        .single();

      if (homeError || awayError) {
        throw new Error('Error fetching teams');
      }

      // Simular a partida
      const simulation = this.simulateMatchResult(homeTeam, awayTeam);

      // Atualizar a partida
      const { data: updatedMatch, error: updateError } = await supabase
        .from('game_direct_matches')
        .update({
          home_score: simulation.homeScore,
          away_score: simulation.awayScore,
          status: 'finished',
          highlights: simulation.highlights,
          simulation_data: {
            stats: simulation.stats,
            highlights: simulation.highlights
          }
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) throw new Error(`Error updating match: ${updateError.message}`);

      this.logger.log(`Direct match simulated: ${matchId} - ${simulation.homeScore}x${simulation.awayScore}`);
      return updatedMatch;
    } catch (error) {
      this.logger.error('Error simulating direct match:', error);
      throw error;
    }
  }

  // ===== CONVITES =====

  async sendMatchInvite(inviteData: any) {
    try {
      const { data, error } = await supabase
        .from('game_match_invites')
        .insert(inviteData)
        .select()
        .single();

      if (error) throw new Error(`Error sending invite: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error sending invite:', error);
      throw error;
    }
  }

  async getMatchInvites(userId: string) {
    try {
      const { data, error } = await supabase
        .from('game_match_invites')
        .select(`
          *,
          match:game_direct_matches(*)
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Error fetching invites: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting invites:', error);
      throw error;
    }
  }

  async respondToInvite(inviteId: string, response: 'accepted' | 'declined') {
    try {
      const { data, error } = await supabase
        .from('game_match_invites')
        .update({ status: response })
        .eq('id', inviteId)
        .select()
        .single();

      if (error) throw new Error(`Error responding to invite: ${error.message}`);
      return data;
    } catch (error) {
      this.logger.error('Error responding to invite:', error);
      throw error;
    }
  }

  // ===== AUTO-POPULAÇÃO DE COMPETIÇÕES =====

  private async autoPopulateCompetition(competitionId: string, neededTeams: number) {
    try {
      this.logger.log(`Auto-populando competição ${competitionId} com ${neededTeams} times da máquina`);

      // Buscar times da máquina disponíveis
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_teams')
        .select('*')
        .eq('team_type', 'machine')
        .limit(neededTeams);

      if (teamsError) {
        this.logger.error('Error fetching machine teams:', teamsError);
        return;
      }

      if (!machineTeams || machineTeams.length === 0) {
        this.logger.warn('No machine teams available for auto-population');
        return;
      }

      // Inserir times da máquina na competição
      for (const team of machineTeams) {
        try {
          // Verificar se o time já está inscrito
          const { data: existingReg, error: checkError } = await supabase
            .from('game_competition_teams')
            .select('id')
            .eq('competition_id', competitionId)
            .eq('team_id', team.id)
            .single();

          if (existingReg) {
            this.logger.log(`${team.name} já está inscrito na competição`);
            continue;
          }

          // Inserir inscrição
          const { error: insertError } = await supabase
            .from('game_competition_teams')
            .insert({
              competition_id: competitionId,
              team_id: team.id,
              points: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              goal_difference: 0,
              position: null,
              status: 'active'
            });

          if (insertError) {
            this.logger.error(`Error registering ${team.name}: ${insertError.message}`);
            continue;
          }

          // Criar entrada na classificação
          const { error: standingsError } = await supabase
            .from('game_standings')
            .insert({
              competition_id: competitionId,
              team_id: team.id,
              season_year: 2024,
              position: 0,
              games_played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goals_for: 0,
              goals_against: 0,
              points: 0
            });

          if (standingsError) {
            this.logger.error(`Error creating standings for ${team.name}: ${standingsError.message}`);
          } else {
            this.logger.log(`✅ ${team.name} auto-inscrito na competição`);
          }

        } catch (error) {
          this.logger.error(`Error processing ${team.name}: ${error.message}`);
        }
      }

      this.logger.log(`Auto-população concluída: ${machineTeams.length} times adicionados`);
    } catch (error) {
      this.logger.error('Error in auto-population:', error);
    }
  }

  // ===== SISTEMA DE TEMPORADAS =====
  
  async getSeasonStatus() {
    try {
      const { data, error } = await supabase
        .from('game_competitions')
        .select('name, tier, season_year, status, current_teams, max_teams')
        .order('tier', { ascending: true });

      if (error) throw new Error(`Error fetching season status: ${error.message}`);
      return data || [];
    } catch (error) {
      this.logger.error('Error getting season status:', error);
      throw error;
    }
  }

  async endSeason() {
    try {
      // Buscar todas as competições ativas
      const { data: competitions, error: compError } = await supabase
        .from('game_competitions')
        .select('id, name, tier, promotion_spots, relegation_spots')
        .eq('status', 'active')
        .order('tier', { ascending: true });

      if (compError) throw new Error(`Error fetching competitions: ${compError.message}`);

      const results = [];

      // Processar promoção/rebaixamento para cada competição
      for (const competition of competitions) {
        const competitionResult = {
          competition: competition.name,
          promoted: [],
          relegated: []
        };

        // Buscar times para promoção (se não for Série A)
        if (competition.tier > 1) {
          const { data: topTeams, error: topError } = await supabase
            .from('game_standings')
            .select(`
              *,
              game_teams!inner(id, name, team_type)
            `)
            .eq('competition_id', competition.id)
            .order('points', { ascending: false })
            .limit(competition.promotion_spots || 4);

          if (!topError && topTeams) {
            const userTeamsToPromote = topTeams.filter(standing => 
              standing.game_teams.team_type === 'user_created'
            );

            if (userTeamsToPromote.length > 0) {
              // Encontrar competição superior
              const higherTier = competition.tier - 1;
              const { data: higherCompetition } = await supabase
                .from('game_competitions')
                .select('id, name')
                .eq('tier', higherTier)
                .single();

              if (higherCompetition) {
                for (const standing of userTeamsToPromote) {
                  // Remover da competição atual
                  await supabase
                    .from('game_competition_teams')
                    .delete()
                    .eq('competition_id', competition.id)
                    .eq('team_id', standing.team_id);

                  // Adicionar à competição superior
                  await supabase
                    .from('game_competition_teams')
                    .insert({
                      competition_id: higherCompetition.id,
                      team_id: standing.team_id,
                      registered_at: new Date().toISOString()
                    });

                  competitionResult.promoted.push({
                    team: standing.game_teams.name,
                    from: competition.name,
                    to: higherCompetition.name
                  });
                }
              }
            }
          }
        }

        // Buscar times para rebaixamento (se não for Série D)
        if (competition.tier < 4) {
          const { data: bottomTeams, error: bottomError } = await supabase
            .from('game_standings')
            .select(`
              *,
              game_teams!inner(id, name, team_type)
            `)
            .eq('competition_id', competition.id)
            .order('points', { ascending: true })
            .limit(competition.relegation_spots || 4);

          if (!bottomError && bottomTeams) {
            const machineTeamsToRelegate = bottomTeams.filter(standing => 
              standing.game_teams.team_type === 'machine'
            );

            if (machineTeamsToRelegate.length > 0) {
              // Encontrar competição inferior
              const lowerTier = competition.tier + 1;
              const { data: lowerCompetition } = await supabase
                .from('game_competitions')
                .select('id, name')
                .eq('tier', lowerTier)
                .single();

              if (lowerCompetition) {
                for (const standing of machineTeamsToRelegate) {
                  // Remover da competição atual
                  await supabase
                    .from('game_competition_teams')
                    .delete()
                    .eq('competition_id', competition.id)
                    .eq('team_id', standing.team_id);

                  // Adicionar à competição inferior
                  await supabase
                    .from('game_competition_teams')
                    .insert({
                      competition_id: lowerCompetition.id,
                      team_id: standing.team_id,
                      registered_at: new Date().toISOString()
                    });

                  competitionResult.relegated.push({
                    team: standing.game_teams.name,
                    from: competition.name,
                    to: lowerCompetition.name
                  });
                }
              }
            }
          }
        }

        results.push(competitionResult);
      }

      // Atualizar contadores das competições
      for (const competition of competitions) {
        const { count: teamCount } = await supabase
          .from('game_competition_teams')
          .select('*', { count: 'exact', head: true })
          .eq('competition_id', competition.id);

        await supabase
          .from('game_competitions')
          .update({ current_teams: teamCount || 0 })
          .eq('id', competition.id);
      }

      // Finalizar temporada atual
      const currentYear = competitions[0]?.season_year || 2025;
      await supabase
        .from('game_competitions')
        .update({ 
          status: 'finished',
          season_year: currentYear + 1
        })
        .eq('status', 'active');

      return {
        success: true,
        message: 'Temporada finalizada com sucesso',
        results
      };

    } catch (error) {
      this.logger.error('Error ending season:', error);
      throw error;
    }
  }

  async startNewSeason() {
    try {
      const { error } = await supabase
        .from('game_competitions')
        .update({ 
          status: 'active',
          season_year: new Date().getFullYear()
        })
        .eq('status', 'finished');

      if (error) throw new Error(`Error starting new season: ${error.message}`);

      return {
        success: true,
        message: 'Nova temporada iniciada com sucesso'
      };
    } catch (error) {
      this.logger.error('Error starting new season:', error);
      throw error;
    }
  }
} 
