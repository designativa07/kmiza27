'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, User } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position?: string;
  image_url?: string;
  date_of_birth?: string;
  nationality?: string;
}

interface Team {
  id: number;
  name: string;
  logo_url?: string | null;
}

interface TeamPlayer {
  id?: number;
  player_id: number;
  team_id: number;
  jersey_number?: string;
  role?: string;
  start_date: string;
  end_date?: string;
  player?: Player;
}

interface AmateurTeamPlayersFormProps {
  team: Team;
  onSave: (teamPlayers: TeamPlayer[]) => Promise<void>;
  onCancel: () => void;
}

export default function AmateurTeamPlayersForm({ team, onSave, onCancel }: AmateurTeamPlayersFormProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlayers, setFetchingPlayers] = useState(true);

  // Buscar jogadores disponíveis e jogadores do time
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingPlayers(true);
        
        // Buscar todos os jogadores amadores
        const playersResponse = await fetch('/api/amateur/players');
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          setAvailablePlayers(playersData);
        }

        // Buscar jogadores já associados ao time
        const teamPlayersResponse = await fetch(`/api/amateur/teams/${team.id}/players`);
        if (teamPlayersResponse.ok) {
          const teamPlayersData = await teamPlayersResponse.json();
          setTeamPlayers(teamPlayersData.map((tp: any) => ({
            id: tp.id,
            player_id: tp.player_id,
            team_id: team.id,
            jersey_number: tp.jersey_number || '',
            role: tp.role || '',
            start_date: tp.start_date || new Date().toISOString().split('T')[0],
            end_date: tp.end_date || '',
            player: tp.player
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setFetchingPlayers(false);
      }
    };

    fetchData();
  }, [team.id]);

  const handleAddPlayer = () => {
    const newTeamPlayer: TeamPlayer = {
      player_id: 0,
      team_id: team.id,
      jersey_number: '',
      role: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    };
    setTeamPlayers([...teamPlayers, newTeamPlayer]);
  };

  const handleRemovePlayer = (index: number) => {
    setTeamPlayers(teamPlayers.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index: number, field: keyof TeamPlayer, value: any) => {
    const newTeamPlayers = [...teamPlayers];
    newTeamPlayers[index] = {
      ...newTeamPlayers[index],
      [field]: value
    };
    setTeamPlayers(newTeamPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filtrar apenas jogadores válidos (com player_id selecionado)
      const validTeamPlayers = teamPlayers.filter(tp => tp.player_id > 0);
      
      await onSave(validTeamPlayers);
    } catch (error) {
      console.error('Erro ao salvar jogadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: number) => {
    const player = availablePlayers.find(p => p.id === playerId);
    return player ? player.name : 'Selecione um jogador';
  };



  if (fetchingPlayers) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Carregando jogadores...</span>
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
            Gerenciar Jogadores - {team.name}
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
          {/* Jogadores Atuais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Jogadores do Time
              </h3>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Jogador</span>
              </button>
            </div>

            {teamPlayers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum jogador associado ao time. Clique em "Adicionar Jogador" para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {teamPlayers.map((teamPlayer, index) => (
                  <div key={index} className="bg-white p-4 rounded border space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">
                        Jogador {index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(index)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Remover jogador"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jogador *
                        </label>
                        <select
                          value={teamPlayer.player_id}
                          onChange={(e) => handlePlayerChange(index, 'player_id', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          aria-label={`Selecionar jogador ${index + 1}`}
                        >
                          <option value={0}>Selecione um jogador</option>
                          {availablePlayers.map(player => (
                            <option key={player.id} value={player.id}>
                              {player.name} {player.position && `(${player.position})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número da Camisa
                        </label>
                        <input
                          type="text"
                          value={teamPlayer.jersey_number}
                          onChange={(e) => handlePlayerChange(index, 'jersey_number', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Ex: 10"
                          title="Número da camisa do jogador"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Função
                        </label>
                        <input
                          type="text"
                          value={teamPlayer.role}
                          onChange={(e) => handlePlayerChange(index, 'role', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Ex: Capitão, Reserva"
                          title="Função do jogador no time"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          value={teamPlayer.start_date}
                          onChange={(e) => handlePlayerChange(index, 'start_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                          title="Data de início do jogador no time"
                        />
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
                <span className="font-medium">Total de Jogadores:</span>
                <span className="ml-2 text-blue-600">{teamPlayers.filter(tp => tp.player_id > 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Jogadores Válidos:</span>
                <span className="ml-2 text-green-600">{teamPlayers.filter(tp => tp.player_id > 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Jogadores Pendentes:</span>
                <span className="ml-2 text-yellow-600">{teamPlayers.filter(tp => tp.player_id === 0).length}</span>
              </div>
              <div>
                <span className="font-medium">Total de Jogadores:</span>
                <span className="ml-2 text-gray-600">{availablePlayers.length}</span>
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
              {loading ? 'Salvando...' : 'Salvar Jogadores'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 