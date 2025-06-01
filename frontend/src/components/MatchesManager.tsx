'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'
import { Combobox } from '@headlessui/react'

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
  channel_ids?: number[]
  streaming_links?: any
  round?: { id: number; name: string }
  group_name?: string
  phase?: string
}

interface Channel {
  id: number
  name: string
}

// Componente para seleção múltipla de canais
function ChannelMultiSelect({ 
  channels, 
  selectedIds, 
  onChange, 
  label 
}: { 
  channels: Channel[], 
  selectedIds: number[], 
  onChange: (ids: number[]) => void, 
  label: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const toggleChannel = (channelId: number) => {
    if (selectedIds.includes(channelId)) {
      onChange(selectedIds.filter(id => id !== channelId))
    } else {
      onChange([...selectedIds, channelId])
    }
  }
  
  const getSelectedChannelNames = () => {
    return channels
      .filter(channel => selectedIds.includes(channel.id))
      .map(channel => channel.name)
      .join(', ')
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {selectedIds.length === 0 
          ? 'Selecione os canais...' 
          : `${selectedIds.length} canais selecionados`
        }
        <span className="float-right">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {channels.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Nenhum canal disponível</div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 border-b">
                {getSelectedChannelNames() || 'Nenhum canal selecionado'}
              </div>
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleChannel(channel.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{channel.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Componente auxiliar para autocomplete de times
function TeamAutocomplete({ teams, value, onChange, label }: { teams: Team[], value: string, onChange: (id: string) => void, label: string }) {
  const [query, setQuery] = useState('')
  const filteredTeams = query === '' ? teams : teams.filter(team => team.name.toLowerCase().includes(query.toLowerCase()))
  const selectedTeam = teams.find(team => team.id.toString() === value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <Combobox value={selectedTeam} onChange={(team: Team) => onChange(team.id.toString())}>
        <div className="relative mt-1">
          <Combobox.Input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
            displayValue={(team: Team) => team?.name || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Digite para buscar..."
          />
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredTeams.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nenhum time encontrado
              </div>
            ) : (
              filteredTeams.map((team: Team) => (
                <Combobox.Option
                  key={team.id}
                  value={team}
                  className={({ active }: { active: boolean }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                >
                  {team.name}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  )
}

export default function MatchesManager() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [paginatedMatches, setPaginatedMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
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
    broadcast_channels: '',
    channel_ids: [] as number[],
    home_score: undefined as number | undefined,
    away_score: undefined as number | undefined,
    home_yellow_cards: undefined as number | undefined,
    away_yellow_cards: undefined as number | undefined,
    home_red_cards: undefined as number | undefined,
    away_red_cards: undefined as number | undefined
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
      setLoading(true)
      
      // Buscar dados em paralelo
      const [matchesRes, teamsRes, competitionsRes, roundsRes, channelsRes] = await Promise.all([
        fetch(API_ENDPOINTS.matches.list(), {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.competitions.list()),
        fetch('/rounds'),
        fetch(API_ENDPOINTS.channels.list())
      ])

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        setMatches(matchesData)
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }

      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json()
        setCompetitions(competitionsData)
      }

      if (roundsRes.ok) {
        const roundsData = await roundsRes.json()
        // setRounds(roundsData) // Removido - não está sendo usado
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json()
        setChannels(channelsData)
      }

    } catch (error) {
      console.error('❌ fetchData - Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    console.log('🔍 Debug - Aplicando filtros:', filters)
    console.log('🔍 Debug - Total de matches antes do filtro:', matches.length)
    
    let filtered = [...matches]

    if (filters.competition) {
      const beforeCount = filtered.length
      filtered = filtered.filter(match => match.competition.id.toString() === filters.competition)
      console.log(`🔍 Debug - Filtro competição: ${beforeCount} -> ${filtered.length}`)
    }

    if (filters.round) {
      const beforeCount = filtered.length
      console.log('🔍 Debug - Filtro rodada aplicado:', filters.round)
      console.log('🔍 Debug - Matches antes do filtro de rodada:', 
        filtered.map((m: Match) => ({ id: m.id, round: m.round?.name, group: m.group_name }))
      )
      
      filtered = filtered.filter(match => 
        match.round?.name === filters.round ||
        match.group_name === filters.round
      )
      console.log(`🔍 Debug - Filtro rodada: ${beforeCount} -> ${filtered.length}`)
      console.log('🔍 Debug - Matches após filtro de rodada:', 
        filtered.map((m: Match) => ({ id: m.id, round: m.round?.name, group: m.group_name }))
      )
    }

    if (filters.phase) {
      const beforeCount = filtered.length
      filtered = filtered.filter(match => 
        match.phase?.toLowerCase().includes(filters.phase.toLowerCase())
      )
      console.log(`🔍 Debug - Filtro fase: ${beforeCount} -> ${filtered.length}`)
    }

    if (filters.status) {
      const beforeCount = filtered.length
      filtered = filtered.filter(match => match.status === filters.status)
      console.log(`🔍 Debug - Filtro status: ${beforeCount} -> ${filtered.length}`)
    }

    console.log('🔍 Debug - Total de matches após todos os filtros:', filtered.length)
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
    console.log('🔍 Debug - getUniqueRounds - Total de matches:', matches.length)
    
    const rounds = new Set<string>()
    matches.forEach(match => {
      // Apenas adicionar rodadas que são números ou começam com "Rodada"
      if (match.round?.name) {
        const roundName = match.round.name
        console.log('🔍 Debug - Verificando round:', roundName)
        // Verificar se é uma rodada numérica ou contém "Rodada" (case insensitive)
        if (/^\d+$/.test(roundName) || /rodada/i.test(roundName)) {
          console.log('✅ Debug - Round aceita:', roundName)
          rounds.add(roundName)
        } else {
          console.log('❌ Debug - Round rejeitada:', roundName)
        }
      }
      // Adicionar group_name apenas se não for uma fase
      if (match.group_name) {
        const groupName = match.group_name
        console.log('🔍 Debug - Verificando group_name:', groupName)
        // Verificar se não é uma fase (não contém palavras como "final", "semi", "oitavas", etc.)
        const phaseKeywords = ['final', 'semi', 'oitavas', 'quartas', 'fase', 'eliminatória']
        const isPhase = phaseKeywords.some(keyword => 
          groupName.toLowerCase().includes(keyword)
        )
        if (!isPhase) {
          console.log('✅ Debug - Group aceito:', groupName)
          rounds.add(groupName)
        } else {
          console.log('❌ Debug - Group rejeitado (é fase):', groupName)
        }
      }
    })
    
    const sortedRounds = Array.from(rounds).sort((a, b) => {
      // Ordenar numericamente se ambos forem números
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      // Caso contrário, ordenar alfabeticamente
      return a.localeCompare(b)
    })
    
    console.log('🔍 Debug - Rounds finais encontradas:', sortedRounds)
    return sortedRounds
  }

  const getUniquePhases = () => {
    const phases = new Set<string>()
    matches.forEach(match => {
      // Adicionar phase se existir
      if (match.phase) {
        phases.add(match.phase)
      }
      // Adicionar group_name se for uma fase (contém palavras-chave de fase)
      if (match.group_name) {
        const groupName = match.group_name
        const phaseKeywords = ['final', 'semi', 'oitavas', 'quartas', 'fase', 'eliminatória', 'playoff']
        const isPhase = phaseKeywords.some(keyword => 
          groupName.toLowerCase().includes(keyword)
        )
        if (isPhase) {
          phases.add(groupName)
        }
      }
    })
    return Array.from(phases).sort()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingMatch 
        ? `${API_ENDPOINTS.matches.list()}/${editingMatch.id}`
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
          formData.broadcast_channels.split(',').map(s => s.trim()) : [],
        channel_ids: formData.channel_ids,
        home_score: formData.home_score,
        away_score: formData.away_score,
        home_yellow_cards: formData.home_yellow_cards,
        away_yellow_cards: formData.away_yellow_cards,
        home_red_cards: formData.home_red_cards,
        away_red_cards: formData.away_red_cards
      }
      
      console.log('🔍 Frontend - Enviando payload:', payload);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log('✅ Frontend - Resposta OK');
        
        // Fechar modal e resetar form primeiro
        setShowModal(false)
        setEditingMatch(null)
        resetForm()
        
        // Aguardar um pouco para garantir que a transação foi commitada no banco
        setTimeout(() => {
          console.log('🔄 Recarregando dados após atualização...');
          fetchData()
        }, 500) // 500ms de delay
        
      } else {
        const errorText = await response.text();
        console.error('❌ Frontend - Erro na resposta:', response.status, errorText);
        alert(`Erro ao salvar: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('❌ Frontend - Erro ao salvar jogo:', error)
      alert('Erro ao salvar jogo. Tente novamente.')
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
      broadcast_channels: '',
      channel_ids: [],
      home_score: undefined as number | undefined,
      away_score: undefined as number | undefined,
      home_yellow_cards: undefined as number | undefined,
      away_yellow_cards: undefined as number | undefined,
      home_red_cards: undefined as number | undefined,
      away_red_cards: undefined as number | undefined
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
    
    // Converter data para formato datetime-local sem alterar timezone
    // Remove o 'Z' e os milissegundos para usar no campo datetime-local
    const formattedDate = match.match_date.replace('Z', '').replace(/\.\d{3}$/, '');
    
    const newFormData = {
      home_team_id: match.home_team.id.toString(),
      away_team_id: match.away_team.id.toString(),
      competition_id: match.competition.id.toString(),
      round_id: match.round?.id?.toString() || '',
      group_name: match.group_name || '',
      phase: match.phase || '',
      match_date: formattedDate,
      status: match.status,
      broadcast_channels: processBroadcastChannels(match.broadcast_channels),
      channel_ids: match.channel_ids || [],
      home_score: match.home_score,
      away_score: match.away_score,
      home_yellow_cards: (match as any).home_yellow_cards,
      away_yellow_cards: (match as any).away_yellow_cards,
      home_red_cards: (match as any).home_red_cards,
      away_red_cards: (match as any).away_red_cards
    };
    
    setFormData(newFormData);
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      try {
        await fetch(`${API_ENDPOINTS.matches.list()}/${id}`, {
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
            onClick={() => {
              setLoading(true)
              fetchData()
            }}
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            title="Atualizar dados"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
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
                              {match.home_score !== undefined && match.home_score !== null ? match.home_score : '-'}
                            </span>
                            
                            {/* VS */}
                            <span className="text-lg font-bold text-gray-400">×</span>
                            
                            {/* Placar visitante */}
                            <span className="text-lg font-bold text-gray-900">
                              {match.away_score !== undefined && match.away_score !== null ? match.away_score : '-'}
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
                    <TeamAutocomplete teams={teams} value={formData.home_team_id} onChange={(id) => setFormData({ ...formData, home_team_id: id })} label="Time da Casa" />
                  </div>
                  <div>
                    <TeamAutocomplete teams={teams} value={formData.away_team_id} onChange={(id) => setFormData({ ...formData, away_team_id: id })} label="Time Visitante" />
                  </div>
                </div>
                {/* Campos de placar */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Placar Casa</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.home_score ?? ''}
                      onChange={(e) => setFormData({ ...formData, home_score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Gols do time da casa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Placar Visitante</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.away_score ?? ''}
                      onChange={(e) => setFormData({ ...formData, away_score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Gols do time visitante"
                    />
                  </div>
                </div>
                
                {/* Campos de cartões */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Cartões Amarelos Casa</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.home_yellow_cards ?? ''}
                      onChange={(e) => setFormData({ ...formData, home_yellow_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Cartões Vermelhos Casa</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.home_red_cards ?? ''}
                      onChange={(e) => setFormData({ ...formData, home_red_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Cartões Amarelos Visitante</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.away_yellow_cards ?? ''}
                      onChange={(e) => setFormData({ ...formData, away_yellow_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Cartões Vermelhos Visitante</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.away_red_cards ?? ''}
                      onChange={(e) => setFormData({ ...formData, away_red_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="0"
                    />
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
                  <ChannelMultiSelect
                    channels={channels}
                    selectedIds={formData.channel_ids}
                    onChange={(ids) => setFormData({ ...formData, channel_ids: ids })}
                    label="Canais de Transmissão"
                  />
                </div>
                
                {/* Campo para canais em texto (compatibilidade) */}
                <div>
                  <label className="block text-sm font-medium text-gray-900">Canais Adicionais (texto)</label>
                  <input
                    type="text"
                    value={formData.broadcast_channels}
                    onChange={(e) => setFormData({ ...formData, broadcast_channels: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="Ex: Outros canais não cadastrados"
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