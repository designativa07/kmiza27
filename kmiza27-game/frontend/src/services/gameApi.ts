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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/api/v1/health');
  }
}

export const gameApi = new GameApiService(); 