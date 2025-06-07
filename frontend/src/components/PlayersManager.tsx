'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'
import { format, parseISO } from 'date-fns'

interface Player {
  id: number
  name: string
  position?: string
  date_of_birth?: string
  nationality?: string
  image_url?: string
  team_history?: PlayerTeamHistory[]
}

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
    return <div className="text-center py-8">Carregando jogadores...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Jogadores</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os jogadores do sistema e seus vínculos com os times.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <button
            type="button"
            onClick={() => { setLoading(true); fetchData(); }}
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            title="Atualizar dados"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setShowPlayerModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Jogador
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-white dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Nasc.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nacionalidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Atual</th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {players.map((player) => {
                    const currentTeamHistory = player.team_history?.find(h => !h.end_date);
                    return (
                      <tr key={player.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {player.image_url && (
                              <img className="h-8 w-8 rounded-full mr-2 object-cover" src={imageUrl(player.image_url)} alt={player.name} />
                            )}
                            {!player.image_url && (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-600 text-sm font-semibold">
                                {player.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {player.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {player.position || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(player.date_of_birth)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {player.nationality || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {currentTeamHistory ? (
                            <div className="flex items-center gap-2">
                              <TeamLogo team={currentTeamHistory.team} />
                              <span>{currentTeamHistory.team.name}</span>
                              {currentTeamHistory.jersey_number && (
                                <span className="ml-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">#{currentTeamHistory.jersey_number}</span>
                              )}
                            </div>
                          ) : (
                            'Sem time ativo'
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => openHistoryModal(player)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Ver Histórico de Times"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Editar Jogador"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir Jogador"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Player Modal */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPlayer ? 'Editar Jogador' : 'Adicionar Jogador'}
            </h3>
            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Posição</label>
                <input
                  type="text"
                  name="position"
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://example.com/player.jpg"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowPlayerModal(false); setEditingPlayer(null); resetPlayerForm(); }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
                >
                  {editingPlayer ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPlayerForHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Histórico de Times de {selectedPlayerForHistory.name}
            </h3>
            <div className="mb-4 max-h-60 overflow-y-auto border p-2 rounded-md bg-gray-50">
              {selectedPlayerForHistory.team_history && selectedPlayerForHistory.team_history.length > 0 ? (
                <ul className="space-y-2">
                  {selectedPlayerForHistory.team_history.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()).map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between text-sm text-gray-700 p-2 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        {entry.team && <TeamLogo team={entry.team} />}
                        <span>{entry.team?.name || 'Time Desconhecido'}</span>
                        {entry.jersey_number && (
                          <span className="ml-1 text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">#{entry.jersey_number}</span>
                        )}
                        {entry.role && (
                          <span className="ml-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">{entry.role}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(entry.start_date)} - {entry.end_date ? formatDate(entry.end_date) : 'Atual'}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum histórico de time encontrado.</p>
              )}
            </div>

            <h4 className="text-md font-medium text-gray-900 mb-3">Adicionar Novo Vínculo</h4>
            <form onSubmit={handleHistorySubmit} className="space-y-3">
              <div>
                <label htmlFor="history_team" className="block text-sm font-medium text-gray-700">Time</label>
                <select
                  name="history_team"
                  id="history_team"
                  required
                  value={historyFormData.team_id}
                  onChange={(e) => setHistoryFormData({ ...historyFormData, team_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Selecione um time</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="history_start_date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                  <input
                    type="date"
                    name="history_start_date"
                    id="history_start_date"
                    required
                    value={historyFormData.start_date}
                    onChange={(e) => setHistoryFormData({ ...historyFormData, start_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="history_end_date" className="block text-sm font-medium text-gray-700">Data de Fim (opcional)</label>
                  <input
                    type="date"
                    name="history_end_date"
                    id="history_end_date"
                    value={historyFormData.end_date}
                    onChange={(e) => setHistoryFormData({ ...historyFormData, end_date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="history_jersey_number" className="block text-sm font-medium text-gray-700">Número da Camisa</label>
                  <input
                    type="text"
                    name="history_jersey_number"
                    id="history_jersey_number"
                    value={historyFormData.jersey_number}
                    onChange={(e) => setHistoryFormData({ ...historyFormData, jersey_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="history_role" className="block text-sm font-medium text-gray-700">Função/Papel</label>
                  <input
                    type="text"
                    name="history_role"
                    id="history_role"
                    value={historyFormData.role}
                    onChange={(e) => setHistoryFormData({ ...historyFormData, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowHistoryModal(false); resetHistoryForm(); }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
                >
                  Adicionar Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 