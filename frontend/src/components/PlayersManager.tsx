'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'
import { format, parseISO } from 'date-fns'
import PlayerStatsCard from './PlayerStatsCard'

interface Team {
  id: number
  name: string
  short_name?: string
  logo_url?: string
}

interface PlayerTeamHistory {
  id: number
  player_id: number
  team_id: number
  start_date: string
  end_date?: string
  jersey_number?: string
  role?: string
  team: Team
}

interface Goal {
  id: number;
  player_id: number;
  match_id: number;
  team_id: number;
  minute: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: number;
  player_id: number;
  match_id: number;
  type: 'yellow' | 'red';
  minute: number;
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface Player {
  id: number
  name: string
  position?: string
  date_of_birth?: string
  nationality?: string
  image_url?: string
  team_history?: PlayerTeamHistory[]
  goals?: Goal[];
  cards?: Card[];
}

interface PlayerFormData {
  name: string
  position: string
  date_of_birth: string
  nationality: string
  image_url: string
}

interface PlayerTeamHistoryFormData {
  team_id: string
  start_date: string
  end_date: string
  jersey_number: string
  role: string
}

export default function PlayersManager() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedPlayerForHistory, setSelectedPlayerForHistory] = useState<Player | null>(null)
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<Player | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    position: '',
    date_of_birth: '',
    nationality: '',
    image_url: '',
  })
  const [historyFormData, setHistoryFormData] = useState<PlayerTeamHistoryFormData>({
    team_id: '',
    start_date: '',
    end_date: '',
    jersey_number: '',
    role: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        fetch(API_ENDPOINTS.players.list()),
        fetch(API_ENDPOINTS.teams.list()),
      ])

      if (playersRes.ok) {
        const playersData = await playersRes.json()
        setPlayers(playersData)
      }
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let url = API_ENDPOINTS.players.list();
      let method = 'POST';
      if (editingPlayer) {
        url = `${API_ENDPOINTS.players.list()}/${editingPlayer.id}`;
        method = 'PUT';
      }

      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowPlayerModal(false)
        setEditingPlayer(null)
        resetPlayerForm()
        fetchData()
      } else {
        const errorText = await response.text();
        console.error('Erro ao salvar jogador:', response.status, errorText);
        alert(`Erro ao salvar jogador: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Erro ao salvar jogador:', error)
      alert('Erro ao salvar jogador. Tente novamente.')
    }
  }

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayerForHistory) return;

    try {
      const payload = {
        teamId: historyFormData.team_id,
        startDate: historyFormData.start_date ? new Date(historyFormData.start_date).toISOString() : null,
        endDate: historyFormData.end_date ? new Date(historyFormData.end_date).toISOString() : null,
        jerseyNumber: historyFormData.jersey_number,
        role: historyFormData.role,
      }

      const response = await fetch(`${API_ENDPOINTS.players.list()}/${selectedPlayerForHistory.id}/add-to-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowHistoryModal(false)
        resetHistoryForm()
        fetchData()
      } else {
        const errorText = await response.text();
        console.error('Erro ao adicionar histórico de time:', response.status, errorText);
        alert(`Erro ao adicionar histórico de time: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Erro ao adicionar histórico de time:', error)
      alert('Erro ao adicionar histórico de time. Tente novamente.')
    }
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      position: player.position || '',
      date_of_birth: player.date_of_birth ? format(parseISO(player.date_of_birth), 'yyyy-MM-dd') : '',
      nationality: player.nationality || '',
      image_url: player.image_url || '',
    })
    setShowPlayerModal(true)
  }

  const handleDeletePlayer = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este jogador?')) {
      try {
        await fetch(`${API_ENDPOINTS.players.list()}/${id}`, {
          method: 'DELETE',
        })
        fetchData()
      } catch (error) {
        console.error('Erro ao excluir jogador:', error)
        alert('Erro ao excluir jogador. Tente novamente.')
      }
    }
  }

  const openHistoryModal = (player: Player) => {
    setSelectedPlayerForHistory(player);
    setShowHistoryModal(true);
  }

  const openStatsCard = async (player: Player) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.players.list()}/${player.id}`);
      if (response.ok) {
        const fullPlayerData: Player = await response.json();
        setSelectedPlayerForStats(fullPlayerData);
      } else {
        alert('Erro ao carregar dados completos do jogador.');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do jogador para estatísticas:', error);
      alert('Erro de conexão ao carregar dados do jogador.');
    }
  };

  const closeStatsCard = () => {
    setSelectedPlayerForStats(null);
  };

  const resetPlayerForm = () => {
    setFormData({
      name: '',
      position: '',
      date_of_birth: '',
      nationality: '',
      image_url: '',
    })
  }

  const resetHistoryForm = () => {
    setHistoryFormData({
      team_id: '',
      start_date: '',
      end_date: '',
      jersey_number: '',
      role: '',
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'dd/MM/yyyy');
  }

  const TeamLogo = ({ team }: { team: Team }) => {
    if (!team || !team.logo_url) {
      return (
        <div className="h-5 w-5 rounded-md bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {team?.short_name?.substring(0, 3) || team?.name?.substring(0, 3) || '?'}
        </div>
      );
    }
    return (
      <img 
        className="h-5 w-5 rounded-md object-cover" 
        src={imageUrl(team.logo_url)} 
        alt={`Escudo ${team.name || 'Time'}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          target.nextElementSibling?.classList.remove('hidden')
        }}
      />
    );
  };

  if (loading) {
    return <div className="text-center py-4">Carregando jogadores...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Jogadores</h1>
          <p className="mt-2 text-sm text-gray-700">
            Uma lista de todos os jogadores cadastrados, incluindo seus dados pessoais e históricos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowPlayerModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
            Adicionar Jogador
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Nome
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Posição
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nacionalidade
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Nascimento
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          {player.image_url && (
                            <img src={imageUrl(player.image_url)} alt={`${player.name} foto`} className="h-8 w-8 rounded-full object-cover mr-2" />
                          )}
                          {!player.image_url && (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 mr-2">
                              {player.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          {player.name}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {player.position || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {player.nationality || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(player.date_of_birth)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => openStatsCard(player)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Ver Estatísticas"
                        >
                          <ChartBarIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Editar<span className="sr-only">, {player.name}</span>
                        </button>
                        <button
                          onClick={() => openHistoryModal(player)}
                          className="text-teal-600 hover:text-teal-900 mr-3"
                          title="Gerenciar Histórico de Time"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir<span className="sr-only">, {player.name}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Jogador */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="player-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{editingPlayer ? 'Editar Jogador' : 'Adicionar Novo Jogador'}</h3>
              <form onSubmit={handlePlayerSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">Posição</label>
                  <input
                    type="text"
                    name="position"
                    id="position"
                    value={formData.position}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, position: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    id="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nacionalidade</label>
                  <input
                    type="text"
                    name="nationality"
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, nationality: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">URL da Imagem</label>
                  <input
                    type="text"
                    name="image_url"
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, image_url: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://exemplo.com/foto.png"
                  />
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowPlayerModal(false); setEditingPlayer(null); resetPlayerForm(); }}
                    className="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {editingPlayer ? 'Salvar Alterações' : 'Adicionar Jogador'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Gerenciar Histórico de Time */}
      {showHistoryModal && selectedPlayerForHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="history-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Histórico de Times: {selectedPlayerForHistory.name}</h3>
              <form onSubmit={handleHistorySubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">Time</label>
                  <select
                    name="team_id"
                    id="team_id"
                    value={historyFormData.team_id}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setHistoryFormData({ ...historyFormData, team_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Selecione um time</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    value={historyFormData.start_date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setHistoryFormData({ ...historyFormData, start_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Data de Fim (Opcional)</label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    value={historyFormData.end_date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setHistoryFormData({ ...historyFormData, end_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-700">Número da Camisa (Opcional)</label>
                  <input
                    type="text"
                    name="jersey_number"
                    id="jersey_number"
                    value={historyFormData.jersey_number}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setHistoryFormData({ ...historyFormData, jersey_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">Função (Opcional)</label>
                  <input
                    type="text"
                    name="role"
                    id="role"
                    value={historyFormData.role}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setHistoryFormData({ ...historyFormData, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowHistoryModal(false); resetHistoryForm(); }}
                    className="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Adicionar Histórico
                  </button>
                </div>
              </form>

              {/* Histórico Existente */}
              {selectedPlayerForHistory.team_history && selectedPlayerForHistory.team_history.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Histórico Atual</h4>
                  <ul className="divide-y divide-gray-200">
                    {selectedPlayerForHistory.team_history.map((history) => (
                      <li key={history.id} className="py-2 flex justify-between items-center">
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-gray-900">
                            {history.team?.name} ({history.jersey_number || 'N/A'})
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(history.start_date)} - {history.end_date ? formatDate(history.end_date) : 'Presente'}
                            {history.role && ` (${history.role})`}
                          </p>
                        </div>
                        <button
                          onClick={() => console.log('Remover histórico:', history.id)}
                          className="ml-4 text-red-600 hover:text-red-900 text-sm"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Renderiza o PlayerStatsCard se um jogador estiver selecionado */}
      {selectedPlayerForStats && (
        <PlayerStatsCard player={selectedPlayerForStats} onClose={closeStatsCard} />
      )}
    </div>
  );
} 