'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed, SeasonMatch } from '@/services/gameApiReformed';
import CompetitionsManagerReformed from './CompetitionsManagerReformed';
import MatchVisualSimulator from './MatchVisualSimulator';

// Tipo antigo mantido para compatibilidade com código existente
interface Match {
  id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  match_date: string;
  status: 'scheduled' | 'in_progress' | 'finished';
  highlights?: string[];
  stats?: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shots_on_target: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    yellow_cards: { home: number; away: number };
    red_cards: { home: number; away: number };
  };
}

interface Tactics {
  formation: string;
  style: 'attacking' | 'balanced' | 'defensive';
  pressing: 'high' | 'medium' | 'low';
  passing: 'short' | 'mixed' | 'long';
  tempo: 'slow' | 'balanced' | 'fast';
}

export default function MatchSimulator() {
  const { selectedTeam } = useGameStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [tactics, setTactics] = useState<Tactics>({
    formation: '4-4-2',
    style: 'balanced',
    pressing: 'medium',
    passing: 'mixed',
    tempo: 'balanced'
  });
  const [activeTab, setActiveTab] = useState<'matches' | 'simulation' | 'tactics' | 'competitions'>('matches');
  const [showVisualSimulator, setShowVisualSimulator] = useState(false);
  const [selectedMatchForVisual, setSelectedMatchForVisual] = useState<Match | null>(null);

  // Função simples para carregar partidas
  // Função para converter SeasonMatch para Match (compatibilidade)
  const convertSeasonMatchesToMatches = (seasonMatches: SeasonMatch[]): Match[] => {
    return seasonMatches.map(match => {
      const isHome = match.home_team_id !== null;
      const opponentName = isHome ? 
        (match.away_machine?.name || 'Adversário') : 
        (match.home_machine?.name || 'Adversário');
      
      return {
        id: match.id,
        home_team_name: isHome ? selectedTeam?.name || 'Seu Time' : opponentName,
        away_team_name: isHome ? opponentName : selectedTeam?.name || 'Seu Time',
        home_score: match.home_score,
        away_score: match.away_score,
        match_date: match.match_date,
        status: match.status as 'scheduled' | 'in_progress' | 'finished',
        highlights: match.highlights as string[] | undefined
      };
    });
  };

  const loadMatches = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Carregando partidas reformuladas para:', selectedTeam.name);
      const [upcoming, recent] = await Promise.all([
        gameApiReformed.getUserUpcomingMatches(selectedTeam.owner_id, 10),
        gameApiReformed.getUserRecentMatches(selectedTeam.owner_id, 10)
      ]);
      const seasonMatches = [...upcoming, ...recent];
      const convertedMatches = convertSeasonMatchesToMatches(seasonMatches);
      console.log('Partidas carregadas (reformulado):', convertedMatches.length);
      setMatches(convertedMatches);
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
      setError('Erro ao carregar partidas. Verifique se o backend está rodando.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar partidas apenas quando o time muda
  useEffect(() => {
    if (selectedTeam) {
      loadMatches();
    }
  }, [selectedTeam?.id]);

  // Função para criar partidas de exemplo
  const createSampleMatches = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Criando partidas de exemplo...');
      
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const rivalTeamId = generateUUID();
      const adversarioTeamId = generateUUID();

      const sampleMatches = [
        {
          home_team_id: selectedTeam.id,
          away_team_id: rivalTeamId,
          home_team_name: selectedTeam.name,
          away_team_name: 'Rival FC',
          match_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          home_score: 0,
          away_score: 0
        },
        {
          home_team_id: adversarioTeamId,
          away_team_id: selectedTeam.id,
          home_team_name: 'Adversário SC',
          away_team_name: selectedTeam.name,
          match_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          home_score: 0,
          away_score: 0
        }
      ];

      for (const matchData of sampleMatches) {
        try {
          // TODO: Implementar no sistema reformulado
          // await gameApiReformed.createMatch(matchData);
          console.log('Sistema reformulado: Criação de partidas não implementada');
        } catch (error) {
          console.error('Erro ao criar partida:', error);
        }
      }
      
      // Recarregar partidas após criar
      await loadMatches();
    } catch (error) {
      console.error('Erro ao criar partidas de exemplo:', error);
      setError('Erro ao criar partidas de exemplo.');
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = async (matchId: string) => {
    try {
      setSimulating(true);
      
      // Obter userId do usuário logado
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('gameUser') : null;
      const userData = savedUser ? JSON.parse(savedUser) : null;
      const userId = userData?.id;
      
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`⚽ Simulando partida ${matchId} para usuário ${userId}`);
      
      const result = await gameApiReformed.simulateMatch(matchId, userId);
      
      if (result && result.success) {
        alert(`🎉 Partida simulada! ${result.message}`);
        
        // Recarregar as partidas para mostrar o resultado atualizado
        await loadMatches();
      } else {
        throw new Error(result?.error || 'Erro ao simular partida');
      }
      
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Erro ao simular partida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setSimulating(false);
    }
  };

  const updateTactics = async (newTactics: Partial<Tactics>) => {
    setTactics(prev => ({ ...prev, ...newTactics }));
  };

  const openVisualSimulator = (match: Match) => {
    setSelectedMatchForVisual(match);
    setShowVisualSimulator(true);
  };

  const closeVisualSimulator = () => {
    setShowVisualSimulator(false);
    setSelectedMatchForVisual(null);
  };

  const handleVisualMatchEnd = (result: { homeScore: number; awayScore: number }) => {
    console.log('🎉 Partida visual finalizada:', result);
    // Aqui você pode integrar com o sistema de simulação real se desejar
    closeVisualSimulator();
  };

  if (!selectedTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">⚽ Simulação de Partidas</h2>
        <p className="text-gray-700">Selecione um time para gerenciar as partidas.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">⚽ Partidas - {selectedTeam.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'matches' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Partidas
          </button>
          <button
            onClick={loadMatches}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            title="Recarregar partidas"
          >
            🔄
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'simulation' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Simulação
          </button>
          <button
            onClick={() => setActiveTab('tactics')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'tactics' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Táticas
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'competitions' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Competições
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">Verifique se o backend está rodando em http://localhost:3004</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">📅 Próximas Partidas</h3>
                {matches.length === 0 && (
                  <button
                    onClick={createSampleMatches}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                  >
                    Criar Partidas de Exemplo
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma partida encontrada.</p>
                    <p className="text-sm mt-2">Clique no botão acima para criar partidas de exemplo.</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="font-semibold">{match.home_team_name}</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {match.status === 'finished' ? match.home_score : '-'}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-gray-600">VS</div>
                              <div className="text-xs text-gray-500">{match.match_date}</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-semibold">{match.away_team_name}</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {match.status === 'finished' ? match.away_score : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs ${
                            match.status === 'finished' ? 'bg-green-100 text-green-800' :
                            match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {match.status === 'finished' ? 'Finalizada' :
                             match.status === 'in_progress' ? 'Em Andamento' : 'Agendada'}
                          </div>
                          
                          {match.status === 'scheduled' && (
                            <button
                              onClick={() => startSimulation(match.id)}
                              disabled={simulating}
                              className={`mt-2 btn-secondary ${simulating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {simulating ? 'Simulando...' : 'Simular'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {match.status === 'finished' && match.highlights && match.highlights.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-semibold mb-2">🎯 Destaques</h4>
                          <div className="space-y-1">
                            {match.highlights.map((highlight, index) => (
                              <div key={index} className="text-xs text-gray-700">
                                {highlight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">🎮 Simulação de Partida</h3>
              
              {/* Seleção de Partida para Simulação Visual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">🎯 Simulação Visual</h4>
                <p className="text-blue-700 mb-4">
                  Experimente a nova simulação visual estilo "futebol de botão"!
                </p>
                
                {matches.length === 0 ? (
                  <p className="text-blue-600 text-sm">Nenhuma partida disponível para simulação.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-blue-600 text-sm">Selecione uma partida para simular visualmente:</p>
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">{match.home_team_name}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium">{match.away_team_name}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {match.match_date} - {match.status === 'scheduled' ? 'Agendada' : 'Finalizada'}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => openVisualSimulator(match)}
                          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                        >
                          🎮 Simular Visualmente
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Simulação Tradicional */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">⚽ Simulação Tradicional</h4>
                <p className="text-gray-700 mb-4">
                  Sistema de simulação com estatísticas detalhadas
                </p>
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="text-4xl mb-4">⚽</div>
                  <p className="text-sm text-gray-600">
                    Simulação textual com highlights e estatísticas
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tactics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Táticas</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="formation" className="block text-sm font-medium mb-2 text-gray-900">Formação</label>
                    <select
                      id="formation"
                      value={tactics.formation}
                      onChange={(e) => updateTactics({ formation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="4-4-2">4-4-2</option>
                      <option value="4-3-3">4-3-3</option>
                      <option value="3-5-2">3-5-2</option>
                      <option value="4-2-3-1">4-2-3-1</option>
                      <option value="5-3-2">5-3-2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="style" className="block text-sm font-medium mb-2 text-gray-900">Estilo de Jogo</label>
                    <select
                      id="style"
                      value={tactics.style}
                      onChange={(e) => updateTactics({ style: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="attacking">Ofensivo</option>
                      <option value="balanced">Equilibrado</option>
                      <option value="defensive">Defensivo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="pressing" className="block text-sm font-medium mb-2 text-gray-900">Pressing</label>
                    <select
                      id="pressing"
                      value={tactics.pressing}
                      onChange={(e) => updateTactics({ pressing: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="high">Alto</option>
                      <option value="medium">Médio</option>
                      <option value="low">Baixo</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="passing" className="block text-sm font-medium mb-2 text-gray-900">Tipo de Passe</label>
                    <select
                      id="passing"
                      value={tactics.passing}
                      onChange={(e) => updateTactics({ passing: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="short">Curto</option>
                      <option value="mixed">Misto</option>
                      <option value="long">Longo</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="tempo" className="block text-sm font-medium mb-2 text-gray-900">Tempo de Jogo</label>
                    <select
                      id="tempo"
                      value={tactics.tempo}
                      onChange={(e) => updateTactics({ tempo: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="slow">Lento</option>
                      <option value="balanced">Equilibrado</option>
                      <option value="fast">Rápido</option>
                    </select>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">📊 Estatísticas da Tática</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Ataque:</span>
                        <span className="font-semibold">75%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Defesa:</span>
                        <span className="font-semibold">65%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Controle:</span>
                        <span className="font-semibold">70%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

                               {activeTab === 'competitions' && (
            <CompetitionsManagerReformed />
          )}
        </div>
      )}

      {/* Simulador Visual */}
      {showVisualSimulator && selectedMatchForVisual && (
        <MatchVisualSimulator
          matchId={selectedMatchForVisual.id}
          homeTeam={{
            name: selectedMatchForVisual.home_team_name,
            colors: { primary: '#3B82F6', secondary: '#1E40AF' }
          }}
          awayTeam={{
            name: selectedMatchForVisual.away_team_name,
            colors: { primary: '#EF4444', secondary: '#DC2626' }
          }}
          onMatchEnd={handleVisualMatchEnd}
          onClose={closeVisualSimulator}
        />
      )}
    </div>
  );
} 