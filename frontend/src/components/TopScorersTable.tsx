'use client'

import React, { useState, useEffect } from 'react'
import { FunnelIcon, TrophyIcon, UserIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import TopScorersChart from './TopScorersChart'
import { getPlayerImageUrl, getTeamLogoUrl, handleImageError } from '../lib/cdn'

interface Player {
  id: number
  name: string
  position?: string
  image_url?: string
  jersey_number?: number
}

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
}

interface Competition {
  id: number
  name: string
  season?: string
}

interface PlayerStats {
  player: Player
  team: Team
  goals: number
  matches_played: number
  assists?: number
  yellow_cards?: number
  red_cards?: number
  goals_per_match: number
  competition?: Competition
}

interface TopScorersFilters {
  competition_id: string
  season: string
  team_id: string
  position: string
}

export default function TopScorersTable() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [filteredStats, setFilteredStats] = useState<PlayerStats[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<TopScorersFilters>({
    competition_id: '',
    season: '',
    team_id: '',
    position: ''
  })

  const positions = [
    'Goleiro',
    'Zagueiro',
    'Lateral',
    'Volante',
    'Meio-campo',
    'Atacante'
  ]

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, playerStats])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Buscar dados básicos e artilheiros em paralelo
      const [competitionsRes, teamsRes, topScorersRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.competitions.list()}?active=true`),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.matches.topScorers())
      ])

      // Verificar se as respostas são válidas
      if (!competitionsRes.ok) {
        throw new Error(`Erro ao buscar competições: ${competitionsRes.status}`)
      }
      if (!teamsRes.ok) {
        throw new Error(`Erro ao buscar times: ${teamsRes.status}`)
      }
      if (!topScorersRes.ok) {
        throw new Error(`Erro ao buscar artilheiros: ${topScorersRes.status}`)
      }

      const [competitionsData, teamsData, topScorersData] = await Promise.all([
        competitionsRes.json(),
        teamsRes.json(),
        topScorersRes.json()
      ])

      setCompetitions(competitionsData)
      setTeams(teamsData)
      setPlayerStats(topScorersData)

      // Extrair temporadas das competições
      const uniqueSeasons = [...new Set(competitionsData
        .map((comp: Competition) => comp.season)
        .filter(Boolean)
      )] as string[]
      
      setSeasons(uniqueSeasons.sort().reverse())

      console.log(`✅ Dados carregados: ${topScorersData.length} artilheiros encontrados`)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setPlayerStats([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    // Verificar se playerStats é um array válido antes de fazer spread
    if (!Array.isArray(playerStats)) {
      console.warn('playerStats não é um array válido:', playerStats)
      setFilteredStats([])
      return
    }

    let filtered = [...playerStats]

    if (filters.competition_id) {
      filtered = filtered.filter(stat => 
        stat.competition?.id.toString() === filters.competition_id
      )
    }

    if (filters.season) {
      filtered = filtered.filter(stat => 
        stat.competition?.season === filters.season
      )
    }

    if (filters.team_id) {
      filtered = filtered.filter(stat => 
        stat.team.id.toString() === filters.team_id
      )
    }

    if (filters.position) {
      filtered = filtered.filter(stat => 
        stat.player.position === filters.position
      )
    }

    setFilteredStats(filtered)
  }

  const clearFilters = () => {
    setFilters({
      competition_id: '',
      season: '',
      team_id: '',
      position: ''
    })
  }

  const PlayerPhoto = ({ player }: { player: Player }) => {
    if (!player.image_url) {
      return (
        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
          <UserIcon className="h-6 w-6 text-gray-400" />
        </div>
      )
    }

    return (
      <img 
        className="h-12 w-12 rounded-full object-cover" 
        src={getPlayerImageUrl(player.image_url)}
        alt={player.name}
        onError={handleImageError}
      />
    )
  }

  const TeamLogo = ({ team }: { team: Team }) => {
    if (!team.logo_url) {
      return (
        <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">
            {team.short_name?.substring(0, 3) || team.name?.substring(0, 3) || '?'}
          </span>
        </div>
      )
    }

    return (
      <img 
        className="h-6 w-6 rounded-md object-contain" 
        src={getTeamLogoUrl(team.logo_url)}
        alt={team.name}
        onError={handleImageError}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 flex items-center">
            <TrophyIcon className="h-6 w-6 mr-2 text-yellow-500" />
            Artilharia
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Ranking dos maiores artilheiros por competição e temporada.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FunnelIcon className="h-4 w-4 mr-1" />
            Filtros
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
                value={filters.competition_id}
                onChange={(e) => setFilters({ ...filters, competition_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                aria-label="Filtrar por competição"
              >
                <option value="">Todas</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporada</label>
              <select
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                aria-label="Filtrar por temporada"
              >
                <option value="">Todas</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                value={filters.team_id}
                onChange={(e) => setFilters({ ...filters, team_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                aria-label="Filtrar por time"
              >
                <option value="">Todos</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
              <select
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                aria-label="Filtrar por posição"
              >
                <option value="">Todas</option>
                {positions.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

              {/* Gráfico de artilheiros */}
        {filteredStats.length > 0 && (
          <div className="mt-6">
            <TopScorersChart playerStats={filteredStats} maxPlayers={10} />
          </div>
        )}

      {/* Tabela de artilheiros */}
      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Top {filteredStats.length} Artilheiros
            </h2>
          </div>
        </div>
        
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        POS.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JOGADOR
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TIME
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GOLS
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        JOGOS
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MÉDIA
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        CARTÕES
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Nenhum artilheiro encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredStats.map((stat, index) => (
                        <tr key={`${stat.player.id}-${stat.competition?.id || 'no-comp'}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <PlayerPhoto player={stat.player} />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {stat.player.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {stat.player.position && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                      {stat.player.position}
                                    </span>
                                  )}
                                  {stat.player.jersey_number && (
                                    <span className="text-gray-400">#{stat.player.jersey_number}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TeamLogo team={stat.team} />
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {stat.team.short_name || stat.team.name}
                                </div>
                                {stat.competition && (
                                  <div className="text-xs text-gray-500">
                                    {stat.competition.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                              {stat.goals}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {stat.matches_played}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                            {stat.goals_per_match.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {(stat.yellow_cards || 0) > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {stat.yellow_cards} 🟨
                                </span>
                              )}
                              {(stat.red_cards || 0) > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  {stat.red_cards} 🟥
                                </span>
                              )}
                              {!(stat.yellow_cards || 0) && !(stat.red_cards || 0) && (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      {filteredStats.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Artilheiro
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredStats[0]?.player.name} ({filteredStats[0]?.goals} gols)
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Artilheiros
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredStats.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚽</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Gols
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredStats.reduce((sum, stat) => sum + stat.goals, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Média Geral
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {filteredStats.length > 0 
                        ? (filteredStats.reduce((sum, stat) => sum + stat.goals_per_match, 0) / filteredStats.length).toFixed(2)
                        : '0.00'
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 