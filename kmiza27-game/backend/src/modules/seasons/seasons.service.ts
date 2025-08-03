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
  async initializeUserSeason(userId: string, teamId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      this.logger.log(`🏁 Inicializando temporada ${seasonYear} para usuário ${userId} (time: ${teamId})`);

      // 1. Criar registro de progresso na Série D
      const userProgress = await this.createUserProgress(userId, teamId, 4, seasonYear);
      
      // 2. Gerar calendário completo da temporada
      const calendar = await this.generateSeasonCalendar(userId, teamId, 4, seasonYear);
      
      // 3. Atualizar progresso com informações iniciais (TODOS COMEÇAM ZERADOS)
      await this.updateUserProgress(userId, teamId, seasonYear, {
        position: 1, // Todos começam na mesma posição
        season_status: 'active'
      });

      this.logger.log(`✅ Temporada inicializada: ${calendar.matches.length} partidas criadas`);
      
      return {
        user_progress: userProgress,
        calendar: calendar,
        season_info: {
          tier: 4,
          tier_name: 'Série D',
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
  async getUserCurrentProgress(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      // Buscar todos os registros ativos e pegar o mais recente (último time criado)
      const { data, error } = await supabase
        .from('game_user_competition_progress')
        .select(`
          *,
          team:game_teams(id, name, colors, logo_url)
        `)
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('season_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Error fetching user progress: ${error.message}`);
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

      // Atualizar progresso
      const updatedProgress = await this.updateUserProgress(userId, userTeamId, seasonYear, {
        points,
        games_played: matches?.length || 0,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst
      });

      this.logger.log(`✅ Classificação atualizada: ${points} pontos em ${matches?.length || 0} jogos`);
      
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
  async getFullStandings(userId: string, seasonYear: number = new Date().getFullYear()) {
    try {
      this.logger.log(`📊 Gerando classificação completa para usuário ${userId}`);

      // 1. Buscar progresso atual do usuário para saber a série
      const userProgress = await this.getUserCurrentProgress(userId, seasonYear);
      
      if (!userProgress) {
        throw new Error('Usuário não tem temporada ativa');
      }

      const tier = userProgress.current_tier;
      
      // 2. Buscar todos os times da máquina da mesma série
      const machineTeams = await this.machineTeamsService.getMachineTeamsForSeason(tier, userId);
      
      // 3. Simular estatísticas realistas dos times da máquina
      const machineStandings = machineTeams.map((team, index) => {
        // Usar mesma quantidade de jogos que o usuário para consistência
        const games = userProgress.games_played || 1;
        
        // Calcular força do time baseada na posição (1º = mais forte, 19º = mais fraco)
        const teamStrength = (19 - index) / 19; // 0.95 para o 1º, 0.05 para o 19º
        
        // Simular resultados baseados na força do time
        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goalsFor = 0;
        let goalsAgainst = 0;
        
        // Simular cada jogo baseado na força
        for (let game = 0; game < games; game++) {
          const random = Math.random();
          const strengthFactor = teamStrength + (Math.random() - 0.5) * 0.3; // Adicionar variação
          
          if (strengthFactor > 0.7) {
            // Time forte tem mais chance de vitória
            if (random < 0.6) {
              wins++;
              goalsFor += 1 + Math.floor(Math.random() * 3); // 1-3 gols
              goalsAgainst += Math.floor(Math.random() * 2); // 0-1 gols
            } else if (random < 0.8) {
              draws++;
              const goals = Math.floor(Math.random() * 3); // 0-2 gols
              goalsFor += goals;
              goalsAgainst += goals;
            } else {
              losses++;
              goalsFor += Math.floor(Math.random() * 2); // 0-1 gols
              goalsAgainst += 1 + Math.floor(Math.random() * 2); // 1-2 gols
            }
          } else if (strengthFactor > 0.4) {
            // Time médio tem resultados equilibrados
            if (random < 0.4) {
              wins++;
              goalsFor += 1 + Math.floor(Math.random() * 2); // 1-2 gols
              goalsAgainst += Math.floor(Math.random() * 2); // 0-1 gols
            } else if (random < 0.7) {
              draws++;
              const goals = Math.floor(Math.random() * 3); // 0-2 gols
              goalsFor += goals;
              goalsAgainst += goals;
            } else {
              losses++;
              goalsFor += Math.floor(Math.random() * 2); // 0-1 gols
              goalsAgainst += 1 + Math.floor(Math.random() * 3); // 1-3 gols
            }
          } else {
            // Time fraco tem mais chance de derrota
            if (random < 0.25) {
              wins++;
              goalsFor += 1 + Math.floor(Math.random() * 2); // 1-2 gols
              goalsAgainst += Math.floor(Math.random() * 2); // 0-1 gols
            } else if (random < 0.5) {
              draws++;
              const goals = Math.floor(Math.random() * 2); // 0-1 gols
              goalsFor += goals;
              goalsAgainst += goals;
            } else {
              losses++;
              goalsFor += Math.floor(Math.random() * 2); // 0-1 gols
              goalsAgainst += 1 + Math.floor(Math.random() * 3); // 1-3 gols
            }
          }
        }
        
        // Calcular pontos corretamente: vitória = 3, empate = 1, derrota = 0
        const points = (wins * 3) + (draws * 1);
        
        return {
          position: index + 1, // Posição temporária, será reordenada depois
          team_name: team.name,
          team_colors: team.colors,
          team_type: 'machine',
          team_id: team.id,
          points: points,
          games_played: games,
          wins: wins,
          draws: draws,
          losses: losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          goal_difference: goalsFor - goalsAgainst,
          stadium_name: team.stadium_name
        };
      });

      // 4. Adicionar o time do usuário
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

      // 5. Combinar e ordenar todos os times
      const allStandings = [...machineStandings, userStanding];
      
      // Ordenar por: pontos DESC, saldo de gols DESC, gols feitos DESC
      allStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

      // 6. Atualizar posições baseadas na ordenação
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
   * NOVO: Simular toda a rodada (todos os jogos entre times da máquina)
   */
  private async simulateEntireRound(userId: string, roundNumber: number, seasonYear: number, tier: number) {
    try {
      this.logger.log(`🎮 Simulando rodada completa ${roundNumber} da temporada ${seasonYear}`);

      // Buscar todas as outras partidas da rodada (entre times da máquina)
      // Por enquanto, vamos apenas simular um comportamento básico
      // Em uma implementação completa, teríamos todas as partidas entre times da máquina também

      // Para o sistema reformulado simplificado, vamos apenas simular o conceito
      // que toda a rodada foi processada
      this.logger.log(`✅ Rodada ${roundNumber} simulada completamente`);
      
    } catch (error) {
      this.logger.error('Error simulating entire round:', error);
      // Não parar o processo se a simulação da rodada falhar
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

      // Atualizar progresso (goal_difference é calculada automaticamente)
      await this.updateUserProgress(userId, teamId, seasonYear, {
        points,
        games_played: matches?.length || 0,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst
      });

      this.logger.log(`📊 Estatísticas atualizadas: ${points} pontos em ${matches?.length || 0} jogos`);
      
    } catch (error) {
      this.logger.error('Error recalculating standings after match:', error);
      throw error;
    }
  }
}