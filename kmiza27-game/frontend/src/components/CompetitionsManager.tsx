'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApi, Competition, CompetitionStanding, CompetitionMatch, CompetitionRound, DirectMatch, MatchInvite } from '@/services/gameApi';
import MatchStats from './MatchStats';

interface CompetitionWithTeams extends Competition {
  teams_count?: number;
  is_registered?: boolean;
}

export default function CompetitionsManager() {
  const { selectedTeam } = useGameStore();
  const [competitions, setCompetitions] = useState<CompetitionWithTeams[]>([]);
  const [standings, setStandings] = useState<CompetitionStanding[]>([]);
  const [matches, setMatches] = useState<CompetitionMatch[]>([]);
  const [rounds, setRounds] = useState<CompetitionRound[]>([]);
  const [directMatches, setDirectMatches] = useState<DirectMatch[]>([]);
  const [invites, setInvites] = useState<MatchInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'competitions' | 'standings' | 'matches' | 'direct-matches' | 'invites'>('competitions');
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [createMatchData, setCreateMatchData] = useState({
    match_type: 'single' as 'single' | 'home_away',
    away_team_id: '',
    match_date: '',
    return_match_date: '',
    message: ''
  });

  // Carregar competições
  const loadCompetitions = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar o novo endpoint que retorna apenas competições disponíveis para novos usuários
      const competitionsData = await gameApi.getCompetitionsForNewUsers();
      setCompetitions(competitionsData);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
      setError('Erro ao carregar competições.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar classificação
  const loadStandings = async (competitionId: string) => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const standingsData = await gameApi.getCompetitionStandings(competitionId);
      setStandings(standingsData);
    } catch (error) {
      console.error('Erro ao carregar classificação:', error);
      setError('Erro ao carregar classificação.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar partidas da competição
  const loadCompetitionMatches = async (competitionId: string) => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const matchesData = await gameApi.getCompetitionMatches(competitionId);
      setMatches(matchesData);
    } catch (error) {
      console.error('Erro ao carregar partidas:', error);
      setError('Erro ao carregar partidas.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar rodadas da competição
  const loadCompetitionRounds = async (competitionId: string) => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const roundsData = await gameApi.getCompetitionRounds(competitionId);
      setRounds(roundsData);
    } catch (error) {
      console.error('Erro ao carregar rodadas:', error);
      setError('Erro ao carregar rodadas.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar partidas diretas
  const loadDirectMatches = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const matchesData = await gameApi.getDirectMatches(selectedTeam.id);
      setDirectMatches(matchesData);
    } catch (error) {
      console.error('Erro ao carregar partidas diretas:', error);
      setError('Erro ao carregar partidas diretas.');
    } finally {
      setLoading(false);
    }
  };

  // Carregar convites
  const loadInvites = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const invitesData = await gameApi.getMatchInvites(selectedTeam.owner_id);
      setInvites(invitesData);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      setError('Erro ao carregar convites.');
    } finally {
      setLoading(false);
    }
  };

  // Inscrever em competição
  const registerInCompetition = async (competitionId: string) => {
    if (!selectedTeam) return;
    
    try {
      await gameApi.registerTeamInCompetition(selectedTeam.id, competitionId);
      await loadCompetitions();
      alert('Time inscrito com sucesso na competição!');
    } catch (error) {
      console.error('Erro ao inscrever em competição:', error);
      alert('Erro ao inscrever em competição: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Simular partida da competição
  const simulateCompetitionMatch = async (matchId: string) => {
    try {
      await gameApi.simulateCompetitionMatch(matchId);
      if (selectedCompetition) {
        await loadCompetitionMatches(selectedCompetition.id);
        await loadStandings(selectedCompetition.id);
      }
      alert('Partida simulada com sucesso!');
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Erro ao simular partida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Criar partida direta
  const createDirectMatch = async () => {
    if (!selectedTeam || !createMatchData.away_team_id || !createMatchData.match_date) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      const matchData = {
        match_type: createMatchData.match_type,
        home_team_id: selectedTeam.id,
        away_team_id: createMatchData.away_team_id,
        match_date: createMatchData.match_date,
        return_match_date: createMatchData.match_type === 'home_away' ? createMatchData.return_match_date : undefined,
        created_by: selectedTeam.owner_id,
        message: createMatchData.message || undefined
      };

      await gameApi.createDirectMatch(matchData);
      setShowCreateMatch(false);
      setCreateMatchData({
        match_type: 'single',
        away_team_id: '',
        match_date: '',
        return_match_date: '',
        message: ''
      });
      await loadDirectMatches();
      alert('Partida criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar partida:', error);
      alert('Erro ao criar partida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Simular partida direta
  const simulateDirectMatch = async (matchId: string) => {
    try {
      await gameApi.simulateDirectMatch(matchId);
      await loadDirectMatches();
      alert('Partida simulada com sucesso!');
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Erro ao simular partida: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Responder a convite
  const respondToInvite = async (inviteId: string, response: 'accepted' | 'declined') => {
    try {
      await gameApi.respondToInvite(inviteId, response);
      await loadInvites();
      alert(`Convite ${response === 'accepted' ? 'aceito' : 'recusado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao responder convite:', error);
      alert('Erro ao responder convite: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  // Selecionar competição
  const selectCompetition = async (competition: Competition) => {
    setSelectedCompetition(competition);
    setActiveTab('standings'); // Mudar para a aba de classificação
    await loadStandings(competition.id);
    await loadCompetitionMatches(competition.id);
    await loadCompetitionRounds(competition.id);
  };

  // Carregar dados quando o time muda
  useEffect(() => {
    if (selectedTeam) {
      loadCompetitions();
      loadDirectMatches();
      loadInvites();
    }
  }, [selectedTeam?.id]);

  if (!selectedTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">🏆 Competições</h2>
        <p className="text-gray-700">Selecione um time para gerenciar competições.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">🏆 Competições - {selectedTeam.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setActiveTab('competitions');
              setSelectedCompetition(null);
            }}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'competitions' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Competições
          </button>
          {selectedCompetition && (
            <>
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
                  activeTab === 'standings' 
                    ? 'tab-active' 
                    : 'tab-inactive'
                }`}
              >
                Classificação
              </button>
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
            </>
          )}
          <button
            onClick={() => setActiveTab('direct-matches')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'direct-matches' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Partidas Diretas
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'invites' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Convites ({invites.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'competitions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 Competições Disponíveis</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {competitions.map((competition) => (
                  <div key={competition.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{competition.name}</h4>
                        <p className="text-sm text-gray-700 mt-1">{competition.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <span className={`px-2 py-1 rounded ${
                            competition.type === 'pvp' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {competition.type === 'pvp' ? 'PvP' : 'PvE'}
                          </span>
                          <span>Nível: {competition.tier}</span>
                          <span>Times: {competition.current_teams || 0}/{competition.max_teams}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => selectCompetition(competition)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => registerInCompetition(competition.id)}
                          disabled={competition.is_registered}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            competition.is_registered
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {competition.is_registered ? 'Inscrito' : 'Inscrever'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'standings' && selectedCompetition && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  📊 Classificação - {selectedCompetition.name}
                </h3>
                <button
                  onClick={() => {
                    setActiveTab('competitions');
                    setSelectedCompetition(null);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  ← Voltar
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Pos</th>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-center">J</th>
                      <th className="px-3 py-2 text-center">V</th>
                      <th className="px-3 py-2 text-center">E</th>
                      <th className="px-3 py-2 text-center">D</th>
                      <th className="px-3 py-2 text-center">GP</th>
                      <th className="px-3 py-2 text-center">GC</th>
                      <th className="px-3 py-2 text-center">SG</th>
                      <th className="px-3 py-2 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing) => (
                      <tr key={standing.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{standing.position}</td>
                        <td className="px-3 py-2 font-medium">{standing.team?.name || 'Time'}</td>
                        <td className="px-3 py-2 text-center">{standing.games_played}</td>
                        <td className="px-3 py-2 text-center">{standing.wins}</td>
                        <td className="px-3 py-2 text-center">{standing.draws}</td>
                        <td className="px-3 py-2 text-center">{standing.losses}</td>
                        <td className="px-3 py-2 text-center">{standing.goals_for}</td>
                        <td className="px-3 py-2 text-center">{standing.goals_against}</td>
                        <td className="px-3 py-2 text-center">{standing.goals_for - standing.goals_against}</td>
                        <td className="px-3 py-2 text-center font-bold">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'matches' && selectedCompetition && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚽ Partidas - {selectedCompetition.name}
                </h3>
                <button
                  onClick={() => {
                    setActiveTab('competitions');
                    setSelectedCompetition(null);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  ← Voltar
                </button>
              </div>
              
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma partida encontrada.</p>
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
                              <div className="text-xs text-gray-500">
                                {new Date(match.match_date).toLocaleDateString()}
                              </div>
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
                              onClick={() => simulateCompetitionMatch(match.id)}
                              className="mt-2 btn-secondary"
                            >
                              Simular
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
                      
                      {match.status === 'finished' && match.simulation_data?.stats && (
                        <MatchStats 
                          stats={match.simulation_data.stats}
                          homeTeamName={match.home_team?.name || 'Time Casa'}
                          awayTeamName={match.away_team?.name || 'Time Visitante'}
                        />
                      )}
                      
                      {match.status === 'finished' && match.stats && (
                        <MatchStats 
                          stats={match.stats}
                          homeTeamName={match.home_team_name}
                          awayTeamName={match.away_team_name}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'direct-matches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">⚽ Partidas Diretas</h3>
                <button
                  onClick={() => setShowCreateMatch(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Criar Partida
                </button>
              </div>
              
              <div className="space-y-3">
                {directMatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhuma partida direta encontrada.</p>
                    <p className="text-sm mt-2">Clique em "Criar Partida" para iniciar um confronto.</p>
                  </div>
                ) : (
                  directMatches.map((match) => (
                    <div key={match.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="font-semibold">{match.home_team?.name || 'Time Casa'}</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {match.status === 'finished' ? match.home_score : '-'}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-gray-600">VS</div>
                              <div className="text-xs text-gray-500">
                                {match.match_type === 'home_away' ? 'Ida e Volta' : 'Jogo Único'}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-semibold">{match.away_team?.name || 'Time Visitante'}</div>
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
                              onClick={() => simulateDirectMatch(match.id)}
                              className="mt-2 btn-secondary"
                            >
                              Simular
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

          {activeTab === 'invites' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📨 Convites Recebidos</h3>
              
              <div className="space-y-3">
                {invites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum convite pendente.</p>
                  </div>
                ) : (
                  invites.map((invite) => (
                    <div key={invite.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            Convite para Partida
                          </h4>
                          {invite.message && (
                            <p className="text-sm text-gray-700 mt-1">{invite.message}</p>
                          )}
                          {invite.match && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p>{invite.match.home_team?.name} vs {invite.match.away_team?.name}</p>
                              <p>Tipo: {invite.match.match_type === 'home_away' ? 'Ida e Volta' : 'Jogo Único'}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => respondToInvite(invite.id, 'accepted')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => respondToInvite(invite.id, 'declined')}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para criar partida */}
      {showCreateMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Partida Direta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Partida</label>
                <select
                  value={createMatchData.match_type}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, match_type: e.target.value as 'single' | 'home_away' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title="Tipo de partida"
                  aria-label="Tipo de partida"
                >
                  <option value="single">Jogo Único</option>
                  <option value="home_away">Ida e Volta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Time Visitante (ID)</label>
                <input
                  type="text"
                  value={createMatchData.away_team_id}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, away_team_id: e.target.value }))}
                  placeholder="ID do time visitante"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title="ID do time visitante"
                  aria-label="ID do time visitante"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data da Partida</label>
                <input
                  type="datetime-local"
                  value={createMatchData.match_date}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, match_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  title="Data da partida"
                  aria-label="Data da partida"
                />
              </div>
              
              {createMatchData.match_type === 'home_away' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Data da Partida de Volta</label>
                  <input
                    type="datetime-local"
                    value={createMatchData.return_match_date}
                    onChange={(e) => setCreateMatchData(prev => ({ ...prev, return_match_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    title="Data da partida de volta"
                    aria-label="Data da partida de volta"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Mensagem (opcional)</label>
                <textarea
                  value={createMatchData.message}
                  onChange={(e) => setCreateMatchData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Mensagem para o adversário"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={createDirectMatch}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Criar Partida
              </button>
              <button
                onClick={() => setShowCreateMatch(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 