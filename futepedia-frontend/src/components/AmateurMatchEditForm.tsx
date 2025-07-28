'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position?: string;
  image_url?: string;
}

interface Team {
  id: number;
  name: string;
  logo_url?: string;
}

interface MatchPlayerStat {
  player_id: number;
  goals?: number;
  yellow_cards?: number;
  red_cards?: number;
}

interface Match {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score?: number | null;
  away_score?: number | null;
  home_team_player_stats?: MatchPlayerStat[];
  away_team_player_stats?: MatchPlayerStat[];
  match_date: string;
  status: string;
}

interface AmateurMatchEditFormProps {
  match: Match;
  onSave: (matchData: any) => Promise<void>;
  onCancel: () => void;
}

export default function AmateurMatchEditForm({ match, onSave, onCancel }: AmateurMatchEditFormProps) {
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [homePlayerStats, setHomePlayerStats] = useState<MatchPlayerStat[]>(
    match.home_team_player_stats || []
  );
  const [awayPlayerStats, setAwayPlayerStats] = useState<MatchPlayerStat[]>(
    match.away_team_player_stats || []
  );
  const [loading, setLoading] = useState(false);

  // Buscar jogadores dos times
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        // Buscar jogadores do time da casa
        const homeResponse = await fetch(`/api/amateur/teams/${match.home_team.id}/players`);
        if (homeResponse.ok) {
          const homePlayersData = await homeResponse.json();
          console.log('Dados brutos do time da casa:', homePlayersData);
          // Extrair apenas os dados dos jogadores do array de TeamPlayer
          const homePlayers = homePlayersData.map((teamPlayer: any) => teamPlayer.player).filter(Boolean);
          console.log('Jogadores extraídos do time da casa:', homePlayers);
          console.log('Número de jogadores do time da casa:', homePlayers.length);
          setHomePlayers(homePlayers);
        }

        // Buscar jogadores do time visitante
        const awayResponse = await fetch(`/api/amateur/teams/${match.away_team.id}/players`);
        if (awayResponse.ok) {
          const awayPlayersData = await awayResponse.json();
          console.log('Dados brutos do time visitante:', awayPlayersData);
          // Extrair apenas os dados dos jogadores do array de TeamPlayer
          const awayPlayers = awayPlayersData.map((teamPlayer: any) => teamPlayer.player).filter(Boolean);
          console.log('Jogadores extraídos do time visitante:', awayPlayers);
          console.log('Número de jogadores do time visitante:', awayPlayers.length);
          setAwayPlayers(awayPlayers);
        }
      } catch (error) {
        console.error('Erro ao buscar jogadores:', error);
      }
    };

    fetchPlayers();
  }, [match.home_team.id, match.away_team.id]);

  const handleAddGoal = (teamType: 'home' | 'away') => {
    const newStat: MatchPlayerStat = {
      player_id: 0,
      goals: 1,
      yellow_cards: 0,
      red_cards: 0
    };

    if (teamType === 'home') {
      setHomePlayerStats([...homePlayerStats, newStat]);
    } else {
      setAwayPlayerStats([...awayPlayerStats, newStat]);
    }
  };

  const handleRemoveGoal = (teamType: 'home' | 'away', index: number) => {
    if (teamType === 'home') {
      setHomePlayerStats(homePlayerStats.filter((_, i) => i !== index));
    } else {
      setAwayPlayerStats(awayPlayerStats.filter((_, i) => i !== index));
    }
  };

  const handlePlayerChange = (teamType: 'home' | 'away', index: number, playerId: number) => {
    if (teamType === 'home') {
      const newStats = [...homePlayerStats];
      newStats[index].player_id = playerId;
      setHomePlayerStats(newStats);
    } else {
      const newStats = [...awayPlayerStats];
      newStats[index].player_id = playerId;
      setAwayPlayerStats(newStats);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const matchData = {
        ...match,
        home_team_player_stats: homePlayerStats,
        away_team_player_stats: awayPlayerStats
      };

      await onSave(matchData);
    } catch (error) {
      console.error('Erro ao salvar jogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: number, players: Player[]) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Selecione um jogador';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Editar Jogo: {match.home_team.name} vs {match.away_team.name}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar modal"
            title="Fechar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Placar */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Placar</h3>
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="font-bold text-lg">{match.home_team.name}</div>
                <div className="text-3xl font-bold text-blue-600">{match.home_score || 0}</div>
              </div>
              <div className="text-2xl font-bold text-gray-400">×</div>
              <div className="text-center">
                <div className="font-bold text-lg">{match.away_team.name}</div>
                <div className="text-3xl font-bold text-blue-600">{match.away_score || 0}</div>
              </div>
            </div>
          </div>

          {/* Gols do Time da Casa */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900">
                Gols - {match.home_team.name}
              </h3>
              <button
                type="button"
                onClick={() => handleAddGoal('home')}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Gol</span>
              </button>
            </div>

            {homePlayerStats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3 p-3 bg-white rounded border">
                <select
                  value={stat.player_id}
                  onChange={(e) => handlePlayerChange('home', index, parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  aria-label="Selecionar jogador do time da casa"
                  title="Selecionar jogador do time da casa"
                >
                  <option key="select-home" value={0}>Selecione um jogador</option>
                  {homePlayers.map(player => (
                    <option key={`home-${player.id}`} value={player.id}>
                      {player.name} {player.position && `(${player.position})`}
                    </option>
                  ))}
                  {/* Debug: mostrar número de jogadores */}
                  {homePlayers.length === 0 && (
                    <option disabled>Nenhum jogador encontrado</option>
                  )}
                </select>
                <span className="text-lg font-bold text-blue-600">{stat.goals} gol(s)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal('home', index)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Remover gol do jogador"
                  title="Remover gol do jogador"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Gols do Time Visitante */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-900">
                Gols - {match.away_team.name}
              </h3>
              <button
                type="button"
                onClick={() => handleAddGoal('away')}
                className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Gol</span>
              </button>
            </div>

            {awayPlayerStats.map((stat, index) => (
              <div key={index} className="flex items-center space-x-4 mb-3 p-3 bg-white rounded border">
                <select
                  value={stat.player_id}
                  onChange={(e) => handlePlayerChange('away', index, parseInt(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  aria-label="Selecionar jogador do time visitante"
                  title="Selecionar jogador do time visitante"
                >
                  <option key="select-away" value={0}>Selecione um jogador</option>
                  {awayPlayers.map(player => (
                    <option key={`away-${player.id}`} value={player.id}>
                      {player.name} {player.position && `(${player.position})`}
                    </option>
                  ))}
                  {/* Debug: mostrar número de jogadores */}
                  {awayPlayers.length === 0 && (
                    <option disabled>Nenhum jogador encontrado</option>
                  )}
                </select>
                <span className="text-lg font-bold text-green-600">{stat.goals} gol(s)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal('away', index)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Remover gol do jogador"
                  title="Remover gol do jogador"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>
            ))}
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
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 