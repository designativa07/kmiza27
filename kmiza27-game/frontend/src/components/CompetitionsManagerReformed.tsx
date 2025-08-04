'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed, SeasonProgress, SeasonMatch, MachineTeam } from '@/services/gameApiReformed';

interface StandingTeam {
  position: number;
  team_name: string;
  team_colors: { primary: string; secondary: string };
  team_type: 'user' | 'machine';
  team_id: string;
  points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  stadium_name: string;
}

interface FullStandings {
  tier: number;
  tier_name: string;
  season_year: number;
  standings: StandingTeam[];
  user_position: number;
  total_teams: number;
}

interface CompetitionsManagerReformedProps {
  onSeasonEnd?: (seasonResult: any) => void;
  refreshKey?: number;
}

export default function CompetitionsManagerReformed({ onSeasonEnd, refreshKey }: CompetitionsManagerReformedProps) {
  const { selectedTeam } = useGameStore();
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<SeasonMatch[]>([]);

  const [opponents, setOpponents] = useState<MachineTeam[]>([]);
  const [fullStandings, setFullStandings] = useState<FullStandings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standings' | 'recent' | 'opponents'>('standings');
  const [checkingSeasonEnd, setCheckingSeasonEnd] = useState(false);
  const [simulatingMatch, setSimulatingMatch] = useState<string | null>(null);

  // Verificar se temporada terminou
  const checkSeasonEnd = async (currentProgress: SeasonProgress) => {
    // Só verificar fim de temporada se todas as partidas foram jogadas
    if (currentProgress.games_played >= 38 && currentProgress.season_status === 'active') {
      try {
        setCheckingSeasonEnd(true);
        console.log('🏁 Detectado fim de temporada, verificando...');
        
        const checkResult = await gameApiReformed.checkSeasonEnd(selectedTeam?.owner_id || '');
        
        if (checkResult.success && checkResult.seasonEnded && onSeasonEnd) {
          console.log('🎉 Temporada finalizada automaticamente:', checkResult.result);
          onSeasonEnd(checkResult.result);
        }
      } catch (error) {
        console.error('Erro ao verificar fim de temporada:', error);
      } finally {
        setCheckingSeasonEnd(false);
      }
    }
  };

  // Carregar dados da temporada
  const loadSeasonData = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Carregando dados da temporada...');
      
      // Buscar progresso atual
      const currentProgress = await gameApiReformed.getUserCurrentProgress(selectedTeam.owner_id);
      console.log('📊 Progresso carregado:', currentProgress);
      setProgress(currentProgress);

      if (currentProgress) {
        console.log(`🏆 Temporada: ${currentProgress.season_year}, Pontos: ${currentProgress.points}, Jogos: ${currentProgress.games_played}/38`);
        
        // Verificar se temporada terminou
        await checkSeasonEnd(currentProgress);

        // Buscar partidas e classificação completa
        const [upcoming, machineTeams, standings] = await Promise.all([
          gameApiReformed.getUserUpcomingMatches(selectedTeam.owner_id, 5),
          gameApiReformed.getMachineTeamsByTier(currentProgress.current_tier),
          gameApiReformed.getFullStandings(selectedTeam.owner_id)
        ]);

        console.log('📋 Classificação carregada:', standings);
        console.log('⚽ Próximas partidas:', upcoming.length);

        setUpcomingMatches(upcoming);
        setOpponents(machineTeams);
        setFullStandings(standings);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da temporada:', error);
      setError('Erro ao carregar dados da temporada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonData();
  }, [selectedTeam, refreshKey]);

  // Simular partida
  const simulateMatch = async (matchId: string) => {
    if (!selectedTeam || simulatingMatch) return;
    
    try {
      setSimulatingMatch(matchId);
      console.log(`⚽ Simulando partida ${matchId}...`);
      
      // Buscar informações da partida antes da simulação
      const matchToSimulate = upcomingMatches.find(m => m.id === matchId);
      
      const result = await gameApiReformed.simulateMatch(matchId, selectedTeam?.owner_id || '');
      
      if (result.success) {
        console.log('✅ Partida simulada com sucesso:', result);
        
        // Recarregar dados da temporada
        await loadSeasonData();
        
        // Mensagem simples sem complexidade de placar
        alert('🏟️ Jogo disputado!');
      } else {
        throw new Error(result?.error || 'Erro ao simular partida');
      }
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Erro ao simular partida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setSimulatingMatch(null);
    }
  };

  // Iniciar nova temporada
  const startNewSeason = async () => {
    if (!selectedTeam) return;
    
    try {
      console.log('🔄 Iniciando nova temporada...');
      
      const result = await gameApiReformed.startNewSeason(selectedTeam.owner_id);
      
      if (result.success) {
        console.log('✅ Nova temporada iniciada com sucesso:', result);
        alert('🎉 Nova temporada iniciada! Pontos zerados, mas evolução dos jogadores mantida.');
        
        // Recarregar dados da temporada
        await loadSeasonData();
        
        // Forçar recarregamento dos dados após um pequeno delay
        setTimeout(() => {
          loadSeasonData();
        }, 1000);
      } else {
        throw new Error(result?.error || 'Erro ao iniciar nova temporada');
      }
    } catch (error) {
      console.error('Erro ao iniciar nova temporada:', error);
      alert('Erro ao iniciar nova temporada: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const getTierName = (tier: number): string => {
    const tierNames: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tierNames[tier] || 'Desconhecida';
  };

  const getPositionColor = (position: number): string => {
    if (position >= 1 && position <= 4) return 'text-green-600'; // Promoção
    if (position >= 17 && position <= 20) return 'text-red-600'; // Rebaixamento
    return 'text-gray-600'; // Permanece
  };

  const getPositionDescription = (position: number, tier: number): string => {
    if (tier === 1) {
      if (position <= 4) return 'Libertadores';
      if (position >= 17) return 'Zona de rebaixamento';
      return 'Permanece na Série A';
    }
    if (tier === 4) {
      if (position <= 4) return 'Acesso';
      return 'Permanece na Série D';
    }
    if (position <= 4) return 'Acesso';
    if (position >= 17) return 'Zona de rebaixamento';
    return 'Zona de permanência';
  };

  if (!selectedTeam) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Competições</h2>
        <p>Selecione um time para ver as competições.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Carregando...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Competições</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={loadSeasonData}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Competições</h2>
        <p>Nenhuma temporada ativa encontrada.</p>
        <p className="text-sm text-gray-600 mt-2">
          O time deve ser criado automaticamente na Série D.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão Competição - REMOVIDO */}
      
      {/* Header da Temporada Reformulado */}
      <div className="bg-gradient-to-r from-white to-slate-50 rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-800">Competição</h2>
              <div className="bg-amber-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-800">Série {getTierName(progress.current_tier)}</h2>
              <div className="bg-blue-100 p-2 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Temporada {progress.season_year}</p>
          </div>
        </div>
        
        {checkingSeasonEnd && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center text-sm text-emerald-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
              Processando fim de temporada...
            </div>
          </div>
        )}

        {/* Estatísticas da Temporada Reformuladas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-amber-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-amber-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-amber-700 mb-1">{progress.points}</div>
            <div className="text-xs text-amber-600 font-medium">Pontos</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-700 mb-1">{progress.games_played}/38</div>
            <div className="text-xs text-slate-600 font-medium">Jogos</div>
            {progress.games_played >= 38 && (
              <div className="text-xs text-emerald-600 font-semibold mt-2 bg-emerald-50 rounded px-2 py-1">
                ✅ Completa
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg border border-emerald-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mb-1">{progress.goals_for}</div>
            <div className="text-xs text-emerald-600 font-medium">Gols Pró</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-red-700 mb-1">{progress.goals_against}</div>
            <div className="text-xs text-red-600 font-medium">Gols Contra</div>
          </div>
          <div className={`bg-white rounded-lg border p-4 text-center shadow-sm hover:shadow-md transition-shadow ${
            progress.position <= 4 ? 'border-green-200' : 
            progress.position >= 17 ? 'border-red-200' : 'border-blue-200'
          }`}>
            <div className={`rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 ${
              progress.position <= 4 ? 'bg-green-100' : 
              progress.position >= 17 ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {progress.position <= 4 ? (
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 10a7 7 0 019.307-6.611 1 1 0 00.365-1.964 9 9 0 1014.9 6.807 1 1 0 00-.977-1.744A7 7 0 013 10z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v8l-3.707 3.707a1 1 0 001.414 1.414l4-4A1 1 0 0011 11V3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : progress.position >= 17 ? (
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              progress.position <= 4 ? 'text-green-700' : 
              progress.position >= 17 ? 'text-red-700' : 'text-blue-700'
            }`}>
              {progress.position}º
            </div>
            <div className={`text-xs font-medium ${
              progress.position <= 4 ? 'text-green-600' : 
              progress.position >= 17 ? 'text-red-600' : 'text-blue-600'
            }`}>
              {getPositionDescription(progress.position, progress.current_tier)}
            </div>
          </div>
        </div>

        {/* Botão Iniciar Nova Temporada */}
        {progress.games_played >= 38 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">🎉 Temporada Concluída!</h4>
            <p className="text-sm text-green-700 mb-3">
              Você completou todas as 38 partidas da temporada. Clique no botão abaixo para iniciar uma nova temporada na mesma série.
            </p>
            <button
              onClick={startNewSeason}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-semibold"
            >
              🔄 Iniciar Nova Temporada
            </button>
            <p className="text-xs text-green-600 mt-2">
              ⚠️ Pontos serão zerados, mas a evolução dos jogadores será mantida.
            </p>
          </div>
        )}
      </div>

      {/* Tabs de Navegação Reformuladas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'standings', label: '📊 Classificação', count: 20 },
              { key: 'opponents', label: '🤖 Adversários', count: opponents.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-t-lg'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Classificação */}
          {activeTab === 'standings' && (
            <div>
              
              {/* Tabela de Classificação Reformulada */}
              {fullStandings ? (
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Pos</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Time</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Pts</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">J</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">V</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">E</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">D</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">GP</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">GC</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">SG</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {fullStandings.standings.map((team, index) => {
                          const isUserTeam = team.team_type === 'user';
                          const positionClass = getPositionColor(team.position);
                          
                          return (
                            <tr key={team.team_id} className={`${isUserTeam ? 'bg-emerald-50 border-l-4 border-emerald-500 shadow-sm' : ''} hover:bg-slate-50 transition-colors`}>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm font-bold ${positionClass}`}>
                                <div className="flex items-center">
                                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold mr-2">
                                    {team.position}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-5 h-5 rounded-full mr-3 shadow-sm border border-white" 
                                    style={{ backgroundColor: team.team_colors.primary }}
                                  ></div>
                                  <div>
                                    <div className={`text-sm font-medium ${isUserTeam ? 'text-emerald-900 font-bold' : 'text-slate-900'}`}>
                                      {team.team_name}
                                      {isUserTeam && <span className="ml-2 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-medium">(Você)</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">{team.stadium_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className="text-sm font-bold text-slate-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">{team.points}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 text-center font-medium">{team.games_played}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-600 text-center font-semibold">{team.wins}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-amber-600 text-center font-semibold">{team.draws}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-center font-semibold">{team.losses}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{team.goals_for}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{team.goals_against}</td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-semibold ${
                                team.goal_difference > 0 ? 'text-emerald-600' : 
                                team.goal_difference < 0 ? 'text-red-600' : 'text-slate-500'
                              }`}>
                                {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-emerald-600">{selectedTeam.name}</span>
                      <span className="ml-2 text-gray-600">(Seu time)</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-xl font-bold ${getPositionColor(progress.position)}`}>
                        {progress.position}º
                      </span>
                      <span className="font-bold">{progress.points} pts</span>
                      <span className="text-sm text-gray-600">
                        {progress.wins}V {progress.draws}E {progress.losses}D
                      </span>
                      <span className="text-sm text-gray-600">
                        {progress.goals_for}:{progress.goals_against} 
                        ({progress.goals_for - progress.goals_against > 0 ? '+' : ''}{progress.goals_for - progress.goals_against})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6 mt-6">
                <div className="flex items-center mb-4">
                  <div className="bg-slate-200 p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Regras da Série {getTierName(progress.current_tier)}</h4>
                </div>
                <div className="grid gap-3">
                  {progress.current_tier > 1 && (
                    <div className="flex items-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="bg-emerald-100 p-2 rounded-full mr-3">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-800">Promoção</div>
                        <div className="text-sm text-emerald-700">1º ao 4º lugar sobem para Série {getTierName(progress.current_tier - 1)}</div>
                      </div>
                    </div>
                  )}
                  {progress.current_tier < 4 && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 8.707l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 10.586V7a1 1 0 112 0v3.586l1.293-1.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-red-800">Rebaixamento</div>
                        <div className="text-sm text-red-700">17º ao 20º lugar descem para Série {getTierName(progress.current_tier + 1)}</div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-800">Permanência</div>
                      <div className="text-sm text-amber-700">5º ao 16º lugar permanecem na Série {getTierName(progress.current_tier)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4 text-center">
                💡 No sistema reformulado, você compete apenas com 19 times da máquina fixos.<br/>
                Sua classificação é calculada automaticamente baseada nos resultados das partidas.
              </p>
            </div>
          )}





          {/* Times Adversários */}
          {activeTab === 'opponents' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Times da Máquina - Série {getTierName(progress.current_tier)}
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>💡 Sistema Elifoot:</strong> Estes são os 19 times da máquina fixos que você enfrentará 
                  na Série {getTierName(progress.current_tier)}. Eles não evoluem e sempre terão os mesmos atributos, 
                  assim como no clássico Elifoot!
                </p>
              </div>

              {opponents.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhum adversário encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {opponents.map((team) => (
                    <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{team.name}</div>
                        <div className="text-sm text-gray-600">
                          Overall: {team.attributes.overall}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>🏟️ {team.stadium_name}</div>
                        <div>👥 {team.stadium_capacity.toLocaleString()} lugares</div>
                        <div className="flex space-x-2 mt-2">
                          <span>ATK: {team.attributes.attack}</span>
                          <span>MID: {team.attributes.midfield}</span>
                          <span>DEF: {team.attributes.defense}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}