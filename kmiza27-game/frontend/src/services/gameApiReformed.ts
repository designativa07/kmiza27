const API_BASE_URL = process.env.NEXT_PUBLIC_GAME_API_URL || 'http://localhost:3004';

export interface CreateTeamData {
  name: string;
  short_name?: string;
  stadium_name?: string;
  stadium_capacity: number;
  colors: {
    primary: string;
    secondary: string;
  };
}

export interface GameTeam {
  id: string;
  name: string;
  slug: string;
  short_name?: string;
  owner_id: string;
  team_type: 'user_created' | 'real';
  colors: {
    primary: string;
    secondary: string;
  };
  logo_url?: string;
  stadium_name?: string;
  stadium_capacity: number;
  budget: number;
  reputation: number;
  fan_base: number;
  game_stats: any; // Compatibilidade com tipo do supabase
  created_at: string;
  updated_at: string;
  // Progresso da temporada (se disponível)
  user_progress?: {
    current_tier: number;
    position: number;
    points: number;
    games_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_for: number;
    goals_against: number;
    season_status: string;
    season_year: number;
  };
}

export interface SeasonProgress {
  user_id: string;
  team_id: string;
  current_tier: number;
  season_year: number;
  position: number;
  points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  season_status: string;
  team?: {
    id: string;
    name: string;
    colors: any;
    logo_url?: string;
  };
}

export interface SeasonMatch {
  id: string;
  user_id: string;
  season_year: number;
  tier: number;
  round_number: number;
  home_team_id?: string;
  away_team_id?: string;
  home_machine_team_id?: string;
  away_machine_team_id?: string;
  home_score: number;
  away_score: number;
  match_date: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'simulated';
  highlights?: any[];
  // Dados populados
  home_team?: { name: string; colors: any };
  away_team?: { name: string; colors: any };
  home_machine?: { name: string; colors: any; stadium_name: string };
  away_machine?: { name: string; colors: any; stadium_name: string };
}

export interface MachineTeam {
  id: string;
  name: string;
  tier: number;
  attributes: {
    overall: number;
    attack: number;
    midfield: number;
    defense: number;
    goalkeeper: number;
  };
  stadium_name: string;
  stadium_capacity: number;
  colors: {
    primary: string;
    secondary: string;
  };
}

