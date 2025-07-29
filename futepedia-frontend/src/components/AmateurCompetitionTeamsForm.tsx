'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trophy } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  logo_url?: string;
  city?: string;
  state?: string;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
  type?: string;
  season?: string;
}

interface CompetitionTeam {
  id?: number;
  competition_id: number;
  team_id: number;
  group_name?: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goals_for?: number;
  goals_against?: number;
  goal_difference?: number;
  team?: Team;
}

interface AmateurCompetitionTeamsFormProps {
  competition: Competition;
  onSave: (competitionTeams: CompetitionTeam[]) => Promise<void>;
  onCancel: () => void;
}

export default function AmateurCompetitionTeamsForm({ competition, onSave, onCancel }: AmateurCompetitionTeamsFormProps) {
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [competitionTeams, setCompetitionTeams] = useState<CompetitionTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);

  // Buscar times disponíveis e times da competição
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingTeams(true);
        
        // Obter token de autenticação
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }
        
        // Buscar todos os times amadores
        const teamsResponse = await fetch('/api/amateur/teams', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setAvailableTeams(teamsData);
        }

        // Buscar times já associados à competição
        const competitionTeamsResponse = await fetch(`/api/amateur/competitions/${competition.id}/teams`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (competitionTeamsResponse.ok) {
          const competitionTeamsData = await competitionTeamsResponse.json();
          console.log('Dados recebidos da API:', competitionTeamsData);
          
          const mappedTeams = competitionTeamsData.map((ct: any) => ({
            id: ct.id,
            competition_id: competition.id,
            team_id: ct.team?.id || ct.team_id,
            group_name: ct.group_name || '',
            points: ct.points || 0,
            played: ct.played || 0,
            won: ct.won || 0,
            drawn: ct.drawn || 0,
            lost: ct.lost || 0,
            goals_for: ct.goals_for || 0,
            goals_against: ct.goals_against || 0,
            goal_difference: ct.goal_difference || 0,
            team: ct.team
          }));
          
          console.log('Times mapeados:', mappedTeams);
          setCompetitionTeams(mappedTeams);
        } else {
          console.log('Erro ao buscar times da competição:', competitionTeamsResponse.status);
        }
      } catch (error) {
        // Silenciar erro para não poluir o console
      } finally {
        setFetchingTeams(false);
      }
    };

    fetchData();
  }, [competition.id]);

  const handleAddTeam = () => {
    const newCompetitionTeam: CompetitionTeam = {
      competition_id: competition.id,
      team_id: 0,
      group_name: '',
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0
    };
    setCompetitionTeams([...competitionTeams, newCompetitionTeam]);
  };

  const handleRemoveTeam = (index: number) => {
    setCompetitionTeams(competitionTeams.filter((_, i) => i !== index));
  };

  const handleBulkAddTeams = () => {
    const newTeams = selectedTeamIds.map(teamId => ({
      competition_id: competition.id,
      team_id: teamId,
      group_name: '',
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0
    }));
    
    setCompetitionTeams([...competitionTeams, ...newTeams]);
    setSelectedTeamIds([]);
    setShowBulkAdd(false);
  };

  const handleTeamSelection = (teamId: number) => {
    setSelectedTeamIds(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleTeamChange = (index: number, field: keyof CompetitionTeam, value: any) => {
    const newCompetitionTeams = [...competitionTeams];
    newCompetitionTeams[index] = {
      ...newCompetitionTeams[index],
      [field]: value
    };
    setCompetitionTeams(newCompetitionTeams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filtrar apenas times válidos (com team_id selecionado)
      const validCompetitionTeams = competitionTeams.filter(ct => ct.team_id > 0);
      
      await onSave(validCompetitionTeams);
    } catch (error) {
      // Silenciar erro para não poluir o console
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: number) => {
    const team = availableTeams.find(t => t.id === teamId);
    return team ? team.name : 'Selecione um time';
  };

  const getAvailableTeamsForSelection = () => {
    // Retornar todos os times disponíveis para permitir seleção e troca
    return availableTeams;
  };

  if (fetchingTeams) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Carregando times...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciar Times - {competition.name}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Times da Competição */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Times da Competição
              </h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleAddTeam}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Time</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    for (let i = 0; i < 5; i++) {
                      handleAddTeam();
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar 5 Times</span>
                </button>
              </div>
            </div>

            {/* Seleção em Massa */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowBulkAdd(!showBulkAdd)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showBulkAdd ? 'Ocultar' : 'Mostrar'} seleção em massa de times
              </button>
              
              {showBulkAdd && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Selecionar Times em Massa</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {availableTeams.map(team => (
                      <label key={team.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedTeamIds.includes(team.id)}
                          onChange={() => handleTeamSelection(team.id)}
                          className="rounded"
                        />
                        <span className="truncate">{team.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedTeamIds.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      <button
                        type="button"
                        onClick={handleBulkAddTeams}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Adicionar {selectedTeamIds.length} time(s) selecionado(s)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTeamIds([])}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Limpar seleção
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {competitionTeams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum time associado à competição. Use os botões acima ou a seleção em massa para adicionar times.
              </p>
            ) : (
              <>
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <span className="font-medium text-green-800">
                    {competitionTeams.filter(ct => ct.team_id > 0).length} de {competitionTeams.length} times configurados
                  </span>
                  {competitionTeams.filter(ct => ct.team_id === 0).length > 0 && (
                    <span className="text-yellow-600 ml-2">
                      ({competitionTeams.filter(ct => ct.team_id === 0).length} pendente(s))
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                {competitionTeams.map((competitionTeam, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Time {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        aria-label="Remover time"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Time *
                        </label>
                        <select
                          value={competitionTeam.team_id}
                          onChange={(e) => handleTeamChange(index, 'team_id', parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          required
                          aria-label="Selecionar time"
                        >
                          <option value={0}>Selecione um time</option>
                          {getAvailableTeamsForSelection().map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name} {team.city && `(${team.city})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Grupo
                        </label>
                        <input
                          type="text"
                          value={competitionTeam.group_name}
                          onChange={(e) => handleTeamChange(index, 'group_name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Ex: Grupo A"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pontos Iniciais
                        </label>
                        <input
                          type="number"
                          value={competitionTeam.points}
                          onChange={(e) => handleTeamChange(index, 'points', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Estatísticas Iniciais (colapsável) */}
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                        Estatísticas avançadas (opcional)
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-gray-600">Jogos</label>
                            <input
                              type="number"
                              value={competitionTeam.played}
                              onChange={(e) => handleTeamChange(index, 'played', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600">Vitórias</label>
                            <input
                              type="number"
                              value={competitionTeam.won}
                              onChange={(e) => handleTeamChange(index, 'won', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600">Empates</label>
                            <input
                              type="number"
                              value={competitionTeam.drawn}
                              onChange={(e) => handleTeamChange(index, 'drawn', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600">Derrotas</label>
                            <input
                              type="number"
                              value={competitionTeam.lost}
                              onChange={(e) => handleTeamChange(index, 'lost', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 rounded"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                                  ))}
                </div>
              </>
            )}
          </div>

          {/* Estatísticas */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total de Times:</span>
                <span className="ml-2 text-blue-600">{competitionTeams.filter(ct => ct.team_id > 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Times Válidos:</span>
                <span className="ml-2 text-green-600">{competitionTeams.filter(ct => ct.team_id > 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Times Pendentes:</span>
                <span className="ml-2 text-yellow-600">{competitionTeams.filter(ct => ct.team_id === 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Disponíveis:</span>
                <span className="ml-2 text-gray-600">{getAvailableTeamsForSelection().length}</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Times'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 