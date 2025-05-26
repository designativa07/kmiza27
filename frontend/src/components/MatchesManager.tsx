'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
}

interface Competition {
  id: number
  name: string
}

interface Stadium {
  id: number
  name: string
  city?: string
}

interface Match {
  id: number
  home_team: Team
  away_team: Team
  competition: Competition
  stadium?: Stadium
  match_date: string
  status: string
  home_score?: number
  away_score?: number
  broadcast_channels?: any
  streaming_links?: any
  round?: { id: number; name: string }
  group_name?: string
  phase?: string
}

export default function MatchesManager() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [paginatedMatches, setPaginatedMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados dos filtros
  const [filters, setFilters] = useState({
    competition: '',
    round: '',
    phase: '',
    status: ''
  })

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    home_team_id: '',
    away_team_id: '',
    competition_id: '',
    round_id: '',
    group_name: '',
    phase: '',
    match_date: '',
    status: 'scheduled',
    broadcast_channels: ''
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [matches, filters])

  useEffect(() => {
    applyPagination()
  }, [filteredMatches, currentPage, itemsPerPage])

  const fetchData = async () => {
    try {
      console.log('🔄 Iniciando carregamento de dados...')
      
      const [matchesRes, teamsRes, competitionsRes] = await Promise.all([
        fetch(API_ENDPOINTS.matches.list()),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.competitions.list())
      ])
      
      console.log('📊 Status das requisições:', {
        matches: matchesRes.status,
        teams: teamsRes.status,
        competitions: competitionsRes.status
      })
      
      if (!matchesRes.ok) {
        throw new Error(`Erro ao carregar jogos: ${matchesRes.status}`)
      }
      
      if (!teamsRes.ok) {
        throw new Error(`Erro ao carregar times: ${teamsRes.status}`)
      }
      
      if (!competitionsRes.ok) {
        throw new Error(`Erro ao carregar competições: ${competitionsRes.status}`)
      }
      
      const matchesData = await matchesRes.json()
      const teamsData = await teamsRes.json()
      const competitionsData = await competitionsRes.json()
      
      console.log('✅ Dados carregados:', {
        jogos: matchesData.length,
        times: teamsData.length,
        competições: competitionsData.length
      })
      
      setMatches(matchesData)
      setTeams(teamsData)
      setCompetitions(competitionsData)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      alert(`Erro ao carregar dados: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...matches]

    if (filters.competition) {
      filtered = filtered.filter(match => match.competition.id.toString() === filters.competition)
    }

    if (filters.round) {
      filtered = filtered.filter(match => 
        match.round?.name?.toLowerCase().includes(filters.round.toLowerCase()) ||
        match.group_name?.toLowerCase().includes(filters.round.toLowerCase())
      )
    }

    if (filters.phase) {
      filtered = filtered.filter(match => 
        match.phase?.toLowerCase().includes(filters.phase.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter(match => match.status === filters.status)
    }

    setFilteredMatches(filtered)
    setCurrentPage(1) // Reset para primeira página quando filtrar
  }

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedMatches(filteredMatches.slice(startIndex, endIndex))
  }

  const totalPages = Math.ceil(filteredMatches.length / itemsPerPage)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const clearFilters = () => {
    setFilters({
      competition: '',
      round: '',
      phase: '',
      status: ''
    })
  }

  const getUniqueRounds = () => {
    const rounds = new Set<string>()
    matches.forEach(match => {
      if (match.round?.name) rounds.add(match.round.name)
      if (match.group_name) rounds.add(match.group_name)
    })
    return Array.from(rounds).sort()
  }

  const getUniquePhases = () => {
    const phases = new Set<string>()
    matches.forEach(match => {
      if (match.phase) phases.add(match.phase)
    })
    return Array.from(phases).sort()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingMatch 
        ? `API_ENDPOINTS.matches.list()/${editingMatch.id}`
        : API_ENDPOINTS.matches.list()
      
      const method = editingMatch ? 'PATCH' : 'POST'
      
      const payload = {
        home_team_id: parseInt(formData.home_team_id),
        away_team_id: parseInt(formData.away_team_id),
        competition_id: parseInt(formData.competition_id),
        round_id: formData.round_id ? parseInt(formData.round_id) : undefined,
        group_name: formData.group_name || undefined,
        phase: formData.phase || undefined,
        match_date: new Date(formData.match_date).toISOString(),
        status: formData.status,
        broadcast_channels: formData.broadcast_channels ? 
          formData.broadcast_channels.split(',').map(s => s.trim()) : []
      }
      
      console.log('🔍 Frontend - Enviando payload:', payload);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log('✅ Frontend - Resposta OK');
        fetchData()
        setShowModal(false)
        setEditingMatch(null)
        resetForm()
      } else {
        const errorText = await response.text();
        console.error('❌ Frontend - Erro na resposta:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Frontend - Erro ao salvar jogo:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      home_team_id: '',
      away_team_id: '',
      competition_id: '',
      round_id: '',
      group_name: '',
      phase: '',
      match_date: '',
      status: 'scheduled',
      broadcast_channels: ''
    })
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    
    const processBroadcastChannels = (channels: any): string => {
      if (!channels) return '';
      
      if (typeof channels === 'string') {
        return channels;
      }
      
      if (Array.isArray(channels)) {
        return channels.join(', ');
      }
      
      if (typeof channels === 'object') {
        const allChannels: string[] = [];
        Object.values(channels).forEach((channelList: any) => {
          if (Array.isArray(channelList)) {
            allChannels.push(...channelList);
          }
        });
        return allChannels.join(', ');
      }
      
      return '';
    };
    

    
    setFormData({
      home_team_id: match.home_team.id.toString(),
      away_team_id: match.away_team.id.toString(),
      competition_id: match.competition.id.toString(),
      round_id: match.round?.id?.toString() || '',
      group_name: match.group_name || '',
      phase: match.phase || '',
      match_date: new Date(match.match_date).toISOString().slice(0, 16),
      status: match.status,
      broadcast_channels: processBroadcastChannels(match.broadcast_channels)
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      try {
        await fetch(`API_ENDPOINTS.matches.list()/${id}`, {
          method: 'DELETE',
        })
        fetchData()
      } catch (error) {
        console.error('Erro ao excluir jogo:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Agendado' },
      live: { color: 'bg-green-100 text-green-800', text: 'Ao Vivo' },
      finished: { color: 'bg-gray-100 text-gray-800', text: 'Finalizado' },
      postponed: { color: 'bg-yellow-100 text-yellow-800', text: 'Adiado' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.scheduled
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const TeamLogo = ({ team }: { team: Team }) => {
    if (!team.logo_url) {
      return (
        <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{team.short_name?.substring(0, 3) || team.name.substring(0, 3)}</span>
        </div>
      )
    }

    return (
      <img 
        className="h-6 w-6 rounded-md object-cover" 
        src={imageUrl(team.logo_url)} 
        alt={`Escudo ${team.name}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          target.nextElementSibling?.classList.remove('hidden')
        }}
      />
    )
  }

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1)
          pages.push('...')
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(totalPages)
        }
      }
      
      return pages
    }

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
              {' '}até{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredMatches.length)}
              </span>
              {' '}de{' '}
              <span className="font-medium">{filteredMatches.length}</span>
              {' '}resultados
            </p>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Itens por página:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* Botão Primeira Página */}
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Primeira página"
              >
                <span className="sr-only">Primeira página</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Botão Anterior */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página anterior"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {/* Números das páginas */}
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
                  disabled={page === '...'}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : page === '...'
                      ? 'text-gray-700 ring-1 ring-inset ring-gray-300 cursor-default'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {/* Botão Próximo */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Próxima página"
              >
                <span className="sr-only">Próximo</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {/* Botão Última Página */}
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Última página"
              >
                <span className="sr-only">Última página</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center">Carregando jogos...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Jogos</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os jogos e partidas do sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filtros
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Jogo
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Competição</label>
              <select
                value={filters.competition}
                onChange={(e) => setFilters({ ...filters, competition: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm form-input-sm"
              >
                <option value="">Todas</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rodada/Grupo</label>
              <select
                value={filters.round}
                onChange={(e) => setFilters({ ...filters, round: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm form-input-sm"
              >
                <option value="">Todas</option>
                {getUniqueRounds().map((round) => (
                  <option key={round} value={round}>{round}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fase</label>
              <select
                value={filters.phase}
                onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm form-input-sm"
              >
                <option value="">Todas</option>
                {getUniquePhases().map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm form-input-sm"
              >
                <option value="">Todos</option>
                <option value="scheduled">Agendado</option>
                <option value="live">Ao Vivo</option>
                <option value="finished">Finalizado</option>
                <option value="postponed">Adiado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredMatches.length} jogos encontrados
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-white dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Competição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          {/* Time da casa */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{match.home_team.name}</span>
                            <TeamLogo team={match.home_team} />
                          </div>
                          
                          {/* Placar da casa */}
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              {match.status === 'finished' && match.home_score !== undefined ? match.home_score : '-'}
                            </span>
                            
                            {/* VS */}
                            <span className="text-lg font-bold text-gray-400">×</span>
                            
                            {/* Placar visitante */}
                            <span className="text-lg font-bold text-gray-900">
                              {match.status === 'finished' && match.away_score !== undefined ? match.away_score : '-'}
                            </span>
                          </div>
                          
                          {/* Time visitante */}
                          <div className="flex items-center space-x-2">
                            <TeamLogo team={match.away_team} />
                            <span className="text-sm font-medium text-gray-900">{match.away_team.name}</span>
                          </div>
                        </div>
                        
                        {match.stadium?.name && (
                          <div className="text-center text-xs text-gray-700 mt-1">
                            {match.stadium.name}{match.stadium.city ? ` - ${match.stadium.city}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(match.match_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {match.competition.name}
                          {(match.round?.name || match.group_name) && (
                            <div className="text-xs text-gray-700">
                              {match.round?.name || match.group_name}
                            </div>
                          )}
                          {match.phase && (
                            <div className="text-xs text-gray-700">
                              {match.phase}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        {getStatusBadge(match.status)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(match)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Paginação */}
              {totalPages > 1 && <PaginationControls />}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMatch ? 'Editar Jogo' : 'Adicionar Jogo'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Time da Casa</label>
                    <select
                      required
                      value={formData.home_team_id}
                      onChange={(e) => setFormData({ ...formData, home_team_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    >
                      <option value="">Selecione...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Time Visitante</label>
                    <select
                      required
                      value={formData.away_team_id}
                      onChange={(e) => setFormData({ ...formData, away_team_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    >
                      <option value="">Selecione...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Competição</label>
                  <select
                    required
                    value={formData.competition_id}
                    onChange={(e) => setFormData({ ...formData, competition_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  >
                    <option value="">Selecione...</option>
                    {competitions.map((comp) => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Rodada</label>
                    <input
                      type="text"
                      value={formData.round_id}
                      onChange={(e) => setFormData({ ...formData, round_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Ex: 1, 2, 3..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Grupo</label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Ex: A, B, C..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Fase</label>
                    <input
                      type="text"
                      value={formData.phase}
                      onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Ex: Grupos, Oitavas..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Data e Hora</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.match_date}
                      onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    >
                      <option value="scheduled">Agendado</option>
                      <option value="live">Ao Vivo</option>
                      <option value="finished">Finalizado</option>
                      <option value="postponed">Adiado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Canais de TV (separados por vírgula)</label>
                  <input
                    type="text"
                    value={formData.broadcast_channels}
                    onChange={(e) => setFormData({ ...formData, broadcast_channels: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="Ex: Globo, SporTV, ESPN"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingMatch(null)
                      resetForm()
                    }}
                    className="rounded-md border border-gray-300 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
                  >
                    {editingMatch ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 