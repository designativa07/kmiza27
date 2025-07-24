'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { getTeamLogoUrl, handleImageError } from '../lib/cdn'

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
  city?: string
  state?: string
}

interface Competition {
  id: number
  name: string
  type: string
}

interface CompetitionTeam {
  id: number
  team: Team
  competition: Competition
  group_name?: string
  position?: number
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
}

interface CompetitionTeamsManagerProps {
  competitionId: number
  onClose: () => void
}

export default function CompetitionTeamsManager({ competitionId, onClose }: CompetitionTeamsManagerProps) {
  const [competitionTeams, setCompetitionTeams] = useState<CompetitionTeam[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [filteredAvailableTeams, setFilteredAvailableTeams] = useState<Team[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [groupName, setGroupName] = useState('')
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [competitionId])

  // Effect para filtrar os times disponíveis
  useEffect(() => {
    const availableTeamsForSelection = getAvailableTeamsForSelection()
    let filtered = availableTeamsForSelection

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(query) ||
        team.short_name.toLowerCase().includes(query) ||
        (team.city && team.city.toLowerCase().includes(query)) ||
        (team.state && team.state.toLowerCase().includes(query))
      )
    }

    // Filtro por estado
    if (stateFilter) {
      filtered = filtered.filter(team => team.state === stateFilter)
    }

    setFilteredAvailableTeams(filtered)
  }, [availableTeams, competitionTeams, searchQuery, stateFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [competitionRes, teamsRes, competitionTeamsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.competitions.list()}/${competitionId}`),
        fetch(`${API_ENDPOINTS.teams.list()}?limit=1000`),
        fetch(`${API_ENDPOINTS.competitions.list()}/${competitionId}/teams`)
      ])

      if (competitionRes.ok) {
        const competitionData = await competitionRes.json()
        setCompetition(competitionData)
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setAvailableTeams(teamsData.data || [])
      }

      if (competitionTeamsRes.ok) {
        const competitionTeamsData = await competitionTeamsRes.json()
        setCompetitionTeams(competitionTeamsData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTeams = async () => {
    if (selectedTeams.length === 0) return

    try {
      const response = await fetch(`${API_ENDPOINTS.competitions.list()}/${competitionId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_ids: selectedTeams,
          group_name: groupName || undefined
        }),
      })

      if (response.ok) {
        await fetchData()
        setShowAddModal(false)
        setSelectedTeams([])
        setGroupName('')
        clearFilters()
      } else {
        console.error('Erro ao adicionar times')
      }
    } catch (error) {
      console.error('Erro ao adicionar times:', error)
    }
  }

  const handleRemoveTeam = async (competitionTeamId: number) => {
    if (confirm('Tem certeza que deseja remover este time da competição?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.competitions.list()}/${competitionId}/teams/${competitionTeamId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchData()
        } else {
          console.error('Erro ao remover time')
          alert('Erro ao remover time da competição')
        }
      } catch (error) {
        console.error('Erro ao remover time:', error)
        alert('Erro ao remover time da competição')
      }
    }
  }

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStateFilter('')
  }

  const closeModal = () => {
    setShowAddModal(false)
    setSelectedTeams([])
    setGroupName('')
    clearFilters()
  }

  const getAvailableTeamsForSelection = () => {
    const usedTeamIds = competitionTeams.map(ct => ct.team.id)
    return availableTeams.filter(team => !usedTeamIds.includes(team.id))
  }

  const getUniqueGroups = () => {
    const groups = new Set<string>()
    competitionTeams.forEach(ct => {
      if (ct.group_name) groups.add(ct.group_name)
    })
    return Array.from(groups).sort()
  }

  const getUniqueStates = () => {
    const availableTeamsForSelection = getAvailableTeamsForSelection()
    const states = new Set<string>()
    availableTeamsForSelection.forEach(team => {
      if (team.state) states.add(team.state)
    })
    return Array.from(states).sort()
  }

  // Componente TeamLogo
  const TeamLogo = ({ team }: { team: Team }) => {
    if (!team.logo_url) {
      return (
        <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{team.short_name?.substring(0, 3) || team.name?.substring(0, 3) || 'TM'}</span>
        </div>
      )
    }

    return (
      <img 
        className="h-8 w-8 rounded-md object-contain" 
        src={getTeamLogoUrl(team.logo_url)}
        alt={team.name}
        onError={handleImageError}
      />
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-medium text-gray-900">
              Times da Competição
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {competition?.name} - {competitionTeams.length} times participantes
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar Times
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Grupos */}
        {getUniqueGroups().length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Por Grupos</h4>
            {getUniqueGroups().map(group => (
              <div key={group} className="mb-4">
                <h5 className="text-md font-medium text-gray-700 mb-2">Grupo {group}</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {competitionTeams
                      .filter(ct => ct.group_name === group)
                      .map((competitionTeam) => (
                        <div key={competitionTeam.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                          <div className="flex items-center space-x-3">
                            <TeamLogo team={competitionTeam.team} />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{competitionTeam.team.name}</p>
                              <p className="text-xs text-gray-500">
                                {competitionTeam.points} pts • {competitionTeam.played} jogos
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTeam(competitionTeam.id)}
                            className="text-red-600 hover:text-red-900"
                            aria-label={`Remover ${competitionTeam.team.name} da competição`}
                            title={`Remover ${competitionTeam.team.name} da competição`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Times sem grupo */}
        {competitionTeams.filter(ct => !ct.group_name).length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Times Participantes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitionTeams
                .filter(ct => !ct.group_name)
                .map((competitionTeam) => (
                  <div key={competitionTeam.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-3">
                      <TeamLogo team={competitionTeam.team} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{competitionTeam.team.name}</p>
                        <p className="text-xs text-gray-500">
                          {competitionTeam.points} pts • {competitionTeam.played} jogos
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveTeam(competitionTeam.id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label={`Remover ${competitionTeam.team.name} da competição`}
                      title={`Remover ${competitionTeam.team.name} da competição`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {competitionTeams.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum time adicionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece adicionando times à esta competição.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Adicionar Times
              </button>
            </div>
          </div>
        )}

        {/* Modal Adicionar Times */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Times</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupo (opcional)
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Ex: A, B, C..."
                />
              </div>

              {/* Filtros de Busca */}
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Buscar Times</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nome, sigla, cidade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        aria-label="Buscar times"
                        title="Buscar times por nome, sigla ou cidade"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <select
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      aria-label="Filtrar por estado"
                      title="Filtrar times por estado"
                    >
                      <option value="">Todos os estados</option>
                      {getUniqueStates().map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Indicadores de filtros ativos */}
                {(searchQuery || stateFilter) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Busca: "{searchQuery}"
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {stateFilter && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Estado: {stateFilter}
                        <button
                          type="button"
                          onClick={() => setStateFilter('')}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Times ({selectedTeams.length} selecionados) - {filteredAvailableTeams.length} encontrados
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredAvailableTeams.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchQuery || stateFilter ? 'Nenhum time encontrado com os filtros aplicados' : 'Nenhum time disponível para adicionar'}
                    </div>
                  ) : (
                    filteredAvailableTeams.map((team) => (
                      <div
                        key={team.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedTeams.includes(team.id) ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                        }`}
                        onClick={() => toggleTeamSelection(team.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => toggleTeamSelection(team.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                        />
                        <TeamLogo team={team} />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{team.name}</p>
                          <p className="text-xs text-gray-500">{team.short_name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTeams}
                  disabled={selectedTeams.length === 0}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar {selectedTeams.length} Time(s)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 