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

export default function CompetitionsManagerReformed() {
  const { selectedTeam } = useGameStore();
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<SeasonMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<SeasonMatch[]>([]);
  const [opponents, setOpponents] = useState<MachineTeam[]>([]);
  const [fullStandings, setFullStandings] = useState<FullStandings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'standings' | 'upcoming' | 'recent' | 'opponents'>('standings');

  // Carregar dados da temporada
  const loadSeasonData = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar progresso atual
      const currentProgress = await gameApiReformed.getUserCurrentProgress(selectedTeam.owner_id);
      setProgress(currentProgress);

      if (currentProgress) {
        // Buscar partidas e classificação completa
        const [upcoming, recent, machineTeams, standings] = await Promise.all([
          gameApiReformed.getUserUpcomingMatches(selectedTeam.owner_id, 5),
          gameApiReformed.getUserRecentMatches(selectedTeam.owner_id, 5),
          gameApiReformed.getMachineTeamsByTier(currentProgress.current_tier),
          gameApiReformed.getFullStandings(selectedTeam.owner_id)
        ]);

        setUpcomingMatches(upcoming);
        setRecentMatches(recent);
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
  }, [selectedTeam]);

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
      if (position >= 17) return 'Zona de rebaixamento';
      return 'Permanece na Série A';
    }
    if (tier === 4) {
      if (position <= 4) return 'Zona de promoção';
      return 'Permanece na Série D';
    }
    if (position <= 4) return 'Zona de promoção';
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
      {/* Header da Temporada */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            🏆 Série {getTierName(progress.current_tier)} - Temporada {progress.season_year}
          </h2>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getPositionColor(progress.position)}`}>
              {progress.position}º lugar
            </div>
            <div className="text-sm text-gray-600">
              {getPositionDescription(progress.position, progress.current_tier)}
            </div>
          </div>
        </div>

        {/* Estatísticas da Temporada */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{progress.points}</div>
            <div className="text-sm text-gray-600">Pontos</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{progress.games_played}</div>
            <div className="text-sm text-gray-600">Jogos</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{progress.goals_for}</div>
            <div className="text-sm text-gray-600">Gols Pró</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{progress.goals_against}</div>
            <div className="text-sm text-gray-600">Gols Contra</div>
          </div>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'standings', label: '📊 Classificação', count: 20 },
              { key: 'upcoming', label: '📅 Próximas', count: upcomingMatches.length },
              { key: 'recent', label: '📈 Recentes', count: recentMatches.length },
              { key: 'opponents', label: '🤖 Adversários', count: opponents.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <h3 className="text-lg font-semibold mb-4">
                Classificação da Série {getTierName(progress.current_tier)}
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Regras da Série {getTierName(progress.current_tier)}</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  {progress.current_tier > 1 && (
                    <div>🟢 <strong>Promoção:</strong> 1º ao 4º lugar sobem para Série {getTierName(progress.current_tier - 1)}</div>
                  )}
                  {progress.current_tier < 4 && (
                    <div>🔴 <strong>Rebaixamento:</strong> 17º ao 20º lugar descem para Série {getTierName(progress.current_tier + 1)}</div>
                  )}
                  <div>📍 <strong>Permanência:</strong> 5º ao 16º lugar permanecem na Série {getTierName(progress.current_tier)}</div>
                </div>
              </div>

              {/* Tabela Completa da Classificação */}
              {fullStandings ? (
                <div className="bg-white rounded-lg overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">J</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GP</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GC</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fullStandings.standings.map((team, index) => {
                          const isUserTeam = team.team_type === 'user';
                          const positionClass = getPositionColor(team.position);
                          
                          return (
                            <tr key={team.team_id} className={`${isUserTeam ? 'bg-blue-50 border-l-4 border-blue-500' : ''} hover:bg-gray-50`}>
                              <td className={`px-3 py-3 whitespace-nowrap text-sm font-bold ${positionClass}`}>
                                {team.position}º
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-2" 
                                    style={{ backgroundColor: team.team_colors.primary }}
                                  ></div>
                                  <div>
                                    <div className={`text-sm font-medium ${isUserTeam ? 'text-blue-900 font-bold' : 'text-gray-900'}`}>
                                      {team.team_name}
                                      {isUserTeam && <span className="ml-1 text-xs text-blue-600">(Seu time)</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">{team.stadium_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-center">{team.points}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{team.games_played}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-green-600 text-center">{team.wins}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-yellow-600 text-center">{team.draws}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-red-600 text-center">{team.losses}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_for}</td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{team.goals_against}</td>
                              <td className={`px-3 py-3 whitespace-nowrap text-sm text-center font-medium ${
                                team.goal_difference > 0 ? 'text-green-600' : 
                                team.goal_difference < 0 ? 'text-red-600' : 'text-gray-500'
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
                      <span className="text-lg font-bold text-blue-600">{selectedTeam.name}</span>
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

              <p className="text-sm text-gray-600 mt-4 text-center">
                💡 No sistema reformulado, você compete apenas com 19 times da máquina fixos.<br/>
                Sua classificação é calculada automaticamente baseada nos resultados das partidas.
              </p>
            </div>
          )}

          {/* Próximas Partidas */}
          {activeTab === 'upcoming' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Próximas Partidas</h3>
              {upcomingMatches.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhuma partida agendada.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => {
                    const isHome = match.home_team_id !== null;
                    const opponent = isHome ? match.away_machine?.name : match.home_machine?.name;
                    const venue = isHome ? selectedTeam.stadium_name : match.home_machine?.stadium_name || match.away_machine?.stadium_name;
                    
                    return (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              Rodada {match.round_number}: {isHome ? 'Casa' : 'Fora'} vs {opponent}
                            </div>
                            <div className="text-sm text-gray-600">
                              📅 {new Date(match.match_date).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-sm text-gray-600">
                              🏟️ {venue}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded-full text-sm ${
                              match.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {match.status === 'scheduled' ? 'Agendada' : match.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Partidas Recentes */}
          {activeTab === 'recent' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Partidas Recentes</h3>
              {recentMatches.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nenhuma partida disputada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentMatches.map((match) => {
                    const isHome = match.home_team_id !== null;
                    const opponent = isHome ? match.away_machine?.name : match.home_machine?.name;
                    const userScore = isHome ? match.home_score : match.away_score;
                    const opponentScore = isHome ? match.away_score : match.home_score;
                    
                    let result = '';
                    let resultColor = '';
                    if (userScore > opponentScore) {
                      result = 'Vitória';
                      resultColor = 'text-green-600';
                    } else if (userScore < opponentScore) {
                      result = 'Derrota';
                      resultColor = 'text-red-600';
                    } else {
                      result = 'Empate';
                      resultColor = 'text-yellow-600';
                    }
                    
                    return (
                      <div key={match.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              Rodada {match.round_number}: {isHome ? 'Casa' : 'Fora'} vs {opponent}
                            </div>
                            <div className="text-sm text-gray-600">
                              📅 {new Date(match.match_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {userScore} x {opponentScore}
                            </div>
                            <div className={`text-sm font-semibold ${resultColor}`}>
                              {result}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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