'use client'

import { useState, useEffect } from 'react'
import { TrophyIcon, ChartBarIcon, UsersIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline'
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
  type: string
}

interface StandingEntry {
  position: number
  team: Team
  points: number
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  form: string
  group_name?: string
}

interface HeadToHeadStats {
  team1: Team
  team2: Team
  total_matches: number
  team1_wins: number
  team2_wins: number
  draws: number
  team1_goals: number
  team2_goals: number
  last_matches: any[]
}

interface TeamStats {
  team: Team
  competition: Competition
  overall: {
    points: number
    played: number
    won: number
    drawn: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
  }
  home: any
  away: any
  form: string
  recent_matches: any[]
}

export default function StandingsManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null)
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'standings' | 'stats' | 'h2h'>('standings')
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [headToHead, setHeadToHead] = useState<HeadToHeadStats | null>(null)
  const [h2hTeam1, setH2hTeam1] = useState<number | null>(null)
  const [h2hTeam2, setH2hTeam2] = useState<number | null>(null)
  const [rounds, setRounds] = useState<any[]>([])
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [roundMatches, setRoundMatches] = useState<any[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  useEffect(() => {
    if (selectedCompetition) {
      fetchStandings()
      fetchGroups()
      fetchRounds()
    }
  }, [selectedCompetition, selectedGroup])

  useEffect(() => {
    if (selectedCompetition && selectedRound) {
      fetchRoundMatches()
    }
  }, [selectedCompetition, selectedRound])

  useEffect(() => {
    if (selectedCompetition && selectedTeam) {
      fetchTeamStats()
    }
  }, [selectedCompetition, selectedTeam])

  useEffect(() => {
    if (selectedCompetition && h2hTeam1 && h2hTeam2) {
      fetchHeadToHead()
    }
  }, [selectedCompetition, h2hTeam1, h2hTeam2])

  // Sincronizar índice quando as rodadas mudarem
  useEffect(() => {
    if (rounds.length > 0 && selectedRound) {
      const roundIndex = rounds.findIndex(round => round.id === selectedRound)
      if (roundIndex !== -1 && roundIndex !== currentRoundIndex) {
        console.log(`Sincronizando índice: ${roundIndex} para rodada ID: ${selectedRound}`) // Debug
        setCurrentRoundIndex(roundIndex)
      }
    }
  }, [rounds, selectedRound])

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.competitions.list()')
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data)
        if (data.length > 0) {
          setSelectedCompetition(data[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar competições:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStandings = async () => {
    if (!selectedCompetition) return
    
    try {
      const url = selectedGroup 
        ? API_ENDPOINTS.standings.byCompetition(selectedCompetition, selectedGroup)
        : API_ENDPOINTS.standings.byCompetition(selectedCompetition)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStandings(data)
      }
    } catch (error) {
      console.error('Erro ao carregar classificação:', error)
    }
  }

  const fetchGroups = async () => {
    if (!selectedCompetition) return
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.groups(selectedCompetition))
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  const fetchTeamStats = async () => {
    if (!selectedCompetition || !selectedTeam) return
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.teamStats(selectedCompetition, selectedTeam))
      if (response.ok) {
        const data = await response.json()
        setTeamStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do time:', error)
    }
  }

  const fetchHeadToHead = async () => {
    if (!selectedCompetition || !h2hTeam1 || !h2hTeam2) return
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.headToHead(selectedCompetition, h2hTeam1, h2hTeam2))
      if (response.ok) {
        const data = await response.json()
        setHeadToHead(data)
      }
    } catch (error) {
      console.error('Erro ao carregar confronto direto:', error)
    }
  }

  const fetchRounds = async () => {
    if (!selectedCompetition) return
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.rounds(selectedCompetition))
      if (response.ok) {
        const data = await response.json()
        console.log('Rodadas carregadas:', data) // Debug
        setRounds(data)
        if (data.length > 0) {
          // Sempre começar pela primeira rodada (índice 0)
          setCurrentRoundIndex(0)
          setSelectedRound(data[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rodadas:', error)
    }
  }

  const fetchRoundMatches = async () => {
    if (!selectedCompetition || !selectedRound) return
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.roundMatches(selectedCompetition, selectedRound))
      if (response.ok) {
        const data = await response.json()
        setRoundMatches(data)
      }
    } catch (error) {
      console.error('Erro ao carregar jogos da rodada:', error)
    }
  }

  const getPositionColor = (position: number) => {
    if (position <= 4) return 'text-green-600 bg-green-50'
    if (position <= 6) return 'text-blue-600 bg-blue-50'
    if (position <= 12) return 'text-gray-600 bg-gray-50'
    return 'text-red-600 bg-red-50'
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

  const renderForm = (form: string) => {
    if (!form) return null
    
    return (
      <div className="flex space-x-1">
        {form.split('').slice(-5).map((result, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full text-xs flex items-center justify-center text-white font-bold ${
              result === 'W' ? 'bg-green-500' :
              result === 'D' ? 'bg-yellow-500' :
              result === 'L' ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            {result}
          </div>
        ))}
      </div>
    )
  }

  const groupedStandings = () => {
    if (groups.length === 0) return { '': standings }
    
    const grouped: { [key: string]: StandingEntry[] } = {}
    standings.forEach(entry => {
      const group = entry.group_name || 'Geral'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(entry)
    })
    return grouped
  }

  const availableTeams = () => {
    return standings.map(s => s.team)
  }

  const navigateRound = (direction: 'prev' | 'next') => {
    console.log(`Navegando ${direction}, índice atual: ${currentRoundIndex}, total de rodadas: ${rounds.length}`) // Debug
    
    if (direction === 'prev' && currentRoundIndex > 0) {
      const newIndex = currentRoundIndex - 1
      console.log(`Indo para rodada anterior, novo índice: ${newIndex}, rodada ID: ${rounds[newIndex].id}`) // Debug
      setCurrentRoundIndex(newIndex)
      setSelectedRound(rounds[newIndex].id)
    } else if (direction === 'next' && currentRoundIndex < rounds.length - 1) {
      const newIndex = currentRoundIndex + 1
      console.log(`Indo para próxima rodada, novo índice: ${newIndex}, rodada ID: ${rounds[newIndex].id}`) // Debug
      setCurrentRoundIndex(newIndex)
      setSelectedRound(rounds[newIndex].id)
    } else {
      console.log(`Navegação bloqueada: ${direction}, índice: ${currentRoundIndex}, limites: 0-${rounds.length - 1}`) // Debug
    }
  }

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getMatchStatus = (match: any) => {
    if (match.status === 'finished') {
      return `${match.home_score} - ${match.away_score}`
    } else if (match.status === 'live') {
      return 'AO VIVO'
    } else {
      const { time } = formatMatchDate(match.match_date)
      return time
    }
  }

  const getMatchStatusColor = (status: string) => {
    if (status === 'finished') return 'text-gray-600'
    if (status === 'live') return 'text-red-600 font-bold'
    return 'text-blue-600'
  }

  if (loading) {
    return <div className="text-center">Carregando classificações...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Classificações</h1>
          <p className="mt-2 text-sm text-gray-700">
            Visualize tabelas de classificação, estatísticas e confrontos diretos.
          </p>
        </div>
      </div>

      {/* Seletor de Competição */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Competição</label>
            <select
              value={selectedCompetition || ''}
              onChange={(e) => setSelectedCompetition(Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione uma competição</option>
              {competitions.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>
          
          {groups.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grupo</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Todos os grupos</option>
                {groups.map((group) => (
                  <option key={group} value={group}>Grupo {group}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedCompetition && (
        <>
          {/* Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('standings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'standings'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TrophyIcon className="h-5 w-5 inline mr-2" />
                  Classificação
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ChartBarIcon className="h-5 w-5 inline mr-2" />
                  Estatísticas
                </button>
                <button
                  onClick={() => setActiveTab('h2h')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'h2h'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UsersIcon className="h-5 w-5 inline mr-2" />
                  Confronto Direto
                </button>
              </nav>
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="mt-6">
            {activeTab === 'standings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal - Classificação */}
                <div className="lg:col-span-2">
              <div className="space-y-6">
                {Object.entries(groupedStandings()).map(([groupName, groupStandings]) => (
                  <div key={groupName} className="bg-white shadow rounded-lg overflow-hidden">
                    {groupName && groupName !== '' && (
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                          {groupName === 'Geral' ? 'Classificação Geral' : `Grupo ${groupName}`}
                        </h3>
                      </div>
                    )}
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">J</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GP</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GC</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Últimos 5</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {groupStandings.map((entry) => (
                            <tr key={entry.team.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getPositionColor(entry.position)}`}>
                                  {entry.position}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <TeamLogo team={entry.team} />
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{entry.team.name}</div>
                                    <div className="text-sm text-gray-500">{entry.team.short_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">{entry.points}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{entry.played}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600">{entry.won}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600">{entry.drawn}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">{entry.lost}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{entry.goals_for}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{entry.goals_against}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <span className={entry.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {entry.goal_difference > 0 ? '+' : ''}{entry.goal_difference}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {renderForm(entry.form)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => {
                                    setSelectedTeam(entry.team.id)
                                    setActiveTab('stats')
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Ver estatísticas"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
                </div>

                {/* Coluna Lateral - Jogos */}
                <div className="lg:col-span-1">
                  {rounds.length > 0 && (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      {/* Header com navegação */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => navigateRound('prev')}
                            disabled={currentRoundIndex === 0}
                            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {rounds[currentRoundIndex]?.name || `${rounds[currentRoundIndex]?.round_number || currentRoundIndex + 1}ª RODADA`}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {currentRoundIndex + 1} de {rounds.length}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => navigateRound('next')}
                            disabled={currentRoundIndex === rounds.length - 1}
                            className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Lista de Jogos */}
                      <div className="divide-y divide-gray-200">
                        {roundMatches.map((match, index) => {
                          const { date, time } = formatMatchDate(match.match_date)
                          const status = getMatchStatus(match)
                          
                          return (
                            <div key={match.id} className="p-4">
                              {/* Data e Local */}
                              <div className="text-xs text-gray-500 mb-2 text-center">
                                {match.stadium?.name} • {date} • {match.status === 'finished' ? 'Ontem' : time}
                              </div>
                              
                              {/* Times e Placar - Formato: MANDANTE (ESCUDO) (PLACAR) X (PLACAR) (ESCUDO) VISITANTE */}
                              <div className="flex items-center justify-center space-x-2 py-2">
                                {/* Time Mandante */}
                                <div className="flex items-center space-x-2 flex-1 justify-end">
                                  <span className="text-sm font-medium text-right">{match.home_team.short_name}</span>
                                  <TeamLogo team={match.home_team} />
                                </div>
                                
                                {/* Placar */}
                                <div className="flex items-center space-x-2 px-3">
                                  {match.status === 'finished' ? (
                                    <>
                                      <span className="text-lg font-bold min-w-[20px] text-center">
                                        {match.home_score}
                                      </span>
                                      <span className="text-lg font-bold text-gray-400">X</span>
                                      <span className="text-lg font-bold min-w-[20px] text-center">
                                        {match.away_score}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-lg font-bold text-gray-400">X</span>
                                  )}
                                </div>
                                
                                {/* Time Visitante */}
                                <div className="flex items-center space-x-2 flex-1 justify-start">
                                  <TeamLogo team={match.away_team} />
                                  <span className="text-sm font-medium text-left">{match.away_team.short_name}</span>
                                </div>
                              </div>
                              
                              {/* Status/Horário */}
                              <div className="text-center mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full bg-green-100 ${getMatchStatusColor(match.status)}`}>
                                  {match.status === 'finished' ? 'SAIBA COMO FOI' : 
                                   match.status === 'live' ? 'AO VIVO' : time}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Time</label>
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(Number(e.target.value))}
                    className="block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um time</option>
                    {availableTeams().map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>

                {teamStats && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <TeamLogo team={teamStats.team} />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{teamStats.team.name}</h3>
                        <p className="text-sm text-gray-500">{teamStats.competition.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Estatísticas Gerais */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Geral</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pontos:</span>
                            <span className="text-sm font-medium">{teamStats.overall.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Jogos:</span>
                            <span className="text-sm font-medium">{teamStats.overall.played}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Vitórias:</span>
                            <span className="text-sm font-medium text-green-600">{teamStats.overall.won}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Empates:</span>
                            <span className="text-sm font-medium text-yellow-600">{teamStats.overall.drawn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Derrotas:</span>
                            <span className="text-sm font-medium text-red-600">{teamStats.overall.lost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Saldo de Gols:</span>
                            <span className={`text-sm font-medium ${teamStats.overall.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {teamStats.overall.goal_difference > 0 ? '+' : ''}{teamStats.overall.goal_difference}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas Casa */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Em Casa</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pontos:</span>
                            <span className="text-sm font-medium">{teamStats.home.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Jogos:</span>
                            <span className="text-sm font-medium">{teamStats.home.played}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Vitórias:</span>
                            <span className="text-sm font-medium text-green-600">{teamStats.home.won}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Empates:</span>
                            <span className="text-sm font-medium text-yellow-600">{teamStats.home.drawn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Derrotas:</span>
                            <span className="text-sm font-medium text-red-600">{teamStats.home.lost}</span>
                          </div>
                        </div>
                      </div>

                      {/* Estatísticas Visitante */}
                      <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Visitante</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pontos:</span>
                            <span className="text-sm font-medium">{teamStats.away.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Jogos:</span>
                            <span className="text-sm font-medium">{teamStats.away.played}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Vitórias:</span>
                            <span className="text-sm font-medium text-green-600">{teamStats.away.won}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Empates:</span>
                            <span className="text-sm font-medium text-yellow-600">{teamStats.away.drawn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Derrotas:</span>
                            <span className="text-sm font-medium text-red-600">{teamStats.away.lost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'h2h' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time 1</label>
                    <select
                      value={h2hTeam1 || ''}
                      onChange={(e) => setH2hTeam1(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Selecione o primeiro time</option>
                      {availableTeams().map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time 2</label>
                    <select
                      value={h2hTeam2 || ''}
                      onChange={(e) => setH2hTeam2(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Selecione o segundo time</option>
                      {availableTeams().filter(team => team.id !== h2hTeam1).map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {headToHead && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-8">
                        <div className="text-center">
                          <TeamLogo team={headToHead.team1} />
                          <p className="mt-2 text-sm font-medium">{headToHead.team1.name}</p>
                        </div>
                        <div className="text-2xl font-bold text-gray-400">VS</div>
                        <div className="text-center">
                          <TeamLogo team={headToHead.team2} />
                          <p className="mt-2 text-sm font-medium">{headToHead.team2.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{headToHead.team1_wins}</div>
                        <div className="text-sm text-gray-600">Vitórias {headToHead.team1.short_name}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{headToHead.draws}</div>
                        <div className="text-sm text-gray-600">Empates</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{headToHead.team2_wins}</div>
                        <div className="text-sm text-gray-600">Vitórias {headToHead.team2.short_name}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-600">{headToHead.total_matches}</div>
                        <div className="text-sm text-gray-600">Total de Jogos</div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-medium text-gray-900">
                        Gols: {headToHead.team1_goals} x {headToHead.team2_goals}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 