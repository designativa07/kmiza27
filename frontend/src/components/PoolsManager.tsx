'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS, apiUrl } from '../config/api'

interface User {
  id: number;
  name: string;
  email: string;
}

interface Round {
  id: number;
  number: number;
  name: string;
  competition: {
    id: number;
    name: string;
  };
}

interface Match {
  id: number;
  home_team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  away_team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  match_date: string;
  competition: {
    id: number;
    name: string;
  };
}

interface PoolMatch {
  id: number;
  match: Match;
  order_index: number;
}

interface PoolParticipant {
  id: number;
  user: User;
  total_points: number;
  ranking_position: number;
  predictions_count: number;
  exact_predictions: number;
  correct_results: number;
}

interface Pool {
  id: number;
  title: string;
  description?: string;
  type: 'round' | 'custom';
  status: 'draft' | 'open' | 'closed' | 'finished';
  round?: Round;
  creator: User;
  start_date?: string;
  end_date?: string;
  prediction_deadline?: string;
  scoring_rules: {
    exact_score?: number;
    correct_result?: number;
    goal_difference?: number;
  };
  settings: {
    max_participants?: number;
    entry_fee?: number;
    public?: boolean;
  };
  pool_matches: PoolMatch[];
  participants: PoolParticipant[];
  created_at: string;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
}

const statusLabels = {
  draft: 'Rascunho',
  open: 'Aberto',
  closed: 'Fechado',
  finished: 'Finalizado'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  finished: 'bg-blue-100 text-blue-800'
};

