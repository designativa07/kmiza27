"use client";

import { create } from 'zustand';
import { GameTeam, YouthAcademy, YouthPlayer } from '@/lib/supabase';
import { gameApiReformed, CreateTeamData } from '@/services/gameApiReformed';

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
  
  // Ações do jogo (reformuladas)
  createTeam: (teamData: CreateTeamData) => Promise<void>;
  loadTeams: () => Promise<void>;
  
  // Novas funcionalidades (stubs)
  fetchPlayers?: (teamId: string) => Promise<any[]>;
  setTraining?: (payload: { playerId: string; focus: string; intensity?: 'low'|'normal'|'high'; inAcademy?: boolean }) => Promise<any>;
  applyTrainingWeek?: (teamId: string) => Promise<any>;
  fetchFans?: (teamId: string) => Promise<any>;
  getTactics?: (teamId: string) => Promise<any>;
  saveTactics?: (payload: any) => Promise<any>;
  getSponsorships?: (teamId: string) => Promise<any>;
  negotiateSponsorship?: (payload: any) => Promise<any>;
  getInvestments?: (teamId: string) => Promise<any>;
  invest?: (payload: any) => Promise<any>;
  
  // Métodos não implementados no sistema reformulado (futuras funcionalidades)
  updateTeamBudget: (teamId: string, amount: number, operation: 'add' | 'subtract') => Promise<void>;
  expandStadium: (teamId: string, capacityIncrease: number, cost: number) => Promise<void>;
  getTeamMatches: (teamId: string) => Promise<any[]>;
  simulateMatch: (matchId: string) => Promise<any>;
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gameUser');
    }
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
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('gameUser') : null;
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      const result = await gameApiReformed.createTeam(userId, teamData);
      
      // Verificar se o time criado é válido
      if (!result.success || !result.data?.team?.id) {
        throw new Error(result.error || 'Time criado não possui ID válido');
      }
      
      // No sistema reformulado, o time já é inscrito automaticamente na Série D
      const createdTeam = result.data.team;
      const actualUserId: string | undefined = result.data.actualUserId || result.data.actual_user_id;
      
      // Sincronizar o userId real retornado pelo backend (evita criar usuário novo a cada requisição)
      if (actualUserId) {
        // Persistir no localStorage
        if (typeof window !== 'undefined') {
          const stored = { id: actualUserId };
          localStorage.setItem('gameUser', JSON.stringify(stored));
        }
        // Atualizar estado de autenticação
        set({ userId: actualUserId, isAuthenticated: true });
      }
      
      // Atualizar times localmente e garantir recarregamento da lista a partir da API
      const currentTeams = get().userTeams;
      set({ 
        userTeams: [...currentTeams, createdTeam],
        selectedTeam: createdTeam,
        isLoading: false 
      });
      
      // Recarregar a lista completa do backend para refletir imediatamente
      try {
        await get().loadTeams();
      } catch (_) {
        // Se falhar o refresh, manter o estado local
      }
      
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
      // TODO: Implementar no sistema reformulado
      throw new Error('Funcionalidade de orçamento será implementada em próxima versão');
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Funcionalidade não implementada' 
      });
    }
  },

  expandStadium: async (teamId, capacityIncrease, cost) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar no sistema reformulado
      throw new Error('Funcionalidade de expansão de estádio será implementada em próxima versão');
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Funcionalidade não implementada' 
      });
    }
  },

  getTeamMatches: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      // No sistema reformulado, usar o userId ao invés do teamId
      const userId = get().userId;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      const [upcoming, recent] = await Promise.all([
        gameApiReformed.getUserUpcomingMatches(userId, 10),
        gameApiReformed.getUserRecentMatches(userId, 10)
      ]);
      
      const allMatches = [...upcoming, ...recent];
      set({ isLoading: false });
      return allMatches;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar partidas' 
      });
      throw error;
    }
  },

  simulateMatch: async (matchId) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar simulação no sistema reformulado
      throw new Error('Simulação de partidas será implementada em próxima versão');
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Funcionalidade não implementada' 
      });
      throw error;
    }
  },
  
  loadTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      // Obter o userId do usuário logado
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('gameUser') : null;
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      console.log('Loading teams for userId:', userId);
      
      const teams = await gameApiReformed.getUserTeams(userId);
      
      // Os times reformulados já vêm como array da API
      const validTeams = teams.filter(team => team && team.id);
      
      console.log('Loaded teams (reformed):', validTeams);
      
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
      
      // Obter o userId do usuário logado
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('gameUser') : null;
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id || get().userId;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const result = await gameApiReformed.deleteTeam(teamId, userId);
      
      // Verificar se a deleção foi bem-sucedida
      if (result && result.success) {
        // Remover o time da lista local
        set(state => ({
          userTeams: state.userTeams.filter(team => team.id !== teamId),
          selectedTeam: state.selectedTeam?.id === teamId ? null : state.selectedTeam,
          isLoading: false
        }));
        
        return result;
      } else {
        throw new Error(result?.error || 'Erro ao deletar time');
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
  
  // ===== Stubs que chamam a API reformulada =====
  fetchPlayers: async (teamId: string) => {
    const players = await gameApiReformed.getPlayers(teamId);
    return players;
  },
  setTraining: async (payload) => gameApiReformed.setTraining(payload),
  applyTrainingWeek: async (teamId) => gameApiReformed.applyTrainingWeek(teamId),
  fetchFans: async (teamId) => gameApiReformed.getFans(teamId),
  getTactics: async (teamId) => gameApiReformed.getTactics(teamId),
  saveTactics: async (payload) => gameApiReformed.saveTactics(payload),
  getSponsorships: async (teamId) => gameApiReformed.getSponsorships(teamId),
  negotiateSponsorship: async (payload) => gameApiReformed.negotiateSponsorship(payload),
  getInvestments: async (teamId) => gameApiReformed.getInvestments(teamId),
  invest: async (payload) => gameApiReformed.invest(payload),
})); 