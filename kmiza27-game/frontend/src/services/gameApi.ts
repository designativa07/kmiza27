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
  team_type: 'user' | 'machine' | 'user_created' | 'real';
  real_team_id?: number;
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
  game_stats: any;
  created_at: string;
  updated_at: string;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  tier: number; // 1=Série A, 2=Série B, 3=Série C, 4=Série D
  type: 'pvp' | 'pve'; // pvp = player vs player, pve = player vs environment
  max_teams: number;
  current_teams: number;
  season_year: number;
  status: 'active' | 'inactive' | 'finished';
  promotion_spots: number;
  relegation_spots: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitionTeam {
  id: string;
  competition_id: string;
  team_id: string;
  registered_at: string;
  team?: GameTeam;
}

export interface CompetitionMatch {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score?: number;
  away_score?: number;
  match_date: string;
  status: 'scheduled' | 'in_progress' | 'finished';
  highlights?: string[];
  stats?: any;
  created_at: string;
  updated_at: string;
}

export interface CompetitionRound {
  id: string;
  competition_id: string;
  round_number: number;
  name: string;
  created_at: string;
}

export interface CompetitionStanding {
  id: string;
  competition_id: string;
  team_id: string;
  season_year: number;
  position: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  team?: GameTeam;
}

export interface DirectMatch {
  id: string;
  match_type: 'single' | 'home_away';
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  away_home_score?: number;
  away_away_score?: number;
  aggregate_home_score?: number;
  aggregate_away_score?: number;
  winner_team_id?: string;
  match_date: string;
  return_match_date?: string;
  status: 'scheduled' | 'in_progress' | 'finished' | 'cancelled';
  highlights?: string[];
  simulation_data?: any;
  created_by: string;
  accepted_by?: string;
  home_team?: GameTeam;
  away_team?: GameTeam;
  created_at: string;
  updated_at: string;
}

export interface MatchInvite {
  id: string;
  match_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expires_at: string;
  match?: DirectMatch;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  team_id: string;
  total_matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  goals_scored_in_row: number;
  unbeaten_streak: number;
  win_streak: number;
  last_match_date?: string;
}

export interface HeadToHeadStats {
  team1_id: string;
  team2_id: string;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  total_matches: number;
  last_match_date?: string;
}

class GameApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      // Adicionar timeout de 5 segundos para resposta mais rápida
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: A requisição demorou muito para responder');
      }
      throw error;
    }
  }

  // Times
  async createTeam(teamData: CreateTeamData, userId?: string): Promise<{ team: GameTeam; actualUserId: string }> {
    const requestData = {
      ...teamData,
      userId: userId
    };
    
    const response = await this.request<{ success: boolean; data: GameTeam; actualUserId: string; message: string }>('/api/v1/game-teams', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return { team: response.data, actualUserId: response.actualUserId };
  }

  async getTeams(userId?: string): Promise<GameTeam[]> {
    const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await this.request<{ success: boolean; data: GameTeam[]; message: string }>(`/api/v1/game-teams${queryParams}`);
    return response.data || [];
  }

  async getTeamById(id: string): Promise<GameTeam> {
    return this.request<GameTeam>(`/api/v1/game-teams/${id}`);
  }

  async getTeamPlayers(teamId: string): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[]; message: string }>(`/api/v1/game-teams/${teamId}/players`);
    return response.data || [];
  }

  async updateTeam(id: string, teamData: Partial<GameTeam>): Promise<GameTeam> {
    return this.request<GameTeam>(`/api/v1/game-teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  }

  async deleteTeam(teamId: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/game-teams/${teamId}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao deletar time');
      }

      return result;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  async getTeamStats(id: string): Promise<any> {
    return this.request<any>(`/api/v1/game-teams/${id}/stats`);
  }

  async updateTeamBudget(id: string, amount: number, operation: 'add' | 'subtract'): Promise<any> {
    const response = await this.request<any>(`/api/v1/game-teams/${id}/budget`, {
      method: 'POST',
      body: JSON.stringify({ amount, operation }),
    });
    return response.data || response;
  }

  async expandStadium(id: string, capacityIncrease: number, cost: number): Promise<any> {
    const response = await this.request<any>(`/api/v1/game-teams/${id}/stadium-expansion`, {
      method: 'POST',
      body: JSON.stringify({ capacityIncrease, cost }),
    });
    return response.data || response;
  }

  async getTeamMatches(teamId: string): Promise<any[]> {
    try {
      const response = await this.request<{ success: boolean; data: any[]; message: string }>(`/api/v1/game-teams/${teamId}/matches`);
      return response.data || [];
    } catch (error) {
      console.warn('Backend não disponível, retornando partidas de exemplo:', error.message);
      
      // Retornar partidas de exemplo quando o backend não estiver disponível
      return [
        {
          id: 'sample-match-1',
          home_team_name: 'Palhoça',
          away_team_name: 'Adversário SC',
          home_score: 2,
          away_score: 1,
          match_date: new Date().toISOString(),
          status: 'finished',
          highlights: ['Gol de cabeça aos 15 minutos', 'Falta perigosa aos 30 minutos', 'Gol de pênalti aos 45 minutos']
        },
        {
          id: 'sample-match-2',
          home_team_name: 'Rival FC',
          away_team_name: 'Palhoça',
          home_score: 0,
          away_score: 3,
          match_date: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          status: 'finished',
          highlights: ['Gol de falta aos 10 minutos', 'Defesa espetacular aos 25 minutos', 'Hat-trick aos 60 minutos']
        }
      ];
    }
  }

  async createMatch(matchData: any): Promise<any> {
    const response = await this.request<any>('/api/v1/game-teams/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
    return response.data || response;
  }

  async simulateMatch(matchId: string): Promise<any> {
    const response = await this.request<any>(`/api/v1/game-teams/matches/${matchId}/simulate`, {
      method: 'POST',
    });
    return response.data || response;
  }

  // ===== COMPETIÇÕES =====

  async getCompetitions(seasonYear?: number): Promise<Competition[]> {
    const queryParams = seasonYear ? `?seasonYear=${seasonYear}` : '';
    const response = await this.request<{ success: boolean; data: Competition[]; message: string }>(`/api/v1/competitions${queryParams}`);
    return response.data || [];
  }

  async getCompetitionsForNewUsers(): Promise<Competition[]> {
    const response = await this.request<{ success: boolean; data: Competition[]; message: string }>('/api/v1/competitions/for-new-users');
    return response.data || [];
  }

  async getCompetitionById(id: string): Promise<Competition> {
    const response = await this.request<{ success: boolean; data: Competition; message: string }>(`/api/v1/competitions/${id}`);
    return response.data;
  }

  async getCompetitionTeams(competitionId: string): Promise<CompetitionTeam[]> {
    const response = await this.request<{ success: boolean; data: CompetitionTeam[]; message: string }>(`/api/v1/competitions/${competitionId}/teams`);
    return response.data || [];
  }

  async getCompetitionStandings(competitionId: string): Promise<CompetitionStanding[]> {
    const response = await this.request<{ success: boolean; data: CompetitionStanding[]; message: string }>(`/api/v1/competitions/${competitionId}/standings`);
    return response.data || [];
  }

  async registerTeamInCompetition(teamId: string, competitionId: string): Promise<any> {
    return this.request<any>(`/api/v1/competitions/${competitionId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async unregisterTeamFromCompetition(teamId: string, competitionId: string): Promise<any> {
    return this.request<any>(`/api/v1/competitions/${competitionId}/unregister`, {
      method: 'DELETE',
      body: JSON.stringify({ teamId }),
    });
  }

  async getCompetitionRounds(competitionId: string): Promise<CompetitionRound[]> {
    const response = await this.request<{ success: boolean; data: CompetitionRound[]; message: string }>(`/api/v1/competitions/${competitionId}/rounds`);
    return response.data || [];
  }

  async createCompetitionRound(competitionId: string, roundData: {
    round_number: number;
    name: string;
  }): Promise<CompetitionRound> {
    return this.request<CompetitionRound>(`/api/v1/competitions/${competitionId}/rounds`, {
      method: 'POST',
      body: JSON.stringify(roundData),
    });
  }

  async getCompetitionMatches(competitionId: string): Promise<CompetitionMatch[]> {
    const response = await this.request<{ success: boolean; data: CompetitionMatch[]; message: string }>(`/api/v1/competitions/${competitionId}/matches`);
    return response.data || [];
  }

  async createCompetitionMatch(competitionId: string, matchData: {
    home_team_id: string;
    away_team_id: string;
    home_team_name: string;
    away_team_name: string;
    match_date: string;
  }): Promise<CompetitionMatch> {
    return this.request<CompetitionMatch>(`/api/v1/competitions/${competitionId}/matches`, {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async simulateCompetitionMatch(matchId: string): Promise<CompetitionMatch> {
    return this.request<CompetitionMatch>(`/api/v1/competitions/matches/${matchId}/simulate`, {
      method: 'POST',
    });
  }

  // ===== PARTIDAS DIRETAS =====

  async createDirectMatch(matchData: {
    match_type: 'single' | 'home_away';
    home_team_id: string;
    away_team_id: string;
    match_date: string;
    return_match_date?: string;
    created_by: string;
    message?: string;
  }): Promise<DirectMatch> {
    return this.request<DirectMatch>('/api/v1/competitions/direct-matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async getDirectMatches(teamId?: string, userId?: string): Promise<DirectMatch[]> {
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (userId) params.append('userId', userId);
    
    const queryString = params.toString();
    const url = `/api/v1/competitions/direct-matches${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.request<{ success: boolean; data: DirectMatch[]; message: string }>(url);
    return response.data || [];
  }

  async simulateDirectMatch(matchId: string): Promise<DirectMatch> {
    return this.request<DirectMatch>(`/api/v1/competitions/direct-matches/${matchId}/simulate`, {
      method: 'POST',
    });
  }

  // ===== CONVITES =====

  async sendMatchInvite(inviteData: {
    match_id: string;
    from_user_id: string;
    to_user_id: string;
    message?: string;
  }): Promise<MatchInvite> {
    return this.request<MatchInvite>('/api/v1/competitions/invites', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  }

  async getMatchInvites(userId: string): Promise<MatchInvite[]> {
    const response = await this.request<{ success: boolean; data: MatchInvite[]; message: string }>(`/api/v1/competitions/invites/${userId}`);
    return response.data || [];
  }

  async respondToInvite(inviteId: string, response: 'accepted' | 'declined'): Promise<MatchInvite> {
    return this.request<MatchInvite>(`/api/v1/competitions/invites/${inviteId}/${response}`, {
      method: 'PUT',
    });
  }

  // ===== ESTATÍSTICAS =====

  async getTeamStats(teamId: string): Promise<TeamStats> {
    return this.request<TeamStats>(`/api/v1/competitions/teams/${teamId}/stats`);
  }

  async getHeadToHeadStats(team1Id: string, team2Id: string): Promise<HeadToHeadStats> {
    return this.request<HeadToHeadStats>(`/api/v1/competitions/teams/${team1Id}/vs/${team2Id}/stats`);
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/api/v1/health');
  }
}

export const gameApi = new GameApiService(); 