import { create } from 'zustand';
import { GameTeam, YouthAcademy, YouthPlayer } from '@/lib/supabase';
import { gameApi, CreateTeamData } from '@/services/gameApi';

interface GameState {
  // Estado do usuário
  userId: string | null;
  isAuthenticated: boolean;
  userTeams: GameTeam[];
  selectedTeam: GameTeam | null;
  
  // Academia de base
  youthAcademy: YouthAcademy | null;
  youthPlayers: YouthPlayer[];
  
  // Estado de loading
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setUserId: (userId: string) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
  setUserTeams: (teams: GameTeam[]) => void;
  setSelectedTeam: (team: GameTeam | null) => void;
  setYouthAcademy: (academy: YouthAcademy | null) => void;
  setYouthPlayers: (players: YouthPlayer[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Ações do jogo
  createTeam: (teamData: CreateTeamData) => Promise<void>;
  updateTeamBudget: (teamId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>;
  loadTeams: () => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Estado inicial
  userId: null,
  isAuthenticated: false,
  userTeams: [],
  selectedTeam: null,
  youthAcademy: null,
  youthPlayers: [],
  isLoading: false,
  error: null,
  
  // Setters
  setUserId: (userId) => set({ userId, isAuthenticated: true }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  logout: () => {
    localStorage.removeItem('gameUser');
    set({ 
      userId: null, 
      isAuthenticated: false, 
      userTeams: [], 
      selectedTeam: null 
    });
  },
  setUserTeams: (teams) => set({ userTeams: teams }),
  setSelectedTeam: (team) => set({ selectedTeam: team }),
  setYouthAcademy: (academy) => set({ youthAcademy: academy }),
  setYouthPlayers: (players) => set({ youthPlayers: players }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Ações do jogo
  createTeam: async (teamData) => {
    set({ isLoading: true, error: null });
    try {
      // Obter o userId do usuário logado
      const savedUser = localStorage.getItem('gameUser');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      console.log('Creating team:', teamData, 'for userId:', userId);
      
      const result = await gameApi.createTeam(teamData, userId);
      
      // Verificar se o time criado é válido
      if (!result.team || !result.team.id) {
        throw new Error('Time criado não possui ID válido');
      }
      
      // Adicionar o novo time à lista
      const currentTeams = get().userTeams;
      set({ 
        userTeams: [...currentTeams, result.team],
        selectedTeam: result.team,
        isLoading: false 
      });
      
      console.log('Team created successfully:', result.team);
    } catch (error) {
      console.error('Error creating team:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro ao criar time' 
      });
    }
  },
  
  updateTeamBudget: async (teamId, amount, operation) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Updating budget:', { teamId, amount, operation });
      
      const result = await gameApi.updateTeamBudget(teamId, amount, operation);
      
      // Atualizar o time selecionado se for o mesmo
      const selectedTeam = get().selectedTeam;
      if (selectedTeam && selectedTeam.id === teamId) {
        set({ selectedTeam: { ...selectedTeam, budget: result.budget } });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar orçamento' 
      });
    }
  },
  
  loadTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      // Obter o userId do usuário logado
      const savedUser = localStorage.getItem('gameUser');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      console.log('Loading teams for userId:', userId);
      
      const teams = await gameApi.getTeams(userId);
      console.log('API response teams:', teams);
      
      // Garantir que sempre seja um array e filtrar apenas times válidos
      const teamsArray = Array.isArray(teams) ? teams : [];
      const validTeams = teamsArray.filter(team => team && team.id);
      console.log('Valid teams:', validTeams);
      
      set({ userTeams: validTeams, isLoading: false });
    } catch (error) {
      console.error('Error loading teams:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar times',
        userTeams: [] // Garantir array vazio em caso de erro
      });
    }
  },

  deleteTeam: async (teamId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Obter o userId do usuário logado (usando a chave correta)
      const savedUser = localStorage.getItem('gameUser');
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const result = await gameApi.deleteTeam(teamId, userId);
      
      // Verificar se a deleção foi bem-sucedida
      if (result && (result.success || result.data?.success)) {
        // Remover o time da lista local
        set(state => ({
          userTeams: state.userTeams.filter(team => team.id !== teamId),
          selectedTeam: state.selectedTeam?.id === teamId ? null : state.selectedTeam,
          isLoading: false
        }));
        
        return result;
      } else {
        throw new Error(result?.message || 'Erro ao deletar time');
      }
    } catch (error) {
      console.error('Error in deleteTeam:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao deletar time',
        isLoading: false 
      });
      throw error;
    }
  },
})); 