import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { MachineTeamsService } from '../machine-teams/machine-teams.service';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(private readonly machineTeamsService: MachineTeamsService) {}

  // ===== GERENCIAMENTO DE TEMPORADAS =====

  /**
   * Inicializa temporada para um usuário que acabou de criar um time
   * Automaticamente inscreve na Série D e cria calendário completo
   */
  async initializeUserSeason(userId: string, teamId: string, seasonYear: number = new Date().getFullYear(), tier: number = 4) {
    try {
      this.logger.log(`🏁 Inicializando temporada ${seasonYear} para usuário ${userId} (time: ${teamId}) na Série ${this.getTierName(tier)}`);

      // 1. Criar registro de progresso na série especificada
      const userProgress = await this.createUserProgress(userId, teamId, tier, seasonYear);
      
      // 2. Gerar calendário completo da temporada
      const calendar = await this.generateSeasonCalendar(userId, teamId, tier, seasonYear);
      
      // 3. Zerar/criar stats dos times da máquina para o usuário/temporada
      await this.createZeroStatsForMachineTeams(userId, seasonYear, tier);
      
      // 4. Atualizar progresso com informações iniciais (TODOS COMEÇAM ZERADOS)
      await this.updateUserProgress(userId, teamId, seasonYear, {
        position: 1, // Todos começam na mesma posição
        season_status: 'active'
      });

      this.logger.log(`✅ Temporada inicializada: ${calendar.matches.length} partidas criadas`);
      
      return {
        user_progress: userProgress,
        calendar: calendar,
        season_info: {
          tier: tier,
          tier_name: this.getTierName(tier),
          season_year: seasonYear,
          total_matches: calendar.matches.length,
          opponents: calendar.opponents.length
        }
      };
    } catch (error) {
      this.logger.error('Error initializing user season:', error);
      throw error;
    }
  }

  /**
   * Cria registro de progresso do usuário numa competição
   */
  async createUserProgress(userId: string, teamId: string, tier: number, seasonYear: number) {
    try {
      this.logger.log(`📊 Criando progresso do usuário na Série ${this.getTierName(tier)}`);

      // Verificar se já existe registro
      const { data: existingProgress, error: checkError } = await supabase
        .from('game_user_competition_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('season_year', seasonYear)
        .single();

      if (existingProgress) {
        this.logger.log('📋 Progresso já existe, retornando existente');
        return existingProgress;
      }

      // Criar novo registro
      const { data: newProgress, error: createError } = await supabase
        .from('game_user_competition_progress')
        .insert({
          user_id: userId,
          team_id: teamId,
          current_tier: tier,
          season_year: seasonYear,
          position: 0,
          points: 0,
          games_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          season_status: 'active'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating user progress: ${createError.message}`);
      }

      this.logger.log(`✅ Progresso criado para Série ${this.getTierName(tier)}`);
      return newProgress;
    } catch (error) {
      this.logger.error('Error creating user progress:', error);
      throw error;
    }
  }

  /**
   * Gera calendário completo da temporada (38 rodadas)
   */
  async generateSeasonCalendar(userId: string, teamId: string, tier: number, seasonYear: number) {
    try {
      this.logger.log(`📅 Gerando calendário da temporada ${seasonYear} - Série ${this.getTierName(tier)}`);

      // Buscar adversários (19 times da máquina)
      const opponents = await this.machineTeamsService.getMachineTeamsForSeason(tier, userId);
      
      if (opponents.length !== 19) {
        throw new Error(`Série ${this.getTierName(tier)} deve ter exatamente 19 times da máquina`);
      }

      // Gerar partidas usando algoritmo round-robin duplo
      const matches = this.generateRoundRobinMatches(userId, teamId, opponents, seasonYear, tier);
      
      // Inserir partidas no banco
      const insertedMatches = await this.insertSeasonMatches(matches);

      this.logger.log(`📅 Calendário gerado: ${insertedMatches.length} partidas criadas`);

      return {
        matches: insertedMatches,
        opponents: opponents,
        total_rounds: 38,
        season_year: seasonYear,
        tier: tier
      };
    } catch (error) {
      this.logger.error('Error generating season calendar:', error);
      throw error;
    }
  }

  /**
   * Gera partidas usando algoritmo round-robin duplo (turno e returno)
   */
  private generateRoundRobinMatches(userId: string, teamId: string, opponents: any[], seasonYear: number, tier: number) {
    const matches = [];
    const startDate = new Date(seasonYear, 0, 15); // 15 de janeiro
    let matchDate = new Date(startDate);

    // TURNO (rodadas 1-19)
    for (let round = 1; round <= 19; round++) {
      const opponent = opponents[round - 1];
      
      // Alternar casa e fora baseado na rodada
      const userPlaysHome = round % 2 === 1;
      
      const match = {
        user_id: userId,
        season_year: seasonYear,
        tier: tier,
        round_number: round,
        home_team_id: userPlaysHome ? teamId : null,
        away_team_id: userPlaysHome ? null : teamId,
        home_machine_team_id: userPlaysHome ? null : opponent.id,
        away_machine_team_id: userPlaysHome ? opponent.id : null,
        home_score: 0,
        away_score: 0,
        match_date: new Date(matchDate),
        status: 'scheduled'
      };

      matches.push(match);
      
      // Próxima partida em 7-10 dias
      matchDate.setDate(matchDate.getDate() + 7 + Math.floor(Math.random() * 4));
    }

    // RETURNO (rodadas 20-38)
    for (let round = 20; round <= 38; round++) {
      const opponentIndex = round - 20;
      const opponent = opponents[opponentIndex];
      
      // Inverter casa e fora do turno
      const userPlaysHome = (round - 19) % 2 === 0; // Oposto do turno
      
      const match = {
        user_id: userId,
        season_year: seasonYear,
        tier: tier,
        round_number: round,
        home_team_id: userPlaysHome ? teamId : null,
        away_team_id: userPlaysHome ? null : teamId,
        home_machine_team_id: userPlaysHome ? null : opponent.id,
        away_machine_team_id: userPlaysHome ? opponent.id : null,
        home_score: 0,
        away_score: 0,
        match_date: new Date(matchDate),
        status: 'scheduled'
      };

      matches.push(match);
      
      // Próxima partida em 7-10 dias
      matchDate.setDate(matchDate.getDate() + 7 + Math.floor(Math.random() * 4));
    }

    this.logger.log(`🎯 Geradas ${matches.length} partidas (19 turno + 19 returno)`);
    return matches;
  }

  /**
   * Insere partidas da temporada no banco de dados
   */
  private async insertSeasonMatches(matches: any[]) {
    try {
      this.logger.log(`💾 Inserindo ${matches.length} partidas no banco...`);

      // Inserir em lotes para melhor performance
      const batchSize = 10;
      const insertedMatches = [];

      for (let i = 0; i < matches.length; i += batchSize) {
        const batch = matches.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('game_season_matches')
          .insert(batch)
          .select();

        if (error) {
          throw new Error(`Error inserting matches batch: ${error.message}`);
        }

        insertedMatches.push(...(data || []));
        
        // Log progresso
        this.logger.log(`📝 Inserido lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(matches.length/batchSize)}`);
      }

      this.logger.log(`✅ ${insertedMatches.length} partidas inseridas com sucesso`);
      return insertedMatches;
    } catch (error) {
      this.logger.error('Error inserting season matches:', error);
      throw error;
    }
  }

  // ===== CONSULTAS DE TEMPORADA =====

  /**
   * Busca progresso atual do usuário
   */
  async getUserCurrentProgress(userId: string, seasonYear?: number) {
    try {
      this.logger.log(`📊 Buscando progresso do usuário ${userId}${seasonYear ? ` para temporada ${seasonYear}` : ' (temporada mais recente)'}`);
      
      let query = supabase
        .from('game_user_competition_progress')
        .select(`
          *,
          team:game_teams(id, name, colors, logo_url)
        `)
        .eq('user_id', userId)
        .eq('season_status', 'active')
        .order('season_year', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      // Se seasonYear foi especificado, filtrar por ele
      if (seasonYear) {
        query = query.eq('season_year', seasonYear);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching user progress: ${error.message}`);
      }

      // Debug: mostrar todas as temporadas encontradas
      if (data && data.length > 0) {
        this.logger.log(`✅ Encontradas ${data.length} temporadas ativas:`);
        data.forEach((progress, index) => {
          this.logger.log(`   ${index + 1}. Temporada ${progress.season_year}: ${progress.points} pts, ${progress.games_played} jogos`);
        });
      } else {
        this.logger.log('❌ Nenhuma temporada ativa encontrada');
      }

      // Retornar o primeiro (mais recente) ou null se não houver nenhum
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      this.logger.error('Error getting user current progress:', error);
      throw error;
    }
  }

  /**
   * Busca próximas partidas do usuário
   */
  async getUserUpcomingMatches(userId: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('game_season_matches')
        .select(`
          *,
          home_team:game_teams!home_team_id(name, colors),
          away_team:game_teams!away_team_id(name, colors),
          home_machine:game_machine_teams!home_machine_team_id(name, colors, stadium_name),
          away_machine:game_machine_teams!away_machine_team_id(name, colors, stadium_name)
        `)
        .eq('user_id', userId)
        .in('status', ['scheduled', 'in_progress'])
        .order('match_date', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Error fetching upcoming matches: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error getting user upcoming matches:', error);
      throw error;
    }
  }

  /**
   * Busca partidas recentes do usuário
   */
  async getUserRecentMatches(userId: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('game_season_matches')
        .select(`
          *,
          home_team:game_teams!home_team_id(name, colors),
          away_team:game_teams!away_team_id(name, colors),
          home_machine:game_machine_teams!home_machine_team_id(name, colors, stadium_name),
          away_machine:game_machine_teams!away_machine_team_id(name, colors, stadium_name)
        `)
        .eq('user_id', userId)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Error fetching recent matches: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error getting user recent matches:', error);
      throw error;
    }
  }

  // ===== ATUALIZAÇÃO DE DADOS =====

  /**
   * Atualiza progresso do usuário na competição
   */
  async updateUserProgress(userId: string, teamId: string, seasonYear: number, updates: any) {
    try {
      const { data, error } = await supabase
        .from('game_user_competition_progress')
        .update(updates)
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('season_year', seasonYear)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating user progress: ${error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Error updating user progress:', error);
      throw error;
    }
  }

  /**
   * Recalcula classificação do usuário baseado nos resultados
   */
  async recalculateUserStandings(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      this.logger.log(`📊 Recalculando classificação para usuário ${userId}`);

      // Buscar todas as partidas finalizadas
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('status', 'finished');

      if (matchesError) {
        throw new Error(`Error fetching matches: ${matchesError.message}`);
      }

      // Buscar teamId do usuário
      let userTeamId = null;
      if (matches && matches.length > 0) {
        userTeamId = matches[0].home_team_id || matches[0].away_team_id;
      }

      if (!userTeamId) {
        throw new Error('Não foi possível encontrar o teamId do usuário');
      }

      // Calcular estatísticas
      let points = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const match of matches || []) {
        const userIsHome = match.home_team_id !== null;
        const userScore = userIsHome ? match.home_score : match.away_score;
        const opponentScore = userIsHome ? match.away_score : match.home_score;

        goalsFor += userScore;
        goalsAgainst += opponentScore;

        if (userScore > opponentScore) {
          wins++;
          points += 3;
        } else if (userScore === opponentScore) {
          draws++;
          points += 1;
        } else {
          losses++;
        }
      }

      // Calcular posição atual na classificação
      const currentPosition = await this.calculateUserPosition(userId, seasonYear, points, goalsFor, goalsAgainst);

      // Atualizar progresso incluindo a posição
      const updatedProgress = await this.updateUserProgress(userId, userTeamId, seasonYear, {
        points,
        games_played: matches?.length || 0,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        position: currentPosition
      });

      this.logger.log(`✅ Classificação atualizada: ${points} pontos em ${matches?.length || 0} jogos, posição ${currentPosition}`);
      
      return updatedProgress;
    } catch (error) {
      this.logger.error('Error recalculating user standings:', error);
      throw error;
    }
  }

  // ===== UTILITÁRIOS =====

  private getTierName(tier: number): string {
    const tierNames = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tierNames[tier] || 'Desconhecida';
  }

  /**
   * Verifica se temporada está ativa
   */
  async isSeasonActive(userId: string, seasonYear: number = new Date().getFullYear()): Promise<boolean> {
    try {
      const progress = await this.getUserCurrentProgress(userId, seasonYear);
      return progress?.season_status === 'active';
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca classificação completa da série do usuário
   */
  async getFullStandings(userId: string, seasonYear?: number) {
    try {
      this.logger.log(`📊 Gerando classificação completa para usuário ${userId}${seasonYear ? ` para temporada ${seasonYear}` : ' (temporada mais recente)'}`);

      // 1. Buscar progresso atual do usuário para saber a série
      const userProgress = await this.getUserCurrentProgress(userId, seasonYear);
      
      if (!userProgress) {
        throw new Error('Usuário não tem temporada ativa');
      }

      const tier = userProgress.current_tier;
      const actualSeasonYear = userProgress.season_year; // Usar a temporada real do progresso
      
      // 2. NOVO: Simular automaticamente todas as rodadas pendentes
      // await this.simulateAllPendingRounds(userId, actualSeasonYear, tier);
      
      // 3. Buscar todos os times da máquina da mesma série
      const machineTeams = await this.machineTeamsService.getMachineTeamsForSeason(tier, userId);
      
      // 4. Buscar estatísticas ISOLADAS POR USUÁRIO dos times da máquina
      const machineStandings = await Promise.all(
        machineTeams.map(async (team, index) => {
          // Buscar estatísticas específicas do usuário da tabela game_user_machine_team_stats
          const { data: stats, error } = await supabase
            .from('game_user_machine_team_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('team_id', team.id)
            .eq('season_year', actualSeasonYear)
            .eq('tier', tier)
            .single();

          // Se não encontrar estatísticas do usuário, usar valores zerados (novo usuário)
          const teamStats = stats || {
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          };

          return {
            position: index + 1, // Posição temporária, será reordenada depois
            team_name: team.name,
            team_colors: team.colors,
            team_type: 'machine',
            team_id: team.id,
            points: teamStats.points,
            games_played: teamStats.games_played,
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
            goals_for: teamStats.goals_for,
            goals_against: teamStats.goals_against,
            goal_difference: teamStats.goals_for - teamStats.goals_against,
            stadium_name: team.stadium_name
          };
        })
      );

      // 5. Adicionar o time do usuário
      const userStanding = {
        position: userProgress.position || 20,
        team_name: userProgress.team?.name || 'Seu Time',
        team_colors: userProgress.team?.colors || { primary: '#0066CC', secondary: '#FFFFFF' },
        team_type: 'user',
        team_id: userProgress.team_id,
        points: userProgress.points,
        games_played: userProgress.games_played,
        wins: userProgress.wins,
        draws: userProgress.draws,
        losses: userProgress.losses,
        goals_for: userProgress.goals_for,
        goals_against: userProgress.goals_against,
        goal_difference: userProgress.goal_difference || (userProgress.goals_for - userProgress.goals_against),
        stadium_name: 'Seu Estádio'
      };

      // 6. Combinar e ordenar todos os times
      const allStandings = [...machineStandings, userStanding];
      
      // Ordenar por: pontos DESC, saldo de gols DESC, gols feitos DESC
      allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // 7. Atualizar posições baseadas na ordenação
      allStandings.forEach((team, index) => {
        team.position = index + 1;
      });

      this.logger.log(`✅ Classificação gerada: ${allStandings.length} times na Série ${this.getTierName(tier)}`);

      return {
        tier: tier,
        tier_name: this.getTierName(tier),
        season_year: seasonYear,
        standings: allStandings,
        user_position: allStandings.find(s => s.team_type === 'user')?.position || 20,
        total_teams: allStandings.length
      };

    } catch (error) {
      this.logger.error('Error generating full standings:', error);
      throw error;
    }
  }

  /**
   * Busca informações resumidas da temporada
   */
  async getSeasonSummary(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      const [progress, upcomingMatches, recentMatches] = await Promise.all([
        this.getUserCurrentProgress(userId, seasonYear),
        this.getUserUpcomingMatches(userId, 3),
        this.getUserRecentMatches(userId, 3)
      ]);

      return {
        progress,
        upcoming_matches: upcomingMatches,
        recent_matches: recentMatches,
        season_year: seasonYear,
        is_active: progress?.season_status === 'active'
      };
    } catch (error) {
      this.logger.error('Error getting season summary:', error);
      throw error;
    }
  }

  // ===== SIMULAÇÃO DE PARTIDAS =====

  /**
   * Simula uma partida específica e TODA A RODADA (estilo Elifoot)
   */
  async simulateMatch(matchId: string, userId: string) {
    try {
      this.logger.log(`⚽ Simulando partida ${matchId} do usuário ${userId}`);

      // 1. Buscar dados da partida
      this.logger.log(`🔍 Buscando partida ${matchId} para usuário ${userId}`);
      
      // Primeiro, buscar apenas a partida básica para debug
      const { data: match, error: matchError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('id', matchId)
        .eq('user_id', userId)
        .eq('status', 'scheduled')
        .single();

      this.logger.log(`🔍 Query result: error=${!!matchError}, match=${!!match}`);
      if (matchError) {
        this.logger.error('❌ Match query error:', matchError);
      }
      if (match) {
        this.logger.log(`✅ Match found: ${match.id}, status: ${match.status}`);
      }

      if (matchError || !match) {
        throw new Error('Partida não encontrada ou já foi simulada');
      }

      // 2. Simular resultado usando algoritmo baseado em ratings
      const simulationResult = this.simulateMatchResult(match);
      
      // 3. Atualizar partida no banco
      const { data: updatedMatch, error: updateError } = await supabase
        .from('game_season_matches')
        .update({
          home_score: simulationResult.homeScore,
          away_score: simulationResult.awayScore,
          status: 'finished',
          simulation_data: simulationResult.details,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Erro ao atualizar partida: ${updateError.message}`);
      }

      // 4. NOVO: Simular TODA A RODADA (estilo Elifoot)
      await this.simulateEntireRound(userId, match.round_number, match.season_year, match.tier);

      // 5. Recalcular estatísticas do usuário
      const userTeamId = match.home_team_id || match.away_team_id;
      await this.recalculateUserStandingsAfterMatch(userId, match.season_year, userTeamId);

      this.logger.log(`✅ Partida simulada: ${simulationResult.homeScore}-${simulationResult.awayScore}`);
      this.logger.log(`🏆 Rodada ${match.round_number} completamente simulada`);

      return {
        success: true,
        match: updatedMatch,
        result: simulationResult,
        round_completed: true,
        data: {
          home_score: simulationResult.homeScore,
          away_score: simulationResult.awayScore
        },
        message: `Partida simulada: ${simulationResult.homeScore}-${simulationResult.awayScore}`
      };

    } catch (error) {
      this.logger.error('Erro ao simular partida:', error);
      throw error;
    }
  }

  /**
   * NOVO: Simular automaticamente todas as rodadas pendentes
   */
  private async simulateAllPendingRounds(userId: string, seasonYear: number, tier: number) {
    try {
      this.logger.log(`🎮 Verificando rodadas pendentes para usuário ${userId} na temporada ${seasonYear}`);
      
      // Buscar todas as partidas do usuário para determinar quantas rodadas já foram jogadas
      const { data: userMatches, error } = await supabase
        .from('game_season_matches')
        .select('round_number')
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('status', 'finished')
        .order('round_number', { ascending: true });

      if (error) {
        this.logger.error('Erro ao buscar partidas do usuário:', error);
        return;
      }

      // Determinar a última rodada jogada pelo usuário
      const playedRounds = userMatches?.map(m => m.round_number) || [];
      const lastPlayedRound = playedRounds.length > 0 ? Math.max(...playedRounds) : 0;

      this.logger.log(`📊 Usuário jogou até a rodada ${lastPlayedRound}`);

      if (lastPlayedRound === 0) {
        this.logger.log(`ℹ️ Usuário ainda não jogou nenhuma partida, não há rodadas para simular`);
        return;
      }

      // Verificar se já existem partidas simuladas entre times da máquina para as rodadas até lastPlayedRound
      const { data: existingMachineMatches, error: checkError } = await supabase
        .from('game_season_matches')
        .select('round_number')
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('status', 'finished')
        .not('home_machine_team_id', 'is', null) // Partidas entre times da máquina (home_machine_team_id não é null)
        .not('away_machine_team_id', 'is', null) // Partidas entre times da máquina (away_machine_team_id não é null)
        .order('round_number', { ascending: true });

      if (checkError) {
        this.logger.error('Erro ao verificar partidas existentes:', checkError);
        return;
      }

      const simulatedRounds = existingMachineMatches?.map(m => m.round_number) || [];
      this.logger.log(`📊 Rodadas já simuladas: ${simulatedRounds.join(', ')}`);

      // Para cada rodada até a última rodada jogada pelo usuário,
      // simular apenas se ainda não foi simulada
      for (let round = 1; round <= lastPlayedRound; round++) {
        if (!simulatedRounds.includes(round)) {
          this.logger.log(`🎮 Simulando rodada ${round} (ainda não simulada)`);
          
          // Define uma data base para a rodada (ex: sábado às 16h, variando a semana)
          const baseDate = new Date(seasonYear, 0, 1); // 1º de janeiro da temporada
          baseDate.setDate(baseDate.getDate() + (7 * (round - 1))); // cada rodada uma semana depois
          baseDate.setHours(16, 0, 0, 0);
          
          await this.simulateEntireRoundInternal(userId, round, seasonYear, tier, baseDate);
        } else {
          this.logger.log(`ℹ️ Rodada ${round} já foi simulada, pulando`);
        }
      }

      this.logger.log(`✅ Verificação de rodadas concluída: usuário jogou até rodada ${lastPlayedRound}`);
    } catch (error) {
      this.logger.error('Erro ao simular rodadas pendentes:', error);
      // Não parar o processo se a simulação falhar
    }
  }

  /**
   * Simular rodada com data passada (para rodadas anteriores)
   */
  private async simulateEntireRoundWithPastDate(userId: string, roundNumber: number, seasonYear: number, tier: number) {
    try {
      this.logger.log(`🎮 Simulando rodada ${roundNumber} com data passada`);
      
      // Calcular data passada (7 dias atrás por rodada)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - (7 * (roundNumber + 1)));
      
      await this.simulateEntireRoundInternal(userId, roundNumber, seasonYear, tier, pastDate);
      
    } catch (error) {
      this.logger.error('Erro ao simular rodada com data passada:', error);
    }
  }

  /**
   * Simular rodada com data atual (para última rodada)
   */
  private async simulateEntireRoundWithCurrentDate(userId: string, roundNumber: number, seasonYear: number, tier: number) {
    try {
      this.logger.log(`🎮 Simulando rodada ${roundNumber} com data atual`);
      
      const currentDate = new Date();
      await this.simulateEntireRoundInternal(userId, roundNumber, seasonYear, tier, currentDate);
      
    } catch (error) {
      this.logger.error('Erro ao simular rodada com data atual:', error);
    }
  }

  /**
   * Função interna para simular rodada com data específica
   */
  private async simulateEntireRoundInternal(userId: string, roundNumber: number, seasonYear: number, tier: number, matchDate: Date) {
    try {
      this.logger.log(`🎮 Simulando rodada ${roundNumber} com data ${matchDate.toISOString()}`);

      // 1. Buscar todos os times da máquina da série
      const machineTeams = await this.machineTeamsService.getMachineTeamsForSeason(tier, userId);
      
      if (machineTeams.length < 19) {
        this.logger.warn(`⚠️ Série tem apenas ${machineTeams.length} times da máquina, esperado 19`);
        return;
      }

      // 2. Simular partidas entre times da máquina baseado na rodada
      const machineMatches = this.generateMachineMatchesForRound(machineTeams, roundNumber);
      
      // 3. Simular cada partida e atualizar estatísticas
      for (const match of machineMatches) {
        const result = this.simulateMachineVsMachine(match.homeTeam, match.awayTeam);
        
        // Atualizar estatísticas dos times da máquina (ISOLADO POR USUÁRIO)
        await this.updateMachineTeamStats(match.homeTeam.id, result.homeGoals, result.awayGoals, seasonYear, tier, userId);
        await this.updateMachineTeamStats(match.awayTeam.id, result.awayGoals, result.homeGoals, seasonYear, tier, userId);
      }

      this.logger.log(`✅ Rodada ${roundNumber} simulada completamente - ${machineMatches.length} partidas entre times da máquina`);
      
    } catch (error) {
      this.logger.error('Error simulating entire round:', error);
      // Não parar o processo se a simulação da rodada falhar
    }
  }

  /**
   * NOVO: Simular toda a rodada (todos os jogos entre times da máquina)
   */
  private async simulateEntireRound(userId: string, roundNumber: number, seasonYear: number, tier: number) {
    // Usar data atual por padrão
    await this.simulateEntireRoundInternal(userId, roundNumber, seasonYear, tier, new Date());
  }

  /**
   * Gera partidas entre times da máquina para uma rodada específica
   * Algoritmo round-robin simples para 19 times - garante número igual de jogos
   */
  private generateMachineMatchesForRound(machineTeams: any[], roundNumber: number) {
    const matches = [];
    const teamsCount = machineTeams.length; // 19 times
    
    if (teamsCount !== 19) {
      this.logger.warn(`⚠️ Algoritmo otimizado para 19 times, mas encontrou ${teamsCount}`);
      return matches;
    }
    
    // Com 19 times: cada rodada 1 time descansa, 18 jogam (9 partidas)
    // Ao longo de 38 rodadas: cada time descansa 2x, joga 36x
    
    const isReturno = roundNumber > 19;
    const actualRound = isReturno ? roundNumber - 19 : roundNumber;
    
    // Determinar qual time descansa nesta rodada (rotação simples)
    const restingTeamIndex = (actualRound - 1) % teamsCount;
    
    // Times que jogam (todos exceto o que descansa)
    const playingTeams = machineTeams.filter((_, index) => index !== restingTeamIndex);
    
    // Gerar exatamente 9 partidas com os 18 times
    for (let i = 0; i < 9; i++) {
      let homeTeam = playingTeams[i];
      let awayTeam = playingTeams[17 - i]; // 18 - 1 - i
      
      // No returno, inverter mando de campo
      if (isReturno) {
        [homeTeam, awayTeam] = [awayTeam, homeTeam];
      }
      
      matches.push({
        homeTeam: homeTeam,
        awayTeam: awayTeam
      });
    }
    
    this.logger.debug(`🎯 Rodada ${roundNumber}: ${matches.length} partidas, time descansando: ${machineTeams[restingTeamIndex]?.name || 'N/A'}`);
    
    return matches;
  }

  /**
   * Simula partida entre dois times da máquina
   */
  private simulateMachineVsMachine(homeTeam: any, awayTeam: any) {
    // Calcular força dos times
    const homeStrength = this.machineTeamsService.calculateMachineTeamStrength(homeTeam, true);
    const awayStrength = this.machineTeamsService.calculateMachineTeamStrength(awayTeam, false);
    
    // Diferença de força
    const strengthDiff = homeStrength - awayStrength;
    
    // Probabilidades baseadas na diferença
    let homeWinChance = 40 + (strengthDiff * 2); // 40% base + ajuste
    let drawChance = 30;
    let awayWinChance = 100 - homeWinChance - drawChance;
    
    // Limitar probabilidades
    homeWinChance = Math.max(15, Math.min(70, homeWinChance));
    awayWinChance = Math.max(15, 100 - homeWinChance - drawChance);
    
    // Sorteio do resultado
    const random = Math.random() * 100;
    let homeGoals, awayGoals;
    
    if (random < homeWinChance) {
      // Vitória do mandante
      homeGoals = 1 + Math.floor(Math.random() * 3); // 1-3 gols
      awayGoals = Math.floor(Math.random() * homeGoals); // 0 a homeGoals-1
    } else if (random < homeWinChance + drawChance) {
      // Empate
      const goals = Math.floor(Math.random() * 4); // 0-3 gols
      homeGoals = goals;
      awayGoals = goals;
    } else {
      // Vitória do visitante
      awayGoals = 1 + Math.floor(Math.random() * 3); // 1-3 gols
      homeGoals = Math.floor(Math.random() * awayGoals); // 0 a awayGoals-1
    }
    
    return { homeGoals, awayGoals };
  }

  /**
   * Atualiza estatísticas de um time da máquina após uma partida (ISOLADO POR USUÁRIO)
   */
  private async updateMachineTeamStats(teamId: string, goalsFor: number, goalsAgainst: number, seasonYear: number, tier: number, userId: string) {
    try {
      // Determinar resultado (W/D/L)
      let wins = 0, draws = 0, losses = 0, points = 0;
      
      if (goalsFor > goalsAgainst) {
        wins = 1;
        points = 3;
      } else if (goalsFor === goalsAgainst) {
        draws = 1;
        points = 1;
      } else {
        losses = 1;
        points = 0;
      }

      // Buscar estatísticas atuais do time PARA O USUÁRIO ESPECÍFICO
      const { data: currentStats, error: fetchError } = await supabase
        .from('game_user_machine_team_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .eq('season_year', seasonYear)
        .eq('tier', tier)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        this.logger.error(`Erro ao buscar stats do time ${teamId} para usuário ${userId}:`, fetchError);
        return;
      }

      if (currentStats) {
        // Atualizar estatísticas existentes do usuário
        const { error: updateError } = await supabase
          .from('game_user_machine_team_stats')
          .update({
            games_played: currentStats.games_played + 1,
            wins: currentStats.wins + wins,
            draws: currentStats.draws + draws,
            losses: currentStats.losses + losses,
            goals_for: currentStats.goals_for + goalsFor,
            goals_against: currentStats.goals_against + goalsAgainst,
            points: currentStats.points + points,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('team_id', teamId)
          .eq('season_year', seasonYear)
          .eq('tier', tier);

        if (updateError) {
          this.logger.error(`Erro ao atualizar stats do time ${teamId} para usuário ${userId}:`, updateError);
        }
      } else {
        // Criar novas estatísticas para o usuário
        const { error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert({
            user_id: userId,
            team_id: teamId,
            season_year: seasonYear,
            tier: tier,
            games_played: 1,
            wins: wins,
            draws: draws,
            losses: losses,
            goals_for: goalsFor,
            goals_against: goalsAgainst,
            points: points,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          this.logger.error(`Erro ao criar stats do time ${teamId} para usuário ${userId}:`, insertError);
        }
      }
      
    } catch (error) {
      this.logger.error(`Erro ao atualizar estatísticas do time ${teamId} para usuário ${userId}:`, error);
    }
  }

  /**
   * Algoritmo de simulação de partida
   */
  private simulateMatchResult(match: any) {
    // Determinar se usuário joga em casa
    const userIsHome = match.home_team_id !== null;
    
    // Ratings base
    const userRating = 75; // Rating fixo do usuário por enquanto
    const machineRating = userIsHome ? 
      (match.away_machine?.overall_rating || 70) : 
      (match.home_machine?.overall_rating || 70);

    // Bônus de casa (+3 pontos)
    const homeBonus = 3;
    
    // Calcular probabilidade de vitória
    const userEffectiveRating = userRating + (userIsHome ? homeBonus : 0);
    const machineEffectiveRating = machineRating + (!userIsHome ? homeBonus : 0);
    
    // Gerar resultado baseado nas diferenças de rating
    const ratingDifference = userEffectiveRating - machineEffectiveRating;
    const userAdvantage = Math.max(-30, Math.min(30, ratingDifference)); // Limitar entre -30 e +30
    
    // Probabilidades base (vitória, empate, derrota)
    let winChance = 35 + (userAdvantage * 1.5); // 35% base + ajuste por rating
    let drawChance = 30;
    let lossChance = 100 - winChance - drawChance;

    // Garantir probabilidades válidas
    winChance = Math.max(10, Math.min(70, winChance));
    lossChance = Math.max(10, 100 - winChance - drawChance);

    // Sorteio do resultado
    const random = Math.random() * 100;
    let userGoals, machineGoals;

    if (random < winChance) {
      // Vitória do usuário
      userGoals = Math.floor(Math.random() * 3) + 1; // 1-3 gols
      machineGoals = Math.floor(Math.random() * userGoals); // 0 a (userGoals-1)
    } else if (random < winChance + drawChance) {
      // Empate
      const goals = Math.floor(Math.random() * 4); // 0-3 gols cada
      userGoals = goals;
      machineGoals = goals;
    } else {
      // Derrota do usuário
      machineGoals = Math.floor(Math.random() * 3) + 1; // 1-3 gols
      userGoals = Math.floor(Math.random() * machineGoals); // 0 a (machineGoals-1)
    }

    // Definir placar final baseado em quem joga em casa
    const homeScore = userIsHome ? userGoals : machineGoals;
    const awayScore = userIsHome ? machineGoals : userGoals;

    // Detalhes da simulação
    const details = {
      user_rating: userRating,
      machine_rating: machineRating,
      user_is_home: userIsHome,
      rating_difference: ratingDifference,
      win_chance: Math.round(winChance),
      draw_chance: drawChance,
      loss_chance: Math.round(lossChance),
      result_type: userGoals > machineGoals ? 'win' : userGoals === machineGoals ? 'draw' : 'loss'
    };

    return {
      homeScore,
      awayScore,
      userGoals,
      machineGoals,
      details
    };
  }

  /**
   * Recalcula estatísticas após uma partida específica
   */
  private async recalculateUserStandingsAfterMatch(userId: string, seasonYear: number, teamId: string) {
    try {
      // Buscar todas as partidas finalizadas
      const { data: matches, error: matchesError } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('status', 'finished');

      if (matchesError) {
        throw new Error(`Error fetching matches: ${matchesError.message}`);
      }

      // Calcular estatísticas
      let points = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const match of matches || []) {
        const userIsHome = match.home_team_id !== null;
        const userScore = userIsHome ? match.home_score : match.away_score;
        const opponentScore = userIsHome ? match.away_score : match.home_score;

        goalsFor += userScore;
        goalsAgainst += opponentScore;

        if (userScore > opponentScore) {
          wins++;
          points += 3;
        } else if (userScore === opponentScore) {
          draws++;
          points += 1;
        } else {
          losses++;
        }
      }

      // Calcular posição atual na classificação
      const currentPosition = await this.calculateUserPosition(userId, seasonYear, points, goalsFor, goalsAgainst);

      // Atualizar progresso incluindo a posição
      await this.updateUserProgress(userId, teamId, seasonYear, {
        points,
        games_played: matches?.length || 0,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        position: currentPosition
      });

      this.logger.log(`📊 Estatísticas atualizadas: ${points} pontos em ${matches?.length || 0} jogos, posição ${currentPosition}`);
      
    } catch (error) {
      this.logger.error('Error recalculating standings after match:', error);
      throw error;
    }
  }

  /**
   * Calcula a posição atual do usuário na classificação de uma temporada.
   * Isso é necessário porque a posição pode mudar durante a temporada.
   */
  private async calculateUserPosition(userId: string, seasonYear: number, points: number, goalsFor: number, goalsAgainst: number) {
    try {
      this.logger.log(`📊 Calculando posição do usuário ${userId} na temporada ${seasonYear}`);

      // Buscar progresso atual do usuário para saber a série
      const userProgress = await this.getUserCurrentProgress(userId, seasonYear);
      
      if (!userProgress) {
        this.logger.warn(`⚠️ Progresso do usuário ${userId} não encontrado para temporada ${seasonYear}`);
        return 1; // Fallback
      }

      const tier = userProgress.current_tier;

      // Buscar todos os times da máquina da série
      const machineTeams = await this.machineTeamsService.getMachineTeamsForSeason(tier, userId);
      
      if (machineTeams.length === 0) {
        this.logger.warn(`⚠️ Não há times da máquina na Série ${this.getTierName(tier)} para calcular posição do usuário ${userId}`);
        return 1; // Se não houver times, o usuário é o primeiro
      }

      // Buscar estatísticas de todos os times da máquina da série
      const { data: machineStats, error: standingsError } = await supabase
        .from('game_user_machine_team_stats')
        .select('team_id, points, goals_for, goals_against')
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('tier', tier);

      if (standingsError) {
        this.logger.error(`Erro ao buscar estatísticas de times da máquina para posição: ${standingsError.message}`);
        return 1; // Fallback
      }

      // Criar array com todos os times (usuário + máquina)
      const allStandings = [];

      // Adicionar o time do usuário
      allStandings.push({
        team_id: userProgress.team_id,
        team_type: 'user',
        points: points,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        goal_difference: goalsFor - goalsAgainst
      });

      // Adicionar times da máquina
      for (const team of machineTeams) {
        const teamStats = machineStats?.find(stat => stat.team_id === team.id);
        const stats = teamStats || {
          points: 0,
          goals_for: 0,
          goals_against: 0
        };

        allStandings.push({
          team_id: team.id,
          team_type: 'machine',
          points: stats.points,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: stats.goals_for - stats.goals_against
        });
      }

      // Ordenar por: pontos DESC, saldo de gols DESC, gols feitos DESC
      allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // Encontrar a posição do usuário
      const userPosition = allStandings.findIndex(standing => standing.team_type === 'user') + 1;

      this.logger.log(`✅ Posição do usuário ${userId} na temporada ${seasonYear}: ${userPosition} de ${allStandings.length}`);
      return userPosition;
    } catch (error) {
      this.logger.error('Error calculating user position:', error);
      return 1; // Fallback
    }
  }

  /**
   * Iniciar nova temporada na mesma série (pontos zerados)
   */
  async startNewSeason(userId: string): Promise<any> {
    try {
      this.logger.log(`🔄 Iniciando nova temporada para usuário ${userId}`);
      
      // Buscar progresso atual
      const currentProgress = await this.getUserCurrentProgress(userId);
      if (!currentProgress) {
        throw new Error('Usuário não tem temporada ativa');
      }

      const currentTier = currentProgress.current_tier;
      const teamId = currentProgress.team_id;
      const nextSeasonYear = currentProgress.season_year + 1;

      this.logger.log(`📅 Nova temporada: ${nextSeasonYear}, Série: ${this.getTierName(currentTier)}`);

      // 1. Verificar se já existe progresso para a nova temporada
      const { data: existingProgress } = await supabase
        .from('game_user_competition_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', nextSeasonYear)
        .eq('current_tier', currentTier);

      if (existingProgress && existingProgress.length > 0) {
        // Se já existe, apenas zerar os dados
        await supabase
          .from('game_user_competition_progress')
          .update({
            position: 0,
            points: 0,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            season_status: 'active'
          })
          .eq('user_id', userId)
          .eq('season_year', nextSeasonYear)
          .eq('current_tier', currentTier);
      } else {
        // Se não existe, criar novo progresso zerado
        await supabase
          .from('game_user_competition_progress')
          .insert({
            user_id: userId,
            team_id: teamId,
            current_tier: currentTier,
            season_year: nextSeasonYear,
            position: 0,
            points: 0,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            season_status: 'active'
          });
      }

      // 2. Verificar e zerar estatísticas dos times da máquina
      const { data: existingStats } = await supabase
        .from('game_user_machine_team_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('tier', currentTier)
        .eq('season_year', nextSeasonYear);

      if (existingStats && existingStats.length > 0) {
        // Se já existem estatísticas, apenas zerar
        await supabase
          .from('game_user_machine_team_stats')
          .update({
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          })
          .eq('user_id', userId)
          .eq('tier', currentTier)
          .eq('season_year', nextSeasonYear);
      } else {
        // Se não existem, deletar e criar novas
        await supabase
          .from('game_user_machine_team_stats')
          .delete()
          .eq('user_id', userId)
          .eq('tier', currentTier)
          .eq('season_year', nextSeasonYear);

        // Criar estatísticas zeradas para os times da máquina
        const machineTeams = await supabase
          .from('game_machine_teams')
          .select('*')
          .eq('tier', currentTier);

        if (machineTeams.data) {
          const zeroStats = machineTeams.data.map(team => ({
            user_id: userId,
            team_id: team.id,
            team_name: team.name,
            season_year: nextSeasonYear,
            tier: currentTier,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          }));

          await supabase
            .from('game_user_machine_team_stats')
            .insert(zeroStats);
        }
      }

      // 4. Verificar se já existem partidas para a nova temporada
      const { data: existingMatches } = await supabase
        .from('game_season_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('season_year', nextSeasonYear)
        .eq('tier', currentTier);

      if (existingMatches && existingMatches.length > 0) {
        // Se já existem partidas, resetar as que foram jogadas
        const finishedMatches = existingMatches.filter(m => m.status === 'finished' || m.status === 'simulated');
        if (finishedMatches.length > 0) {
          await supabase
            .from('game_season_matches')
            .update({
              status: 'scheduled',
              home_score: 0,
              away_score: 0
            })
            .eq('user_id', userId)
            .eq('season_year', nextSeasonYear)
            .eq('tier', currentTier)
            .in('status', ['finished', 'simulated']);
        }
      } else {
        // Se não existem partidas, gerar calendário
        await this.generateSeasonCalendar(userId, teamId, currentTier, nextSeasonYear);
      }

      // 5. CORREÇÃO: NÃO simular automaticamente a primeira rodada
      // As partidas entre times da máquina devem ser simuladas apenas quando o usuário jogar
      // Isso garante que todos os times comecem zerados na nova temporada
      this.logger.log(`📅 Nova temporada criada - todos os times começam zerados (incluindo times da máquina)`);
      this.logger.log(`🎯 As partidas entre times da máquina serão simuladas conforme o usuário for jogando`);

      this.logger.log(`✅ Nova temporada iniciada com sucesso para usuário ${userId}`);
      
      return {
        success: true,
        message: 'Nova temporada iniciada com sucesso',
        data: {
          season_year: nextSeasonYear,
          tier: currentTier,
          tier_name: this.getTierName(currentTier)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao iniciar nova temporada para usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Zera estatísticas de todos os times da máquina para um usuário e temporada específicos.
   */
  private async createZeroStatsForMachineTeams(userId: string, seasonYear: number, tier: number) {
    try {
      this.logger.log(`💾 Zerando estatísticas de todos os times da máquina para usuário ${userId} na temporada ${seasonYear} na Série ${this.getTierName(tier)}`);

      // Primeiro, deletar estatísticas existentes para o usuário/temporada/série
      const { error: deleteError } = await supabase
        .from('game_user_machine_team_stats')
        .delete()
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('tier', tier);

      if (deleteError) {
        this.logger.error(`Erro ao deletar estatísticas existentes: ${deleteError.message}`);
        // Continue to create new ones, but log the error
      }

      // Buscar todos os times da máquina da série
      const { data: machineTeams } = await supabase
        .from('game_machine_teams')
        .select('*')
        .eq('tier', tier);

      if (machineTeams && machineTeams.length > 0) {
        const zeroStats = machineTeams.map(team => ({
          user_id: userId,
          team_id: team.id,
          team_name: team.name,
          season_year: seasonYear,
          tier: tier,
          games_played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        }));

        const { error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert(zeroStats);

        if (insertError) {
          this.logger.error(`Erro ao criar estatísticas zeradas para times da máquina: ${insertError.message}`);
        } else {
          this.logger.log(`✅ Estatísticas zeradas criadas para ${zeroStats.length} times da máquina`);
        }
      } else {
        this.logger.warn(`⚠️ Não há times da máquina na Série ${this.getTierName(tier)} para criar estatísticas zeradas.`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao zerar estatísticas de times da máquina para usuário ${userId}:`, error);
      throw error;
    }
  }
}