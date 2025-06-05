'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrophyIcon, ChartBarIcon, UsersIcon, CalendarIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
}

interface Match {
  id: number;
  home_team: Team;
  away_team: Team;
  competition: Competition;
  stadium?: { id: number; name: string; city?: string };
  match_date: string;
  status: string;
  home_score?: number;
  away_score?: number;
  home_score_penalties?: number;
  away_score_penalties?: number;
  leg?: 'first_leg' | 'second_leg' | 'single_match';
  tie_id?: string;
  home_aggregate_score?: number;
  away_aggregate_score?: number;
  qualified_team?: Team;
  round?: { id: number; name: string; round_number?: number };
  group_name?: string;
  phase?: string;
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
  const [roundMatches, setRoundMatches] = useState<Match[]>([])
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)

  // Função auxiliar para calcular agregado de um confronto
  const calculateAggregate = (matches: Match[]) => {
    if (matches.length !== 2) return null;
    
    const firstLeg = matches.find(m => m.leg === 'first_leg');
    const secondLeg = matches.find(m => m.leg === 'second_leg');
    
    if (!firstLeg || !secondLeg) return null;
    if (firstLeg.status !== 'finished' || secondLeg.status !== 'finished') return null;
    
    // Calcular agregado considerando que o time mandante pode ser diferente em cada jogo
    const homeTeamId = firstLeg.home_team.id;
    const awayTeamId = firstLeg.away_team.id;
    
    // Somar gols do time da casa (time que jogou em casa na ida)
    const homeAggregate = (firstLeg.home_score || 0) + (secondLeg.away_score || 0);
    // Somar gols do time visitante (time que jogou fora na ida)  
    const awayAggregate = (firstLeg.away_score || 0) + (secondLeg.home_score || 0);
    
    return {
      homeTeam: firstLeg.home_team,
      awayTeam: firstLeg.away_team,
      homeAggregate,
      awayAggregate,
      qualified: homeAggregate > awayAggregate ? firstLeg.home_team : 
                 awayAggregate > homeAggregate ? firstLeg.away_team : null
    };
  };

  // Função auxiliar para agrupar partidas por tie_id ou id (para jogos únicos)
  const groupedMatchesByTieId = useMemo(() => {
    const grouped: { [key: string]: Match[] } = {};
    roundMatches.forEach(match => {
      const key = match.tie_id || match.id.toString();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(match);
    });
    // Ordenar as partidas dentro de cada confronto para garantir que ida venha antes de volta
    for (const key in grouped) {
      if (grouped.hasOwnProperty(key)) {
        grouped[key].sort((a, b) => {
          if (a.leg === 'first_leg' && b.leg === 'second_leg') return -1;
          if (a.leg === 'second_leg' && b.leg === 'first_leg') return 1;
          return 0;
        });
      }
    }
    return grouped;
  }, [roundMatches]);

  const isCupCompetition = useMemo(() => {
    if (!selectedCompetition || competitions.length === 0) return false;
    const comp = competitions.find(c => c.id === selectedCompetition);
    console.log('Competição selecionada:', comp); // Debug
    return comp?.type === 'copa';
  }, [selectedCompetition, competitions]);

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
    } else if (rounds.length > 0) {
      // Se há rodadas mas nenhuma selecionada, selecione a primeira
      console.log("Nenhuma rodada selecionada, definindo a primeira: ", rounds[0].id); // Debug
      setCurrentRoundIndex(0);
      setSelectedRound(rounds[0].id);
    }
  }, [rounds, selectedRound])

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.competitions.list())
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
        console.log('Rodadas carregadas (fetchRounds):', data) // Debug
        setRounds(data)
        // Se houver rodadas e selectedRound não estiver nas rodadas carregadas, selecione a primeira
        if (data.length > 0 && (!selectedRound || !data.some((round: any) => round.id === selectedRound))) {
          console.log("Definindo selectedRound para a primeira rodada: ", data[0].id); // Debug
          setSelectedRound(data[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar rodadas (fetchRounds):', error)
    }
  }

  const fetchRoundMatches = async () => {
    if (!selectedCompetition || !selectedRound) {
      console.log("Não carregando jogos: Competição ou Rodada não selecionada.", { selectedCompetition, selectedRound }); // Debug
      setRoundMatches([]); 
      return;
    }
    
    try {
      console.log(`Carregando jogos para competição ${selectedCompetition}, rodada ${selectedRound}`); // Debug
      const response = await fetch(API_ENDPOINTS.standings.roundMatches(selectedCompetition, selectedRound))
      if (response.ok) {
        const data = await response.json()
        console.log('Jogos da rodada carregados:', data); // Debug
        setRoundMatches(data)
      } else {
        console.error(`Erro ao carregar jogos da rodada: ${response.status} - ${response.statusText}`); // Debug
        setRoundMatches([]); 
      }
    } catch (error) {
      console.error('Erro ao carregar jogos da rodada:', error)
      setRoundMatches([]); 
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
        <div className="h-6 w-6 bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{team.short_name?.substring(0, 3) || team.name.substring(0, 3)}</span>
        </div>
      )
    }

    return (
      <img 
        className="h-6 w-6 object-cover" 
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

  const getMatchOutcomeText = (match: Match) => {
    if (match.status === 'finished') {
      const homeScore = match.home_score !== undefined ? match.home_score : 0;
      const awayScore = match.away_score !== undefined ? match.away_score : 0;

      const currentRoundName = rounds[currentRoundIndex]?.name || '';

      if (isCupCompetition && match.tie_id) {
        // Para confrontos de ida e volta na Copa do Brasil
        let outcomeText = '';
        if (match.qualified_team) {
          outcomeText = `${match.qualified_team.short_name} Classificado`;
        } else if (match.home_aggregate_score !== undefined && match.away_aggregate_score !== undefined) {
          outcomeText = `Agregado: ${match.home_aggregate_score}x${match.away_aggregate_score}`;
        } else if (match.leg === 'single_match') {
            const homeScore = match.home_score !== undefined ? match.home_score : 0;
            const awayScore = match.away_score !== undefined ? match.away_score : 0;
            if (homeScore > awayScore) {
                outcomeText = `${match.home_team.short_name} venceu`;
            } else if (awayScore > homeScore) {
                outcomeText = `${match.away_team.short_name} venceu`;
            } else {
                outcomeText = 'Empate';
            }
        } else {
            // Se não há placar agregado ou time classificado, exibe o resultado da mão
            if (match.leg === 'first_leg') outcomeText = 'Jogo de ida';
            else if (match.leg === 'second_leg') outcomeText = 'Jogo de volta';

            if (homeScore > awayScore) {
              outcomeText += ` - ${match.home_team.short_name} venceu esta mão`;
            } else if (awayScore > homeScore) {
              outcomeText += ` - ${match.away_team.short_name} venceu esta mão`;
            } else {
              outcomeText += ' - Empate nesta mão';
            }
        }
        return outcomeText;
      } else {
        // Para jogos de eliminação simples ou ligas (mantém a lógica anterior)
        if (homeScore > awayScore) {
          return `${match.home_team.short_name} venceu`;
        } else if (awayScore > homeScore) {
          return `${match.away_team.short_name} venceu`;
        } else {
          return 'Empate';
        }
      }
    } else if (match.status === 'live') {
      return 'AO VIVO';
    } else {
      return formatMatchDate(match.match_date).time;
    }
  };

  const renderRoundMatches = () => (
    <div className="bg-white shadow rounded-lg p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateRound('prev')}
          disabled={currentRoundIndex === 0}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {rounds.length > 0 ? rounds[currentRoundIndex]?.name : 'Carregando Fases...'}
        </h3>
        <button
          onClick={() => navigateRound('next')}
          disabled={currentRoundIndex === rounds.length - 1}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {roundMatches.length > 0 ? (
        <div className="space-y-3">
          {Object.keys(groupedMatchesByTieId).map((tieId, index) => {
            const matchesInTie = groupedMatchesByTieId[tieId];
            const match1 = matchesInTie[0];

            let aggregateOutcomeText = '';
            let showQualifiedTeam = false;
            let qualifiedTeamName = '';

            // Calcular agregado dinamicamente
            if (matchesInTie.length === 2) {
              const aggregate = calculateAggregate(matchesInTie);
              if (aggregate) {
                aggregateOutcomeText = `Agregado: ${aggregate.homeTeam.short_name} ${aggregate.homeAggregate}x${aggregate.awayAggregate} ${aggregate.awayTeam.short_name}`;
                if (aggregate.qualified) {
                  qualifiedTeamName = aggregate.qualified.name;
                  showQualifiedTeam = true;
                }
              }
            } else if (match1.status === 'finished') {
              // Para jogos únicos
              if (match1.qualified_team) {
                qualifiedTeamName = match1.qualified_team.name;
                showQualifiedTeam = true;
              }
            }

            return (
              <div key={tieId}>
                {index > 0 && <div className="border-t border-gray-300 my-3"></div>}
                <div className="bg-gray-50 rounded-lg p-3">
                <div className={`space-y-2 ${matchesInTie.length > 1 ? '' : ''}`}>
                  {matchesInTie.map(match => (
                    <div key={match.id} className="bg-white rounded-md p-3">
                      {/* Data, Hora, Estádio */}
                      <div className="text-center text-gray-600 text-xs mb-3">
                        {formatMatchDate(match.match_date).date} • {formatMatchDate(match.match_date).time}
                        {match.stadium?.name && ` • ${match.stadium.name}`}
                        {match.stadium?.name && match.stadium?.city && `, ${match.stadium.city}`}
                      </div>

                      {/* Layout: Mandante (escudo) (placar) X (placar) (escudo) Visitante */}
                      <div className="flex items-center justify-center space-x-3">
                        {/* Mandante */}
                        <div className="flex items-center space-x-2 flex-1 justify-end">
                          <span className="font-medium text-gray-800 text-sm">{match.home_team.name}</span>
                          <TeamLogo team={match.home_team} />
                        </div>

                        {/* Placar */}
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {match.home_score !== undefined && match.home_score !== null ? match.home_score : '-'}
                          </span>
                          <span className="text-gray-500 font-medium">X</span>
                          <span className="text-lg font-bold text-gray-900">
                            {match.away_score !== undefined && match.away_score !== null ? match.away_score : '-'}
                          </span>
                        </div>

                        {/* Visitante */}
                        <div className="flex items-center space-x-2 flex-1">
                          <TeamLogo team={match.away_team} />
                          <span className="font-medium text-gray-800 text-sm">{match.away_team.name}</span>
                        </div>
                      </div>

                      {/* Pênaltis (se houver) */}
                      {match.home_score_penalties !== undefined && match.home_score_penalties !== null && 
                       match.away_score_penalties !== undefined && match.away_score_penalties !== null && (
                        <div className="text-center text-xs text-gray-500 mt-2">
                          Pênaltis: {match.home_score_penalties} x {match.away_score_penalties}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {(showQualifiedTeam || aggregateOutcomeText) && (
                  <div className="mt-2 text-center text-sm font-medium text-indigo-700">
                    {showQualifiedTeam ? `Classificado: ${qualifiedTeamName}` : aggregateOutcomeText}
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-600">Nenhum jogo encontrado para esta fase.</p>
      )}
    </div>
  );

  const renderLeagueStandings = () => (
    <div className="bg-white shadow rounded-lg">
      {Object.entries(groupedStandings()).map(([groupName, groupStandings]) => (
        <div key={groupName} className="mb-8 last:mb-0">
          {groupName !== '' && (
            <h2 className="text-xl font-bold text-gray-800 mb-4 px-6 pt-6">Grupo {groupName}</h2>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">POS</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">TIME</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">PTS</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">J</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">V</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">E</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">D</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">GP</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">GC</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SG</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">FORM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groupStandings.map((entry) => (
                  <tr key={entry.team.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${getPositionColor(entry.position)}`}>
                        {entry.position}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <TeamLogo team={entry.team} />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">{entry.team.name}</div>
                          <div className="text-gray-500">{entry.team.short_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-bold">{entry.points}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.played}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-green-600 font-bold">{entry.won}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-yellow-600 font-bold">{entry.drawn}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 font-bold">{entry.lost}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.goals_for}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{entry.goals_against}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-bold">{entry.goal_difference}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{renderForm(entry.form)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center">Carregando classificações...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">{isCupCompetition ? 'Fases' : 'Classificações'}</h1>
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
          
          {groups.length > 0 && !isCupCompetition && (
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
                  {isCupCompetition ? 'Fases' : 'Classificação'}
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
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
                  Confronto Direto
                </button>
              </nav>
            </div>

            {/* Content based on activeTab */}
            <div className="mt-8">
              {activeTab === 'standings' && (
                isCupCompetition ? renderRoundMatches() : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4">Classificação</h2>
                      {renderLeagueStandings()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4">Partidas da Rodada</h2>
                      {renderRoundMatches()}
                    </div>
                  </div>
                )
              )}
              {/* Estatísticas do Time */}
              {activeTab === 'stats' && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecione um time</label>
                    <select
                      value={selectedTeam || ''}
                      onChange={(e) => setSelectedTeam(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Selecione um time</option>
                      {availableTeams().map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTeam && teamStats && (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Estatísticas de {teamStats.team.name}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Geral */}
                        <div className="bg-indigo-50 p-4 rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold text-indigo-700 mb-2">Geral</h3>
                          <p>Jogos: {teamStats.overall.played}</p>
                          <p>Vitórias: {teamStats.overall.won}</p>
                          <p>Empates: {teamStats.overall.drawn}</p>
                          <p>Derrotas: {teamStats.overall.lost}</p>
                          <p>Gols Marcados: {teamStats.overall.goals_for}</p>
                          <p>Gols Sofridos: {teamStats.overall.goals_against}</p>
                          <p>Saldo de Gols: {teamStats.overall.goal_difference}</p>
                          <p>Pontos: {teamStats.overall.points}</p>
                          <p>Forma: {renderForm(teamStats.form)}</p>
                        </div>
                        {/* Em Casa */}
                        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold text-green-700 mb-2">Em Casa</h3>
                          <p>Jogos: {teamStats.home.played}</p>
                          <p>Vitórias: {teamStats.home.won}</p>
                          <p>Empates: {teamStats.home.drawn}</p>
                          <p>Derrotas: {teamStats.home.lost}</p>
                          <p>Gols Marcados: {teamStats.home.goals_for}</p>
                          <p>Gols Sofridos: {teamStats.home.goals_against}</p>
                          <p>Saldo de Gols: {teamStats.home.goal_difference}</p>
                        </div>
                        {/* Fora de Casa */}
                        <div className="bg-red-50 p-4 rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold text-red-700 mb-2">Fora de Casa</h3>
                          <p>Jogos: {teamStats.away.played}</p>
                          <p>Vitórias: {teamStats.away.won}</p>
                          <p>Empates: {teamStats.away.drawn}</p>
                          <p>Derrotas: {teamStats.away.lost}</p>
                          <p>Gols Marcados: {teamStats.away.goals_for}</p>
                          <p>Gols Sofridos: {teamStats.away.goals_against}</p>
                          <p>Saldo de Gols: {teamStats.away.goal_difference}</p>
                        </div>
                      </div>

                      {/* Partidas Recentes */}
                      <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Partidas Recentes</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">PARTIDA</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">DATA/HORA</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">COMPETIÇÃO</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">RESULTADO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {teamStats.recent_matches.map((match) => (
                              <tr key={match.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                                  <div className="flex items-center space-x-2">
                                    <TeamLogo team={match.home_team} />
                                    <span className="font-semibold text-gray-800">{match.home_team.name}</span>
                                    <span className="text-gray-500">{getMatchStatus(match)}</span>
                                    <span className="font-semibold text-gray-800">{match.away_team.name}</span>
                                    <TeamLogo team={match.away_team} />
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    <span>{formatMatchDate(match.match_date).date} {formatMatchDate(match.match_date).time}</span>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{match.competition.name}</td>
                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-bold ${getMatchStatusColor(match.status)}`}>
                                  {getMatchOutcomeText(match)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Confronto Direto */}
              {activeTab === 'h2h' && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Confronto Direto</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time 1</label>
                      <select
                        value={h2hTeam1 || ''}
                        onChange={(e) => setH2hTeam1(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um time</option>
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
                        <option value="">Selecione um time</option>
                        {availableTeams().map((team) => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {h2hTeam1 && h2hTeam2 && headToHead ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                          <h3 className="text-lg font-semibold text-blue-700 mb-2">Geral</h3>
                          <p>Total de Jogos: {headToHead.total_matches}</p>
                          <p>Vitórias {headToHead.team1.short_name}: {headToHead.team1_wins}</p>
                          <p>Vitórias {headToHead.team2.short_name}: {headToHead.team2_wins}</p>
                          <p>Empates: {headToHead.draws}</p>
                          <p>Gols {headToHead.team1.short_name}: {headToHead.team1_goals}</p>
                          <p>Gols {headToHead.team2.short_name}: {headToHead.team2_goals}</p>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Últimos Jogos</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">PARTIDA</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">DATA/HORA</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">COMPETIÇÃO</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">RESULTADO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {headToHead.last_matches.map((match) => (
                              <tr key={match.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                                  <div className="flex items-center space-x-2">
                                    <TeamLogo team={match.home_team} />
                                    <span className="font-semibold text-gray-800">{match.home_team.name}</span>
                                    <span className="text-gray-500">{getMatchStatus(match)}</span>
                                    <span className="font-semibold text-gray-800">{match.away_team.name}</span>
                                    <TeamLogo team={match.away_team} />
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                    <span>{formatMatchDate(match.match_date).date} {formatMatchDate(match.match_date).time}</span>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{match.competition.name}</td>
                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-bold ${getMatchStatusColor(match.status)}`}>
                                  {getMatchOutcomeText(match)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600">Selecione dois times para ver o confronto direto.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 