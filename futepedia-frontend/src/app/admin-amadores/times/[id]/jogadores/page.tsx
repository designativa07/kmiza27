'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, User, Calendar, Hash } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position?: string;
  image_url?: string;
  date_of_birth?: string;
  nationality?: string;
  state?: string;
}

interface Team {
  id: number;
  name: string;
  logo_url?: string | null;
  location?: string;
  founded?: string;
  category?: string;
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

export default function TeamPlayersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados do time
        const teamResponse = await fetch(`/api/amateur/teams/${teamId}`);
        if (!teamResponse.ok) {
          throw new Error('Time não encontrado');
        }
        const teamData = await teamResponse.json();
        setTeam(teamData);

        // Buscar jogadores do time
        const playersResponse = await fetch(`/api/amateur/teams/${teamId}/players`);
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          setTeamPlayers(playersData);
        } else {
          setTeamPlayers([]);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do time:', error);
        setError('Erro ao carregar dados do time');
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getPlayerStatus = (player: Player) => {
    if (player.state === 'active') return 'Ativo';
    if (player.state === 'retired') return 'Aposentado';
    if (player.state === 'injured') return 'Lesionado';
    return 'Desconhecido';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Carregando elenco...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Time não encontrado</p>
            <button
              onClick={() => router.back()}
              className="mt-2 text-yellow-600 hover:text-yellow-800"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              Elenco - {team.name}
            </h1>
          </div>
        </div>

        {/* Team Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            {team.logo_url && (
              <img
                src={team.logo_url}
                alt={`Logo do ${team.name}`}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{team.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                {team.location && (
                  <span className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>{team.location}</span>
                  </span>
                )}
                {team.founded && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Fundado em {team.founded}</span>
                  </span>
                )}
                {team.category && (
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span className="capitalize">{team.category}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Jogadores ({teamPlayers.length})
              </h3>
              <button
                onClick={() => router.push(`/admin-amadores/times`)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Users className="h-4 w-4" />
                <span>Gerenciar Jogadores</span>
              </button>
            </div>
          </div>

          {teamPlayers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum jogador no elenco
              </h3>
              <p className="text-gray-500 mb-4">
                Este time ainda não possui jogadores associados.
              </p>
              <button
                onClick={() => router.push(`/admin-amadores/times`)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Users className="h-4 w-4" />
                <span>Adicionar Jogadores</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jogador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Início
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamPlayers.map((teamPlayer, index) => (
                    <tr key={teamPlayer.id || `${teamPlayer.player_id}-${teamPlayer.team_id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {teamPlayer.player?.image_url && (
                            <img
                              src={teamPlayer.player.image_url}
                              alt={teamPlayer.player.name}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {teamPlayer.player?.name || 'Jogador não encontrado'}
                            </div>
                            {teamPlayer.player?.nationality && (
                              <div className="text-sm text-gray-500">
                                {teamPlayer.player.nationality}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {teamPlayer.jersey_number || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {teamPlayer.player?.position || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {teamPlayer.role || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          teamPlayer.player?.state === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : teamPlayer.player?.state === 'retired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {teamPlayer.player ? getPlayerStatus(teamPlayer.player) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {formatDate(teamPlayer.start_date)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 