export default function PoolsManager() {
  const { user, token, isAuthenticated } = useAuth()
  const [pools, setPools] = useState<Pool[]>([])
  const [filteredPools, setFilteredPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  // Form data para criação/edição
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' as 'round' | 'custom',
    round_id: '',
    match_ids: [] as number[],
    scoring_rules: {
      exact_score: 10,
      correct_result: 5,
      goal_difference: 3
    },
    settings: {
      max_participants: null as number | null,
      entry_fee: 0,
      public: true
    },
    start_date: '',
    end_date: '',
    prediction_deadline: ''
  })
  
  // Campo para adicionar jogo por ID
  const [gameIdInput, setGameIdInput] = useState('')
  
  // Dados auxiliares
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [rounds, setRounds] = useState<Round[]>([])
  const [availableMatches, setAvailableMatches] = useState<Match[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState('')

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchPools()
      fetchCompetitions()
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    filterPools()
  }, [pools, debouncedSearchTerm, statusFilter, typeFilter])

  const fetchPools = async () => {
    try {
      if (!isAuthenticated || !token) {
        console.log('Usuário não autenticado')
        return
      }
      
      console.log('Token disponível:', !!token) // Debug
      const response = await fetch(apiUrl('/pools'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Response status:', response.status) // Debug
      if (response.ok) {
        const data = await response.json()
        setPools(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bolões:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(apiUrl('/competitions'))
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data)
      }
    } catch (error) {
      console.error('Erro ao buscar competições:', error)
    }
  }

  const fetchRounds = async (competitionId: string) => {
    try {
      const response = await fetch(apiUrl(`/rounds/competition/${competitionId}`))
      if (response.ok) {
        const data = await response.json()
        setRounds(data)
      }
    } catch (error) {
      console.error('Erro ao buscar rodadas:', error)
    }
  }

  const fetchMatches = async (competitionId: string, roundId?: string) => {
    try {
      let url = `/matches?competition_id=${competitionId}`
      if (roundId) {
        url += `&round_id=${roundId}`
      }
      
      console.log('🔍 Buscando jogos:', url) // Debug
      const response = await fetch(apiUrl(url))
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Jogos encontrados:', data) // Debug
        // A API retorna { data: Match[], total: number }
        setAvailableMatches(data.data || data)
      } else {
        console.error('❌ Erro na resposta:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar jogos:', error)
    }
  }

  const filterPools = () => {
    let filtered = [...pools]

    if (debouncedSearchTerm) {
      filtered = filtered.filter(pool =>
        pool.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        pool.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        pool.creator.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(pool => pool.status === statusFilter)
    }

    if (typeFilter) {
      filtered = filtered.filter(pool => pool.type === typeFilter)
    }

    setFilteredPools(filtered)
  }

  const handleCreate = async () => {
    try {
      if (!token) return
      const response = await fetch(apiUrl('/pools'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          round_id: formData.round_id ? parseInt(formData.round_id) : undefined,
          start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
          end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
          prediction_deadline: formData.prediction_deadline ? new Date(formData.prediction_deadline).toISOString() : undefined
        })
      })

      if (response.ok) {
        await fetchPools()
        setShowCreateModal(false)
        resetForm()
      } else {
        const error = await response.json()
        alert('Erro ao criar bolão: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao criar bolão:', error)
      alert('Erro ao criar bolão')
    }
  }

  const handlePublish = async (poolId: number) => {
    try {
      if (!token) return
      const response = await fetch(apiUrl(`/pools/${poolId}/publish`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchPools()
      } else {
        const error = await response.json()
        alert('Erro ao publicar bolão: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao publicar bolão:', error)
      alert('Erro ao publicar bolão')
    }
  }

  const handleClose = async (poolId: number) => {
    try {
      if (!token) return
      const response = await fetch(apiUrl(`/pools/${poolId}/close`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchPools()
      } else {
        const error = await response.json()
        alert('Erro ao fechar bolão: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao fechar bolão:', error)
      alert('Erro ao fechar bolão')
    }
  }

  const handleDelete = async (poolId: number) => {
    if (!confirm('Tem certeza que deseja excluir este bolão?')) return

    try {
      if (!token) return
      const response = await fetch(apiUrl(`/pools/${poolId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchPools()
      } else {
        const error = await response.json()
        alert('Erro ao excluir bolão: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao excluir bolão:', error)
      alert('Erro ao excluir bolão')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'custom',
      round_id: '',
      match_ids: [],
      scoring_rules: {
        exact_score: 10,
        correct_result: 5,
        goal_difference: 3
      },
      settings: {
        max_participants: null,
        entry_fee: 0,
        public: true
      },
      start_date: '',
      end_date: '',
      prediction_deadline: ''
    })
    setSelectedCompetition('')
    setGameIdInput('')
    setRounds([])
    setAvailableMatches([])
  }

  const handleCompetitionChange = (competitionId: string) => {
    setSelectedCompetition(competitionId)
    if (competitionId) {
      fetchRounds(competitionId)
      fetchMatches(competitionId)
    } else {
      setRounds([])
      setAvailableMatches([])
    }
  }

  const handleRoundChange = (roundId: string) => {
    setFormData(prev => ({ ...prev, round_id: roundId }))
    if (roundId && selectedCompetition) {
      fetchMatches(selectedCompetition, roundId)
    }
  }

  const handleMatchToggle = (matchId: number) => {
    setFormData(prev => ({
      ...prev,
      match_ids: prev.match_ids.includes(matchId)
        ? prev.match_ids.filter(id => id !== matchId)
        : [...prev.match_ids, matchId]
    }))
  }
  
  const handleAddGameById = () => {
    const gameId = parseInt(gameIdInput)
    if (!gameId || isNaN(gameId)) {
      alert('Por favor, insira um ID válido')
      return
    }
    
    if (formData.match_ids.includes(gameId)) {
      alert('Este jogo já foi adicionado')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      match_ids: [...prev.match_ids, gameId]
    }))
    
    setGameIdInput('')
    console.log('✅ Jogo adicionado por ID:', gameId)
  }
  
  const removeGameById = (gameId: number) => {
    setFormData(prev => ({
      ...prev,
      match_ids: prev.match_ids.filter(id => id !== gameId)
    }))
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando bolões...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Bolões</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os bolões e competições de palpites.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Criar Bolão
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-4 mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Buscar por título, descrição ou criador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            title="Filtrar por status"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="open">Aberto</option>
            <option value="closed">Fechado</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>

        <div>
          <select
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            title="Filtrar por tipo"
          >
            <option value="">Todos os tipos</option>
            <option value="round">Rodada Completa</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>

      {/* Lista de Bolões */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bolão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Participantes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Jogos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {pool.title}
                          </div>
                          {pool.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {pool.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            Criado por: {pool.creator.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[pool.status]}`}>
                          {statusLabels[pool.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pool.type === 'round' ? 'Rodada Completa' : 'Personalizado'}
                        {pool.round && (
                          <div className="text-xs text-gray-500">
                            {pool.round.competition.name} - Rodada {pool.round.number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {pool.participants?.length || 0}
                          {pool.settings?.max_participants && (
                            <span className="text-gray-500">
                              /{pool.settings.max_participants}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {pool.pool_matches?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pool.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPool(pool)
                              setShowViewModal(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {pool.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(pool.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Publicar"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {pool.status === 'open' && (
                            <button
                              onClick={() => handleClose(pool.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Fechar"
                            >
                              <PauseIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(pool.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredPools.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum bolão encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Criação de Bolão */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Criar Novo Bolão
                </h3>
                
                <div className="space-y-4">
                  {/* Informações Básicas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Título do Bolão
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Bolão Brasileirão 2024 - Rodada 15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição (opcional)
                    </label>
                    <textarea
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do bolão..."
                    />
                  </div>

                  {/* Tipo de Bolão */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de Bolão
                    </label>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="poolType"
                          value="round"
                          checked={formData.type === 'round'}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'round' }))}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Rodada Completa - Todos os jogos de uma rodada específica
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="poolType"
                          value="custom"
                          checked={formData.type === 'custom'}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'custom' }))}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Personalizado - Selecionar jogos específicos
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Seleção de Competição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Competição
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={selectedCompetition}
                      onChange={(e) => handleCompetitionChange(e.target.value)}
                      title="Selecionar competição"
                    >
                      <option value="">Selecione uma competição</option>
                      {competitions.map(comp => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção de Rodada (para tipo 'round') */}
                  {formData.type === 'round' && selectedCompetition && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Rodada
                      </label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={formData.round_id}
                        onChange={(e) => handleRoundChange(e.target.value)}
                        title="Selecionar rodada"
                      >
                        <option value="">Selecione uma rodada</option>
                        {rounds.map(round => (
                          <option key={round.id} value={round.id}>
                            Rodada {round.number} - {round.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Debug: mostrar informações */}
                  {formData.type === 'custom' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4 text-xs">
                      <p><strong>Debug:</strong></p>
                      <p>Competição selecionada: {selectedCompetition}</p>
                      <p>Jogos disponíveis: {availableMatches.length}</p>
                      <p>Tipo: {formData.type}</p>
                    </div>
                  )}

                  {/* Seleção de Jogos (para tipo 'custom') */}
                  {formData.type === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecionar Jogos ({formData.match_ids.length} selecionados)
                      </label>
                      
                      {availableMatches.length === 0 && selectedCompetition && (
                        <div className="text-sm text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                          Nenhum jogo encontrado para esta competição. Selecione uma competição diferente ou verifique se há jogos cadastrados.
                        </div>
                      )}
                      
                      {availableMatches.length === 0 && !selectedCompetition && (
                        <div className="text-sm text-blue-600 mb-2 p-2 bg-blue-50 rounded">
                          Selecione uma competição acima para ver os jogos disponíveis.
                        </div>
                      )}
                      {/* Campo para adicionar por ID */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Adicionar Jogo por ID
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={gameIdInput}
                            onChange={(e) => setGameIdInput(e.target.value)}
                            placeholder="Digite o ID do jogo"
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddGameById}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Adicionar
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          Use este campo para adicionar jogos específicos pelo ID. Útil quando há muitos jogos na lista.
                        </p>
                      </div>
                      
                      {/* Lista de jogos selecionados */}
                      {formData.match_ids.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                          <label className="block text-sm font-medium text-green-900 mb-2">
                            Jogos Selecionados ({formData.match_ids.length})
                          </label>
                          <div className="space-y-1">
                            {formData.match_ids.map(gameId => {
                              const match = availableMatches.find(m => m.id === gameId)
                              return (
                                <div key={gameId} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="text-sm">
                                    <span className="font-medium text-green-800">ID: {gameId}</span>
                                    {match && (
                                      <span className="text-gray-600 ml-2">
                                        - {match.home_team?.name} vs {match.away_team?.name}
                                      </span>
                                    )}
                                    {!match && (
                                      <span className="text-orange-600 ml-2">
                                        - Jogo não encontrado na lista atual
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeGameById(gameId)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                    title="Remover jogo"
                                  >
                                    ❌
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Lista de jogos disponíveis */}
                      {availableMatches.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ou selecione da lista abaixo:
                          </label>
                          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                            {availableMatches.map(match => (
                              <label key={match.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  checked={formData.match_ids.includes(match.id)}
                                  onChange={() => handleMatchToggle(match.id)}
                                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <div className="flex-1 text-sm">
                                  <div className="font-medium">
                                    {match.home_team?.name || 'Time não encontrado'} vs {match.away_team?.name || 'Time não encontrado'}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    ID: {match.id} | {new Date(match.match_date).toLocaleString('pt-BR')}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regras de Pontuação */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Regras de Pontuação</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600">Placar Exato</label>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.scoring_rules.exact_score}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            scoring_rules: {
                              ...prev.scoring_rules,
                              exact_score: parseInt(e.target.value) || 0
                            }
                          }))}
                          title="Pontos por placar exato"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Resultado Correto</label>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.scoring_rules.correct_result}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            scoring_rules: {
                              ...prev.scoring_rules,
                              correct_result: parseInt(e.target.value) || 0
                            }
                          }))}
                          title="Pontos por resultado correto"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Diferença de Gols</label>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.scoring_rules.goal_difference}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            scoring_rules: {
                              ...prev.scoring_rules,
                              goal_difference: parseInt(e.target.value) || 0
                            }
                          }))}
                          title="Pontos por diferença de gols"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Configurações</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.settings.public}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              public: e.target.checked
                            }
                          }))}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Bolão público (visível para todos os usuários)
                        </span>
                      </label>
                      
                      <div>
                        <label className="block text-sm text-gray-700">
                          Limite máximo de participantes (opcional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.settings.max_participants || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              max_participants: e.target.value ? parseInt(e.target.value) : null
                            }
                          }))}
                          placeholder="Deixe vazio para ilimitado"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!formData.title || (!formData.round_id && formData.type === 'round') || (formData.type === 'custom' && formData.match_ids.length === 0)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Bolão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Bolão */}
      {showViewModal && selectedPool && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowViewModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedPool.title}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[selectedPool.status]}`}>
                    {statusLabels[selectedPool.status]}
                  </span>
                </div>
                
                {selectedPool.description && (
                  <p className="text-gray-600 mb-4">{selectedPool.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações do Bolão */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações</h4>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Tipo:</dt>
                        <dd>{selectedPool.type === 'round' ? 'Rodada Completa' : 'Personalizado'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Criador:</dt>
                        <dd>{selectedPool.creator.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Participantes:</dt>
                        <dd>
                          {selectedPool.participants?.length || 0}
                          {selectedPool.settings?.max_participants && ` / ${selectedPool.settings.max_participants}`}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Jogos:</dt>
                        <dd>{selectedPool.pool_matches?.length || 0}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Público:</dt>
                        <dd>{selectedPool.settings?.public ? 'Sim' : 'Não'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Regras de Pontuação */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pontuação</h4>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Placar Exato:</dt>
                        <dd>{selectedPool.scoring_rules.exact_score} pontos</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Resultado Correto:</dt>
                        <dd>{selectedPool.scoring_rules.correct_result} pontos</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Diferença de Gols:</dt>
                        <dd>{selectedPool.scoring_rules.goal_difference} pontos</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Lista de Jogos */}
                                  {(selectedPool.pool_matches?.length || 0) > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Jogos do Bolão</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {selectedPool.pool_matches
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((poolMatch) => (
                            <div key={poolMatch.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {poolMatch.match.home_team.name} vs {poolMatch.match.away_team.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    ID: {poolMatch.match.id}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(poolMatch.match.match_date).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranking de Participantes */}
                                  {(selectedPool.participants?.length || 0) > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Ranking</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left font-medium text-gray-700">Pos.</th>
                            <th className="text-left font-medium text-gray-700">Participante</th>
                            <th className="text-left font-medium text-gray-700">Pontos</th>
                            <th className="text-left font-medium text-gray-700">Palpites</th>
                            <th className="text-left font-medium text-gray-700">Exatos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPool.participants
                            .sort((a, b) => (b.total_points - a.total_points) || (b.exact_predictions - a.exact_predictions))
                            .map((participant, index) => (
                              <tr key={participant.id} className="border-b">
                                <td className="py-1">{index + 1}º</td>
                                <td className="py-1">{participant.user.name}</td>
                                <td className="py-1 font-medium">{participant.total_points}</td>
                                <td className="py-1">{participant.predictions_count}</td>
                                <td className="py-1">{participant.exact_predictions}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}