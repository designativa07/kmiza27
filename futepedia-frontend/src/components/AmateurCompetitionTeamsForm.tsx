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

  // Buscar times disponíveis e times da competição
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingTeams(true);
        
        // Buscar todos os times amadores
        const teamsResponse = await fetch('/api/amateur/teams');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setAvailableTeams(teamsData);
        }

        // Buscar times já associados à competição
        const competitionTeamsResponse = await fetch(`/api/amateur/competitions/${competition.id}/teams`);
        if (competitionTeamsResponse.ok) {
          const competitionTeamsData = await competitionTeamsResponse.json();
          setCompetitionTeams(competitionTeamsData.map((ct: any) => ({
            id: ct.id,
            competition_id: competition.id,
            team_id: ct.team_id,
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
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
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
      console.error('Erro ao salvar times:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: number) => {
    const team = availableTeams.find(t => t.id === teamId);
    return team ? team.name : 'Selecione um time';
  };

  const getAvailableTeamsForSelection = () => {
    const selectedTeamIds = competitionTeams.map(ct => ct.team_id).filter(id => id > 0);
    return availableTeams.filter(team => !selectedTeamIds.includes(team.id));
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
              <button
                type="button"
                onClick={handleAddTeam}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Time</span>
              </button>
            </div>

            {competitionTeams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum time associado à competição. Clique em "Adicionar Time" para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {competitionTeams.map((competitionTeam, index) => (
                  <div key={index} className="bg-white p-4 rounded border space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">
                        Time {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(index)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Remover time"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time *
                        </label>
                        <select
                          value={competitionTeam.team_id}
                          onChange={(e) => handleTeamChange(index, 'team_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          aria-label="Selecionar time"
                        >
                          <option value={0}>Selecione um time</option>
                          {getAvailableTeamsForSelection().map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name} {team.city && `(${team.city})`}
                            </option>
                          ))}
                          {/* Mostrar time já selecionado mesmo se não estiver na lista disponível */}
                          {competitionTeam.team && (
                            <option value={competitionTeam.team_id}>
                              {competitionTeam.team.name} {competitionTeam.team.city && `(${competitionTeam.team.city})`}
                            </option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Grupo
                        </label>
                        <input
                          type="text"
                          value={competitionTeam.group_name}
                          onChange={(e) => handleTeamChange(index, 'group_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Ex: Grupo A, Grupo B"
                        />
                      </div>
                    </div>

                    {/* Estatísticas Iniciais (opcional) */}
                    <div className="bg-gray-50 p-3 rounded">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Estatísticas Iniciais (Opcional)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="block text-xs text-gray-600">Pontos</label>
                          <input
                            type="number"
                            value={competitionTeam.points}
                            onChange={(e) => handleTeamChange(index, 'points', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Jogos</label>
                          <input
                            type="number"
                            value={competitionTeam.played}
                            onChange={(e) => handleTeamChange(index, 'played', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Vitórias</label>
                          <input
                            type="number"
                            value={competitionTeam.won}
                            onChange={(e) => handleTeamChange(index, 'won', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Empates</label>
                          <input
                            type="number"
                            value={competitionTeam.drawn}
                            onChange={(e) => handleTeamChange(index, 'drawn', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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