class GameApiReformedService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // ===== TEAMS API (REFORMULADA) =====

  /**
   * Criar time (automaticamente inscrito na Série D)
   */
  async createTeam(userId: string, teamData: CreateTeamData): Promise<any> {
    return this.request<any>('/api/v2/game-teams/create', {
      method: 'POST',
      body: JSON.stringify({ userId, teamData }),
    });
  }

  /**
   * Buscar times do usuário
   */
  async getUserTeams(userId: string): Promise<GameTeam[]> {
    const response = await this.request<any>(`/api/v2/game-teams/user?userId=${userId}`);
    return response.data || [];
  }

  /**
   * Buscar time específico com progresso da temporada
   */
  async getTeamWithProgress(teamId: string): Promise<GameTeam | null> {
    const response = await this.request<any>(`/api/v2/game-teams/${teamId}`);
    return response.data;
  }

  // ===== SEASONS API =====

  /**
   * Buscar progresso atual da temporada
   */
  async getUserCurrentProgress(userId: string, seasonYear?: number): Promise<SeasonProgress | null> {
    const year = seasonYear || new Date().getFullYear();
    const response = await this.request<any>(`/api/v2/seasons/progress?userId=${userId}&seasonYear=${year}`);
    return response.data;
  }

  /**
   * Buscar próximas partidas
   */
  async getUserUpcomingMatches(userId: string, limit: number = 5): Promise<SeasonMatch[]> {
    const response = await this.request<any>(`/api/v2/seasons/matches/upcoming?userId=${userId}&limit=${limit}`);
    return response.data || [];
  }

  /**
   * Buscar partidas recentes
   */
  async getUserRecentMatches(userId: string, limit: number = 5): Promise<SeasonMatch[]> {
    const response = await this.request<any>(`/api/v2/seasons/matches/recent?userId=${userId}&limit=${limit}`);
    return response.data || [];
  }

  /**
   * Buscar resumo da temporada
   */
  async getSeasonSummary(userId: string, seasonYear?: number): Promise<any> {
    const year = seasonYear || new Date().getFullYear();
    const response = await this.request<any>(`/api/v2/seasons/summary?userId=${userId}&seasonYear=${year}`);
    return response.data;
  }

  /**
   * Recalcular classificação
   */
  async recalculateUserStandings(userId: string, seasonYear?: number): Promise<any> {
    const year = seasonYear || new Date().getFullYear();
    return this.request<any>('/api/v2/seasons/recalculate-standings', {
      method: 'POST',
      body: JSON.stringify({ userId, seasonYear: year }),
    });
  }

  // ===== MACHINE TEAMS API =====

  /**
   * Buscar times da máquina por série
   */
  async getMachineTeamsByTier(tier: number): Promise<MachineTeam[]> {
    const response = await this.request<any>(`/api/v2/machine-teams/by-tier?tier=${tier}`);
    return response.data || [];
  }

  /**
   * Buscar todos os times da máquina organizados por série
   */
  async getAllMachineTeamsBySeries(): Promise<any> {
    const response = await this.request<any>('/api/v2/machine-teams/all-series');
    return response.data;
  }

  /**
   * Validar integridade dos times da máquina
   */
  async validateMachineTeamsIntegrity(): Promise<any> {
    const response = await this.request<any>('/api/v2/machine-teams/admin/validate');
    return response.data;
  }

  // ===== PROMOTION/RELEGATION API =====

  /**
   * Processar fim de temporada
   */
  async processSeasonEnd(userId: string, seasonYear?: number): Promise<any> {
    const year = seasonYear || new Date().getFullYear();
    return this.request<any>('/api/v2/promotion-relegation/process-season-end', {
      method: 'POST',
      body: JSON.stringify({ userId, seasonYear: year }),
    });
  }

  /**
   * Verificar se pode finalizar temporada
   */
  async canFinishSeason(userId: string, seasonYear?: number): Promise<boolean> {
    const year = seasonYear || new Date().getFullYear();
    const response = await this.request<any>(`/api/v2/promotion-relegation/can-finish?userId=${userId}&seasonYear=${year}`);
    return response.data?.can_finish || false;
  }

  /**
   * Buscar histórico de temporadas
   */
  async getUserSeasonHistory(userId: string): Promise<any[]> {
    const response = await this.request<any>(`/api/v2/promotion-relegation/history?userId=${userId}`);
    return response.data || [];
  }

  /**
   * Buscar estatísticas de carreira
   */
  async getUserCareerStats(userId: string): Promise<any> {
    const response = await this.request<any>(`/api/v2/promotion-relegation/career-stats?userId=${userId}`);
    return response.data;
  }

  /**
   * Simular resultado baseado na posição
   */
  async simulateSeasonResult(currentTier: number, position: number): Promise<any> {
    return this.request<any>('/api/v2/promotion-relegation/simulate-result', {
      method: 'POST',
      body: JSON.stringify({ currentTier, position }),
    });
  }

  /**
   * Buscar regras de promoção/rebaixamento
   */
  async getPromotionRelegationRules(): Promise<any> {
    const response = await this.request<any>('/api/v2/promotion-relegation/rules');
    return response.data;
  }

  // ===== UTILITY METHODS =====

  /**
   * Converter tier para nome da série
   */
  getTierName(tier: number): string {
    const tierNames: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tierNames[tier] || 'Desconhecida';
  }

  /**
   * Deletar time
   */
  async deleteTeam(teamId: string, userId: string): Promise<any> {
    return this.request<any>(`/api/v2/game-teams/${teamId}?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Simular partida
   */
  async simulateMatch(matchId: string, userId: string): Promise<any> {
    return this.request<any>('/api/v2/seasons/simulate-match', {
      method: 'POST',
      body: JSON.stringify({
        matchId,
        userId
      }),
    });
  }

  /**
   * Buscar classificação completa da série
   */
  async getFullStandings(userId: string): Promise<any> {
    const response = await this.request<any>(`/api/v2/seasons/full-standings?userId=${userId}`);
    return response.data;
  }

  /**
   * Status da API reformulada
   */
  async getApiStatus(): Promise<any> {
    const response = await this.request<any>('/api/v2/game-teams/status');
    return response.data;
  }
}

export const gameApiReformed = new GameApiReformedService();