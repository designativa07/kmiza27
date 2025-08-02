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
      
      // 3. Atualizar progresso com informações iniciais
      await this.updateUserProgress(userId, teamId, seasonYear, {
        position: Math.floor(Math.random() * 20) + 1, // Posição inicial aleatória
        status: 'active'
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
      const { data, error } = await supabase
        .from('game_user_competition_progress')
        .select(`
          *,
          team:game_teams(id, name, colors, logo_url)
        `)
        .eq('user_id', userId)
        .eq('season_year', seasonYear)
        .eq('season_status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Error fetching user progress: ${error.message}`);
      }

      return data;
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
      const updatedProgress = await this.updateUserProgress(userId, '', seasonYear, {
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
}