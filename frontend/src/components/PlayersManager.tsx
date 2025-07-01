'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { useDebounce } from 'use-debounce'
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon, ArrowPathIcon, ChartBarIcon, MagnifyingGlassIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, apiUrl } from '../config/api'
import { getPlayerImageUrl, getTeamLogoUrl, handleImageError } from '../lib/cdn'
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
  state?: string
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
  state: string
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
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([])
  const [paginatedPlayers, setPaginatedPlayers] = useState<Player[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedPlayerForHistory, setSelectedPlayerForHistory] = useState<Player | null>(null)
  const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<Player | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [imageInputType, setImageInputType] = useState<'upload' | 'url'>('upload')
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    position: '',
    date_of_birth: '',
    nationality: 'Brasil',
    state: 'active',
    image_url: '',
  })
  const [historyFormData, setHistoryFormData] = useState<PlayerTeamHistoryFormData>({
    team_id: '',
    start_date: '',
    end_date: '',
    jersey_number: '',
    role: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [positionFilter, setPositionFilter] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15;

  useEffect(() => {
    fetchAllPlayers()
    fetchTeams()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [players, debouncedSearchTerm, positionFilter, nationalityFilter, stateFilter])

  useEffect(() => {
    applyPagination()
  }, [filteredPlayers, currentPage])

  const fetchAllPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.players.list(1, 1000)) // Buscar todos os jogadores
      if (response.ok) {
        const playersData = await response.json()
        setPlayers(playersData.data)
        setTotalPlayers(playersData.total)
      }
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error)
      setPlayers([]);
      setTotalPlayers(0);
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.teams.list()}?limit=1000`)
      if (response.ok) {
        const teamsData = await response.json()
        setTeams(teamsData.data) 
      }
    } catch (error) {
      console.error('Erro ao carregar times:', error)
      setTeams([]);
    }
  }

  const applyFilters = () => {
    if (!players.length) return;
    
    let filtered = [...players]

    // Filtro por termo de busca
    if (debouncedSearchTerm) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        player.nationality?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Filtro por posição
    if (positionFilter) {
      filtered = filtered.filter(player => 
        player.position?.toLowerCase() === positionFilter.toLowerCase()
      )
    }

    // Filtro por nacionalidade
    if (nationalityFilter) {
      filtered = filtered.filter(player => 
        player.nationality?.toLowerCase() === nationalityFilter.toLowerCase()
      )
    }



    // Filtro por estado
    if (stateFilter) {
      filtered = filtered.filter(player => 
        player.state?.toLowerCase() === stateFilter.toLowerCase()
      )
    }

    setFilteredPlayers(filtered)
    setCurrentPage(1) // Reset para primeira página quando filtrar
  }

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedPlayers(filteredPlayers.slice(startIndex, endIndex))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPositionFilter('')
    setNationalityFilter('')
    setStateFilter('')
    setCurrentPage(1)
  }

  const getUniquePositions = () => {
    const positions = new Set<string>()
    players.forEach(player => {
      if (player.position) positions.add(player.position)
    })
    return Array.from(positions).sort()
  }

  const getUniqueNationalities = () => {
    const nationalities = new Set<string>()
    players.forEach(player => {
      if (player.nationality) nationalities.add(player.nationality)
    })
    return Array.from(nationalities).sort()
  }



  const getUniqueStates = () => {
    const states = ['active', 'retired', 'injured', 'inactive']
    return states
  }

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    
    try {
      let url = API_ENDPOINTS.players.base();
      let method = 'POST';
      if (editingPlayer) {
        url = `${API_ENDPOINTS.players.base()}/${editingPlayer.id}`;
        method = 'PUT';
      }

      let payload = {
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
        const savedPlayer = await response.json()
        
        // Se há arquivo selecionado, fazer upload
        if (selectedFile) {
          const uploadedImageUrl = await uploadPlayerImage(savedPlayer.id || editingPlayer?.id)
          if (uploadedImageUrl) {
            // Atualizar o jogador com a nova URL da imagem
            await fetch(`${API_ENDPOINTS.players.base()}/${savedPlayer.id || editingPlayer?.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...payload,
                image_url: uploadedImageUrl
              }),
            })
          }
        }
        
        setShowPlayerModal(false)
        setEditingPlayer(null)
        resetPlayerForm()
        fetchAllPlayers()
      } else {
        const errorText = await response.text();
        console.error('Erro ao salvar jogador:', response.status, errorText);
        alert(`Erro ao salvar jogador: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Erro ao salvar jogador:', error)
      alert('Erro ao salvar jogador. Tente novamente.')
    } finally {
      setUploading(false)
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

      const response = await fetch(`${API_ENDPOINTS.players.base()}/${selectedPlayerForHistory.id}/add-to-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowHistoryModal(false)
        resetHistoryForm()
        fetchAllPlayers()
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
      nationality: player.nationality || 'Brasil',
      state: player.state || 'active',
      image_url: player.image_url || '',
    })
    setShowPlayerModal(true)
  }

  const handleDeletePlayer = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este jogador?')) {
      try {
        await fetch(`${API_ENDPOINTS.players.base()}/${id}`, {
          method: 'DELETE',
        })
        fetchAllPlayers()
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
      const response = await fetch(`${API_ENDPOINTS.players.base()}/${player.id}`);
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
      nationality: 'Brasil',
      state: 'active',
      image_url: '',
    })
    setSelectedFile(null)
    setPreviewUrl('')
    setImageInputType('upload')
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
        src={getTeamLogoUrl(team.logo_url)} 
        alt={`Escudo ${team.name || 'Time'}`}
        onError={handleImageError}
      />
    );
  };

  const handleRemovePlayerFromTeamHistory = async (historyId: number, teamId: number) => {
    if (!confirm('Tem certeza que deseja remover este jogador deste time?')) {
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.teams.list()}/${teamId}/players/${historyId}/remove`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ end_date: new Date().toISOString() }),
      });

      if (response.ok) {
        console.log('Histórico removido com sucesso!');
        fetchAllPlayers(); // Recarregar os dados para atualizar a lista
      } else {
        const errorText = await response.text();
        console.error('Erro ao remover histórico:', response.status, errorText);
        alert(`Erro ao remover histórico: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erro ao remover histórico de time:', error);
      alert('Erro de conexão ao remover histórico de time.');
    }
  };

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setFormData(prev => ({ ...prev, image_url: '' }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'image_url' && value) {
      setSelectedFile(null)
      setPreviewUrl(value)
    }
  }

  const uploadPlayerImage = async (playerId: number): Promise<string | null> => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'jogadores')
      formData.append('namingStrategy', 'name')
      formData.append('entityName', `jogador-${playerId}`)

      const response = await fetch(apiUrl('upload/cloud'), {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Upload da imagem bem-sucedido:', result)
        return result.url // URL do CDN
      } else {
        const errorText = await response.text()
        console.error('❌ Erro no upload da imagem:', errorText)
        return null
      }
    } catch (error) {
      console.error('❌ Erro de conexão no upload da imagem:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

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

      <div className="mt-4 mb-4 grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Buscar jogadores..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
        
        <div>
          <label htmlFor="positionFilter" className="sr-only">Filtrar por Posição</label>
          <select
            id="positionFilter"
            value={positionFilter}
            onChange={(e) => {
              setPositionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Posição</option>
            {getUniquePositions().map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nationalityFilter" className="sr-only">Filtrar por Nacionalidade</label>
          <select
            id="nationalityFilter"
            value={nationalityFilter}
            onChange={(e) => {
              setNationalityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Nacionalidade</option>
            {getUniqueNationalities().map(nationality => (
              <option key={nationality} value={nationality}>{nationality}</option>
            ))}
          </select>
        </div>



        <div>
          <label htmlFor="stateFilter" className="sr-only">Filtrar por Estado</label>
          <select
            id="stateFilter"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Estado</option>
            {getUniqueStates().map(state => (
              <option key={state} value={state}>
                {state === 'active' ? 'Ativo' :
                 state === 'retired' ? 'Aposentado' :
                 state === 'injured' ? 'Lesionado' :
                 state === 'inactive' ? 'Inativo' : state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Mostrando {paginatedPlayers.length} de {filteredPlayers.length} jogadores
        </p>
        <button
          onClick={clearFilters}
          className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
        >
          Limpar Filtros
        </button>
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
                      Estado
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
                  {paginatedPlayers.map((player) => (
                    <tr key={player.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center">
                          {player.image_url && (
                            <img src={getPlayerImageUrl(player.image_url)} alt={`${player.name} foto`} className="h-8 w-8 rounded-full object-cover mr-2" />
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          player.state === 'active' ? 'bg-green-100 text-green-800' :
                          player.state === 'retired' ? 'bg-gray-100 text-gray-800' :
                          player.state === 'injured' ? 'bg-red-100 text-red-800' :
                          player.state === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {player.state === 'active' ? 'Ativo' :
                           player.state === 'retired' ? 'Aposentado' :
                           player.state === 'injured' ? 'Lesionado' :
                           player.state === 'inactive' ? 'Inativo' :
                           'N/A'}
                        </span>
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

      {/* Paginação */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Página {currentPage} de {totalPages} (Total: {filteredPlayers.length} jogadores)
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Primeira
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Última
          </button>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">Posição</label>
                    <input
                      type="text"
                      name="position"
                      id="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Nascimento</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      id="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nacionalidade</label>
                    <input
                      type="text"
                      name="nationality"
                      id="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    name="state"
                    id="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="active">Ativo</option>
                    <option value="retired">Aposentado</option>
                    <option value="injured">Lesionado</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Foto do Jogador</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setImageInputType('upload')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${imageInputType === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputType('url')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${imageInputType === 'url' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      URL
                    </button>
                  </div>
                  {imageInputType === 'upload' ? (
                    <div className="mt-2 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                          >
                            <span>Upload um arquivo</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      name="image_url"
                      id="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://exemplo.com/foto.png"
                    />
                  )}
                  {previewUrl && (
                    <div className="mt-4">
                      <p className="block text-sm font-medium text-gray-700 mb-2">Prévia da Foto:</p>
                      <img src={previewUrl} alt="Prévia da Foto" className="h-20 w-20 rounded-full object-cover" />
                    </div>
                  )}
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
                    disabled={uploading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Salvando...' : (editingPlayer ? 'Salvar Alterações' : 'Adicionar Jogador')}
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
                          onClick={() => handleRemovePlayerFromTeamHistory(history.id, history.team.id)}
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