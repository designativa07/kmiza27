'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { getTeamLogoUrl, handleImageError } from '../lib/cdn'
import { Combobox } from '@headlessui/react'
import { format } from 'date-fns'

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
  stadium_id?: number | null
}

interface Player {
  id: number;
  name: string;
  position?: string;
  image_url?: string;
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

interface MatchPlayerStat {
  player_id: number;
  goals?: number;
  yellow_cards?: number;
  red_cards?: number;
}

interface Match {
  id: number
  home_team: Team | null
  away_team: Team | null
  competition: Competition | null
  stadium?: Stadium
  match_date: string
  status: string
  home_score?: number
  away_score?: number
  broadcast_channels?: any
  channel_ids?: number[]

  round?: { id: number; name: string }
  group_name?: string
  phase?: string
  leg?: 'first_leg' | 'second_leg' | 'single_match'
  tie_id?: string
  home_team_player_stats?: MatchPlayerStat[];
  away_team_player_stats?: MatchPlayerStat[];
}

interface Channel {
  id: number
  name: string
}

// Nova interface para o estado do formulário
interface MatchFormData {
  home_team_id: string;
  away_team_id: string;
  competition_id: string;
  round_id: string;
  round_name: string;
  group_name: string;
  phase: string;
  match_date: string;
  status: string;
  broadcast_channels: string;
  channel_ids: number[];
  home_score?: number;
  away_score?: number;
  home_yellow_cards?: number;
  away_yellow_cards?: number;
  home_red_cards?: number;
  away_red_cards?: number;
  home_score_penalties?: number;
  away_score_penalties?: number;
  leg: '' | 'first_leg' | 'second_leg' | 'single_match';
  tie_id: string;
  match_date_second_leg?: string;
  stadium_id_second_leg?: string;
  stadium_id?: string | null; // Alterado para string | null
  home_team_player_stats: MatchPlayerStat[];
  away_team_player_stats: MatchPlayerStat[];
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
function TeamAutocomplete({
  teams,
  value,
  onChange,
  label
}: { teams: Team[], value: string, onChange: (id: string) => void, label: string }) {
  const [query, setQuery] = useState('')
  const filteredTeams = query === '' ? teams : teams.filter(team => team?.name?.toLowerCase().includes(query.toLowerCase()))
  const selectedTeam = teams.find(team => team.id.toString() === value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <Combobox value={selectedTeam || null} onChange={(team: Team) => onChange(team.id.toString())}>
        <div className="relative mt-1">
          <Combobox.Input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
            displayValue={(team: Team | null) => team?.name || ''}
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
                  {team?.name || 'Time sem nome'}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  )
}

// Componente auxiliar para autocomplete de jogadores
function PlayerAutocomplete({
  players,
  value,
  onChange,
  label
}: { players: Player[], value: number | undefined, onChange: (id: number | undefined) => void, label: string }) {
  const [query, setQuery] = useState('')
  const filteredPlayers = query === '' ? players : players.filter(player => player?.name?.toLowerCase().includes(query.toLowerCase()))
  const selectedPlayer = players.find(player => player.id === value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <Combobox value={selectedPlayer || null} onChange={(player: Player | null) => onChange(player?.id)}>
        <div className="relative mt-1">
          <Combobox.Input
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
            displayValue={(player: Player | null) => player?.name || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Digite para buscar..."
          />
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredPlayers.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nenhum jogador encontrado
              </div>
            ) : (
              filteredPlayers.map((player: Player) => (
                <Combobox.Option
                  key={player.id}
                  value={player}
                  className={({ active }: { active: boolean }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'}`}
                >
                  {player?.name || 'Jogador sem nome'}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  )
}

// Nova interface para corresponder à estrutura de PlayerTeamHistory retornada pelo backend
interface PlayerTeamHistoryResponse {
  id: number; // ID do registro no histórico do time do jogador
  player: Player; // Objeto Player aninhado
  team: Team; // Objeto Team aninhado
  start_date: string;
  end_date?: string | null;
  jersey_number?: string | null;
  role?: string | null;
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
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [availableRounds, setAvailableRounds] = useState<{id: number, name: string}[]>([])
  const [createTwoLegTie, setCreateTwoLegTie] = useState(false)
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([])
  
  const [selectedHomeGoalPlayerId, setSelectedHomeGoalPlayerId] = useState<number | undefined>(undefined);
  const [selectedAwayGoalPlayerId, setSelectedAwayGoalPlayerId] = useState<number | undefined>(undefined);

  // Estados dos filtros - iniciam completamente limpos
  const [filters, setFilters] = useState({
    competition: '',
    round: '',
    group: '',
    phase: '',
    status: '',
    searchTerm: ''
  })

  // Estados para rodadas e grupos dinâmicos baseados na competição
  const [availableRoundsForFilter, setAvailableRoundsForFilter] = useState<string[]>([])
  const [availableGroupsForFilter, setAvailableGroupsForFilter] = useState<string[]>([])

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState<MatchFormData>({
    home_team_id: '',
    away_team_id: '',
    competition_id: '',
    round_id: '',
    round_name: '',
    group_name: '',
    phase: '',
    match_date: '',
    status: 'scheduled',
    broadcast_channels: '',
    channel_ids: [],
    home_score: undefined,
    away_score: undefined,
    home_yellow_cards: undefined,
    away_yellow_cards: undefined,
    home_red_cards: undefined,
    away_red_cards: undefined,
    home_score_penalties: undefined,
    away_score_penalties: undefined,
    leg: '',
    tie_id: '',
    match_date_second_leg: '',
    stadium_id_second_leg: '',
    stadium_id: null, // Inicializar como null
    home_team_player_stats: [],
    away_team_player_stats: [],
  })



  const fetchStadiums = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list())
      const data = await response.json()
      setStadiums(data)
    } catch (error) {
      console.error('Erro ao carregar estádios:', error)
    }
  }

  const fetchPlayersByTeam = async (teamId: string | undefined, setPlayers: React.Dispatch<React.SetStateAction<Player[]>>) => {
    if (!teamId) {
      setPlayers([]);
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.teams.list()}/${teamId}/players`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // A resposta do backend agora é PlayerTeamHistoryResponse[], então mapeamos para Player[]
      const data: PlayerTeamHistoryResponse[] = await response.json();
      const players = data.map(entry => entry.player); // Extrai o objeto player de cada entrada
      setPlayers(players);
    } catch (error) {
      console.error(`Erro ao buscar jogadores para o time ${teamId}:`, error);
      setPlayers([]);
    }
  };

  useEffect(() => {
    fetchData()
  }, [])

  // Removido useEffect de inicialização automática - filtros iniciam limpos

  useEffect(() => {
    applyFilters()
  }, [filters, matches])

  useEffect(() => {
    applyPagination()
  }, [filteredMatches, currentPage, itemsPerPage])

  // Buscar rodadas e grupos quando a competição do filtro mudar
  useEffect(() => {
    if (filters.competition && matches.length > 0) {
      fetchRoundsAndGroupsForFilter(filters.competition);
    }
  }, [filters.competition, matches]);

  // Buscar rodadas quando a competição for selecionada no formulário
  useEffect(() => {
    if (formData.competition_id) {
      fetchRoundsByCompetition(formData.competition_id)
    }
  }, [formData.competition_id])

  // Auto-selecionar estádio quando o time da casa for selecionado
  useEffect(() => {
    if (formData.home_team_id && teams.length > 0) {
      const selectedHomeTeam = teams.find(team => team.id.toString() === formData.home_team_id)
      if (selectedHomeTeam && selectedHomeTeam.stadium_id !== undefined) {
        setFormData(prev => ({
          ...prev,
          stadium_id: selectedHomeTeam.stadium_id?.toString() || ''
        }))
      }
    }
  }, [formData.home_team_id, teams])

  // Buscar jogadores do time da casa quando o home_team_id mudar
  useEffect(() => {
    fetchPlayersByTeam(formData.home_team_id, setHomeTeamPlayers);
  }, [formData.home_team_id]);

  // Buscar jogadores do time visitante quando o away_team_id mudar
  useEffect(() => {
    fetchPlayersByTeam(formData.away_team_id, setAwayTeamPlayers);
  }, [formData.away_team_id]);

  const fetchData = async () => {
    try {
      const [matchesRes, teamsRes, competitionsRes, channelsRes] = await Promise.all([
        fetch(API_ENDPOINTS.matches.list()),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.competitions.list()),
        fetch(API_ENDPOINTS.channels.list())
      ])

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        console.log('Matches data received:', matchesData)
        // Garantir que sempre temos um array
        if (Array.isArray(matchesData)) {
          setMatches(matchesData)
        } else if (matchesData && Array.isArray(matchesData.data)) {
          setMatches(matchesData.data)
        } else {
          console.error('Matches data is not an array:', matchesData)
          setMatches([])
        }
      }
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }
      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json()
        setCompetitions(competitionsData)
      }
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json()
        setChannels(channelsData)
      }
      fetchStadiums()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoundsByCompetition = async (competitionId: string) => {
    if (!competitionId) {
      setAvailableRounds([])
      return
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.standings.rounds(parseInt(competitionId)))
      if (response.ok) {
        const rounds = await response.json()
        setAvailableRounds(rounds)
      }
    } catch (error) {
      console.error('Erro ao buscar rodadas:', error)
      setAvailableRounds([])
    }
  }

  // Nova função para buscar rodadas e grupos para os filtros baseados na competição
  const fetchRoundsAndGroupsForFilter = (competitionId: string) => {
    if (!competitionId || !Array.isArray(matches)) {
      setAvailableRoundsForFilter([])
      setAvailableGroupsForFilter([])
      return
    }

    // Filtrar matches da competição selecionada
    const competitionMatches = matches.filter(match => 
      match.competition?.id?.toString() === competitionId
    )

    // Extrair rodadas (apenas números ou que contenham "Rodada")
    const rounds = new Set<string>()
    competitionMatches.forEach(match => {
      if (match.round?.name) {
        const roundName = match.round.name
        if (/^\d+$/.test(roundName) || /rodada/i.test(roundName)) {
          rounds.add(roundName)
        }
      }
    })

    // Extrair grupos (letras ou grupos que não sejam fases)
    const groups = new Set<string>()
    competitionMatches.forEach(match => {
      if (match.group_name) {
        const groupName = match.group_name
        // Verificar se não é uma fase
        const phaseKeywords = ['final', 'semi', 'oitavas', 'quartas', 'fase', 'eliminatória', 'playoff']
        const isPhase = phaseKeywords.some(keyword => 
          groupName.toLowerCase().includes(keyword)
        )
        if (!isPhase) {
          groups.add(groupName)
        }
      }
    })

    // Ordenar rodadas numericamente
    const sortedRounds = Array.from(rounds).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.localeCompare(b)
    })

    // Ordenar grupos alfabeticamente
    const sortedGroups = Array.from(groups).sort()

    setAvailableRoundsForFilter(sortedRounds)
    setAvailableGroupsForFilter(sortedGroups)
    console.log('DEBUG: Available Rounds for Filter:', sortedRounds); // Add this
    console.log('DEBUG: Available Groups for Filter:', sortedGroups); // Add this
  }

  const applyFilters = () => {
    // Verificar se matches é um array válido
    if (!Array.isArray(matches)) {
      console.error('matches is not an array:', matches);
      setFilteredMatches([]);
      return;
    }

    let filtered = [...matches]

    if (filters.competition) {
      filtered = filtered.filter(match => match.competition?.id?.toString() === filters.competition)
    }

    if (filters.round) {
      console.log('DEBUG: Filtering by Round:', filters.round); // Add this
      filtered = filtered.filter(match => match.round?.name?.toLowerCase().includes(filters.round.toLowerCase()))
    }

    if (filters.group) {
      console.log('DEBUG: Filtering by Group:', filters.group); // Add this
      filtered = filtered.filter(match => match.group_name?.toLowerCase().includes(filters.group.toLowerCase()))
    }

    if (filters.phase) {
      filtered = filtered.filter(match => match.phase?.toLowerCase().includes(filters.phase.toLowerCase()))
    }

    if (filters.status) {
      filtered = filtered.filter(match => match.status?.toLowerCase().includes(filters.status.toLowerCase()))
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(match => 
        match.home_team?.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.away_team?.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.competition?.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    setFilteredMatches(filtered)
    console.log('DEBUG: Number of filtered matches:', filtered.length); // Add this
    // setCurrentPage(1) // REMOVIDO: A página só deve resetar quando um filtro é alterado diretamente
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
      group: '',
      phase: '',
      status: '',
      searchTerm: ''
    });
    setCurrentPage(1); // Mantido: Ao limpar filtros, volta para a página 1
  }

  const getUniqueRoundsByCompetition = (competitionId: string) => {
    if (!Array.isArray(matches)) {
      return [];
    }
    
    const rounds = new Set<string>();
    matches.forEach(match => {
      if (match.competition?.id?.toString() === competitionId && match.round?.name) {
        rounds.add(match.round.name);
      }
    });
    return Array.from(rounds).sort((a, b) => {
      // Tenta ordenar numericamente se forem rodadas numéricas (ex: "1ª Rodada")
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      // Caso contrário, ordena alfabeticamente
      return a.localeCompare(b);
    });
  }

  const getUniqueGroupsByCompetition = (competitionId: string) => {
    if (!Array.isArray(matches)) {
      return [];
    }
    
    const groups = new Set<string>();
    matches.forEach(match => {
      if (match.competition?.id?.toString() === competitionId && match.group_name) {
        groups.add(match.group_name);
      }
    });
    return Array.from(groups).sort();
  }

  const getUniquePhasesByCompetition = (competitionId: string) => {
    if (!Array.isArray(matches)) {
      return [];
    }
    
    const phases = new Set<string>();
    matches.forEach(match => {
      if (match.competition?.id?.toString() === competitionId && match.phase) {
        phases.add(match.phase);
      }
    });
    return Array.from(phases).sort();
  }

  const fetchTeams = async () => {
    try {
      const [teamsRes, competitionsRes] = await Promise.all([
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.competitions.list())
      ]);

      if (teamsRes.ok && competitionsRes.ok) {
        const teamsData = await teamsRes.json();
        const competitionsData = await competitionsRes.json();
        setTeams(teamsData);
        setCompetitions(competitionsData);
      }
    } catch (error) {
      console.error('Erro ao carregar times e competições:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let url: string;
      let method: string;
      let payload: any;

      const basePayload = {
        competition_id: parseInt(String(formData.competition_id || '')),
        round_id: formData.round_id ? parseInt(String(formData.round_id)) : undefined,
        round_name: formData.round_name || undefined,
        group_name: formData.group_name || undefined,
        phase: formData.phase || undefined,
        status: formData.status,
        broadcast_channels: formData.broadcast_channels || null,
        channel_ids: formData.channel_ids,
        home_score: formData.home_score,
        away_score: formData.away_score,
        home_yellow_cards: formData.home_yellow_cards,
        away_yellow_cards: formData.away_yellow_cards,
        home_red_cards: formData.home_red_cards,
        away_red_cards: formData.away_red_cards,
        home_score_penalties: formData.home_score_penalties,
        away_score_penalties: formData.away_score_penalties,
        leg: formData.leg,
        tie_id: formData.tie_id === '' ? null : formData.tie_id,
        home_team_player_stats: formData.home_team_player_stats,
        away_team_player_stats: formData.away_team_player_stats,
      };

      if (editingMatch) {
        url = `${API_ENDPOINTS.matches.list()}/${editingMatch.id}`;
        method = 'PATCH';
        payload = {
          home_team_id: parseInt(String(formData.home_team_id || '')),
          away_team_id: parseInt(String(formData.away_team_id || '')),
          stadium_id: formData.stadium_id === null || formData.stadium_id === ''
            ? null
            : parseInt(String(formData.stadium_id)),
          ...basePayload,
        };
      } else if (createTwoLegTie) {
        url = API_ENDPOINTS.matches.createTwoLegTie();
        method = 'POST';
        payload = {
          home_team_id: parseInt(String(formData.home_team_id || '')),
          away_team_id: parseInt(String(formData.away_team_id || '')),
          match_date_first_leg: new Date(formData.match_date).toISOString(),
          stadium_id_first_leg: formData.stadium_id === null || formData.stadium_id === ''
            ? null
            : parseInt(String(formData.stadium_id)),
          match_date_second_leg: new Date(formData.match_date_second_leg!).toISOString(),
          stadium_id_second_leg: formData.stadium_id_second_leg === null || formData.stadium_id_second_leg === ''
            ? null
            : parseInt(String(formData.stadium_id_second_leg)),
          ...basePayload,
        };
      } else {
        url = API_ENDPOINTS.matches.list();
        method = 'POST';
        payload = {
          home_team_id: parseInt(String(formData.home_team_id || '')),
          away_team_id: parseInt(String(formData.away_team_id || '')),
          match_date: new Date(formData.match_date).toISOString(),
          stadium_id: formData.stadium_id === null || formData.stadium_id === ''
            ? null
            : parseInt(String(formData.stadium_id)),
          ...basePayload,
        };
      }

      console.log('🔍 Frontend - Enviando payload COMPLETO:', payload);

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
        setShowModal(false)
        setEditingMatch(null)
        resetForm()
        setTimeout(() => {
          console.log('🔄 Recarregando dados após atualização...');
          fetchData()
        }, 500)
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
      round_name: '',
      group_name: '',
      phase: '',
      match_date: '',
      status: 'scheduled',
      broadcast_channels: '',
      channel_ids: [],
      home_score: undefined,
      away_score: undefined,
      home_yellow_cards: undefined,
      away_yellow_cards: undefined,
      home_red_cards: undefined,
      away_red_cards: undefined,
      home_score_penalties: undefined,
      away_score_penalties: undefined,
      leg: '',
      tie_id: '',
      match_date_second_leg: '',
      stadium_id_second_leg: '',
      stadium_id: null, // Inicializar como null
      home_team_player_stats: [],
      away_team_player_stats: [],
    })
    setCreateTwoLegTie(false)
    setSelectedHomeGoalPlayerId(undefined);
    setSelectedAwayGoalPlayerId(undefined);
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setCreateTwoLegTie(false)

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

    const date = new Date(match.match_date);
    const timezoneOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (timezoneOffset * 60000));
    const formattedDate = localDate.toISOString().slice(0, 16);

    const newFormData = {
      home_team_id: match.home_team?.id?.toString() || '',
      away_team_id: match.away_team?.id?.toString() || '',
      competition_id: match.competition?.id?.toString() || '',
      round_id: match.round?.id?.toString() || '',
      round_name: match.round?.name || '',
      group_name: match.group_name || '',
      phase: match.phase || '',
      match_date: formattedDate,
      status: match.status,
      broadcast_channels: processBroadcastChannels(match.broadcast_channels),
      channel_ids: match.channel_ids || [],
      home_score: match.home_score ?? undefined,
      away_score: match.away_score ?? undefined,
      home_yellow_cards: (match as any).home_yellow_cards ?? undefined,
      away_yellow_cards: (match as any).away_yellow_cards ?? undefined,
      home_red_cards: (match as any).home_red_cards ?? undefined,
      away_red_cards: (match as any).away_red_cards ?? undefined,
      home_score_penalties: (match as any).home_score_penalties ?? undefined,
      away_score_penalties: (match as any).away_score_penalties ?? undefined,
      leg: match.leg || '',
      tie_id: match.tie_id || '',
      match_date_second_leg: '',
      stadium_id_second_leg: '',
      stadium_id: match.stadium?.id?.toString() || null, // Atribuir string ou null
      home_team_player_stats: match.home_team_player_stats || [],
      away_team_player_stats: match.away_team_player_stats || [],
    } as MatchFormData;

    setFormData(newFormData);
    setShowModal(true)
    console.log('🔍 handleEdit - stadium_id após processamento:', newFormData.stadium_id);
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
    if (!team) {
      return (
        <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">?</span>
        </div>
      )
    }
    
    if (!team.logo_url) {
      return (
        <div className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">{team.short_name?.substring(0, 3) || team.name?.substring(0, 3) || '?'}</span>
        </div>
      )
    }

    return (
      <img 
        className="h-6 w-6 rounded-md object-cover" 
        src={getTeamLogoUrl(team.logo_url)} 
        alt={`Escudo ${team.name || 'Time'}`}
        onError={handleImageError}
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

  // Funções para manipular gols por jogador
  const handleAddGoal = (teamType: 'home' | 'away') => {
    setFormData(prevData => {
      const currentStats = teamType === 'home' ? prevData.home_team_player_stats : prevData.away_team_player_stats;
      const selectedPlayerId = teamType === 'home' ? selectedHomeGoalPlayerId : selectedAwayGoalPlayerId;

      if (selectedPlayerId === undefined) {
        alert('Por favor, selecione um jogador para adicionar o gol.');
        return prevData;
      }

      const playerStatIndex = currentStats.findIndex(stat => stat.player_id === selectedPlayerId);
      let updatedStats;

      if (playerStatIndex > -1) {
        updatedStats = currentStats.map((stat, index) =>
          index === playerStatIndex ? { ...stat, goals: (stat.goals || 0) + 1 } : stat
        );
      } else {
        updatedStats = [...currentStats, { player_id: selectedPlayerId, goals: 1 }];
      }

      if (teamType === 'home') {
        setSelectedHomeGoalPlayerId(undefined); // Resetar após adicionar
        return { ...prevData, home_team_player_stats: updatedStats };
      } else {
        setSelectedAwayGoalPlayerId(undefined); // Resetar após adicionar
        return { ...prevData, away_team_player_stats: updatedStats };
      }
    });
  };

  const handleRemoveGoal = (teamType: 'home' | 'away', playerIdToRemove: number) => {
    setFormData(prevData => {
      const currentStats = teamType === 'home' ? prevData.home_team_player_stats : prevData.away_team_player_stats;
      const updatedStats = currentStats.map(stat =>
        stat.player_id === playerIdToRemove ? { ...stat, goals: Math.max(0, (stat.goals || 0) - 1) } : stat
      ).filter(stat => stat.goals && stat.goals > 0); // Remover se os gols chegarem a zero

      if (teamType === 'home') {
        return { ...prevData, home_team_player_stats: updatedStats };
      } else {
        return { ...prevData, away_team_player_stats: updatedStats };
      }
    });
  };

  const handleGoalPlayerChange = (teamType: 'home' | 'away', playerId: number | undefined) => {
    if (teamType === 'home') {
      setSelectedHomeGoalPlayerId(playerId);
    } else {
      setSelectedAwayGoalPlayerId(playerId);
    }
  };

  // Função para calcular o placar total baseado nos gols dos jogadores
  const calculateTotalScore = (playerStats: MatchPlayerStat[]): number => {
    return playerStats.reduce((total, stat) => total + (stat.goals || 0), 0);
  };

  // Função para sincronizar o placar total com os gols dos jogadores
  const syncScoreWithPlayerGoals = () => {
    const homeScore = calculateTotalScore(formData.home_team_player_stats);
    const awayScore = calculateTotalScore(formData.away_team_player_stats);
    
    setFormData(prevData => ({
      ...prevData,
      home_score: homeScore,
      away_score: awayScore
    }));
  };

  // Efeito para sincronizar automaticamente o placar quando os gols dos jogadores mudarem
  useEffect(() => {
    if (formData.home_team_player_stats.length > 0 || formData.away_team_player_stats.length > 0) {
      syncScoreWithPlayerGoals();
    }
  }, [formData.home_team_player_stats, formData.away_team_player_stats]);

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

      {/* Filtros - agora sempre visíveis e sem condição */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">🎯 Filtros de Jogos</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {filteredMatches.length} jogos encontrados
            </span>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏆 Competição</label>
              <select
                value={filters.competition}
                onChange={(e) => setFilters({ ...filters, competition: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
              >
                <option value="">Todas</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔄 Rodada</label>
              <select
                value={filters.round}
                onChange={(e) => setFilters({ ...filters, round: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                disabled={!filters.competition}
              >
                <option value="">Todas</option>
                {filters.competition && getUniqueRoundsByCompetition(filters.competition).map((roundName) => (
                  <option key={roundName} value={roundName}>
                    {roundName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">👥 Grupo</label>
              <select
                value={filters.group}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, group: e.target.value }));
                  setCurrentPage(1); // Resetar página ao mudar filtro
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                disabled={!filters.competition}
              >
                <option value="">Todos</option>
                {filters.competition && getUniqueGroupsByCompetition(filters.competition).map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">⚡ Fase</label>
              <select
                value={filters.phase}
                onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
              >
                <option value="">Todas</option>
                {getUniquePhasesByCompetition(filters.competition).map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📍 Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
              >
                <option value="">Todos</option>
                <option value="scheduled">⏰ Agendado</option>
                <option value="live">🔴 Ao Vivo</option>
                <option value="finished">✅ Finalizado</option>
                <option value="postponed">⏸️ Adiado</option>
                <option value="cancelled">❌ Cancelado</option>
              </select>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, status: 'live' })}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
              >
                🔴 Ao Vivo
              </button>
              <button
                onClick={() => setFilters({ ...filters, status: 'scheduled' })}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                ⏰ Próximos
              </button>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ⚽ Partida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📅 Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🏆 Competição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      📍 Status
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
                        <div className="grid grid-cols-3 items-center gap-4">
                          {/* Time da casa - Alinhado à direita */}
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-sm font-medium text-gray-900 text-right">{match.home_team?.name || 'Time não encontrado'}</span>
                            {match.home_team && <TeamLogo team={match.home_team} />}
                          </div>
                          
                          {/* Placar centralizado com X */}
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-lg font-bold text-gray-900">
                              {match.home_score !== undefined && match.home_score !== null ? match.home_score : '-'}
                            </span>
                            <span className="text-lg font-bold text-gray-400 mx-1">×</span>
                            <span className="text-lg font-bold text-gray-900">
                              {match.away_score !== undefined && match.away_score !== null ? match.away_score : '-'}
                            </span>
                          </div>
                          
                          {/* Time visitante - Alinhado à esquerda */}
                          <div className="flex items-center justify-start space-x-2">
                            {match.away_team && <TeamLogo team={match.away_team} />}
                            <span className="text-sm font-medium text-gray-900 text-left">{match.away_team?.name || 'Time não encontrado'}</span>
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
                          {match.competition?.name || 'Competição não encontrada'}
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
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="home_score" className="block text-sm font-medium text-gray-700">
                      Placar Casa
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="home_score"
                        id="home_score"
                        value={formData.home_score === undefined ? '' : formData.home_score}
                        onChange={(e) => setFormData({ ...formData, home_score: e.target.value === '' ? undefined : Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={syncScoreWithPlayerGoals}
                        className="mt-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Sincronizar placar com gols dos jogadores"
                      >
                        Sync
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="away_score" className="block text-sm font-medium text-gray-700">
                      Placar Visitante
                    </label>
                    <input
                      type="number"
                      name="away_score"
                      id="away_score"
                      value={formData.away_score === undefined ? '' : formData.away_score}
                      onChange={(e) => setFormData({ ...formData, away_score: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Novos campos para gols de pênaltis */}
                  <div>
                    <label htmlFor="home_score_penalties" className="block text-sm font-medium text-gray-700">
                      Gols Pênaltis Casa
                    </label>
                    <input
                      type="number"
                      name="home_score_penalties"
                      id="home_score_penalties"
                      value={formData.home_score_penalties === undefined ? '' : formData.home_score_penalties}
                      onChange={(e) => setFormData({ ...formData, home_score_penalties: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="away_score_penalties" className="block text-sm font-medium text-gray-700">
                      Gols Pênaltis Visitante
                    </label>
                    <input
                      type="number"
                      name="away_score_penalties"
                      id="away_score_penalties"
                      value={formData.away_score_penalties === undefined ? '' : formData.away_score_penalties}
                      onChange={(e) => setFormData({ ...formData, away_score_penalties: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Seção para Adicionar Gols (Time da Casa) */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Registrar Gols - {teams.find(t => t.id.toString() === formData.home_team_id)?.name || 'Time da Casa'}</h4>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Total: {calculateTotalScore(formData.home_team_player_stats)} gol(s)
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {formData.home_team_player_stats.filter(stat => stat.goals && stat.goals > 0).map((stat) => {
                      const player = homeTeamPlayers.find(p => p.id === stat.player_id);
                      return (
                        <div key={stat.player_id} className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 font-medium w-3/4">{player?.name || 'Jogador desconhecido'}:</p>
                          <span className="text-lg font-bold text-green-600">{stat.goals} Gol(s)</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal('home', stat.player_id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Remover gol(s) deste jogador"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <div className="flex-1">
                      <PlayerAutocomplete
                        players={homeTeamPlayers}
                        value={selectedHomeGoalPlayerId}
                        onChange={(playerId) => handleGoalPlayerChange('home', playerId)}
                        label="Adicionar Gol para Jogador"
                      />
                      {!formData.home_team_id && (
                        <p className="mt-1 text-sm text-gray-500">Selecione o time da casa primeiro</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddGoal('home')}
                      disabled={!formData.home_team_id || !selectedHomeGoalPlayerId}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={!formData.home_team_id ? "Selecione o time da casa primeiro" : !selectedHomeGoalPlayerId ? "Selecione um jogador" : "Adicionar gol"}
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Seção para Adicionar Gols (Time Visitante) */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Registrar Gols - {teams.find(t => t.id.toString() === formData.away_team_id)?.name || 'Time Visitante'}</h4>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Total: {calculateTotalScore(formData.away_team_player_stats)} gol(s)
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {formData.away_team_player_stats.filter(stat => stat.goals && stat.goals > 0).map((stat) => {
                      const player = awayTeamPlayers.find(p => p.id === stat.player_id);
                      return (
                        <div key={stat.player_id} className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 font-medium w-3/4">{player?.name || 'Jogador desconhecido'}:</p>
                          <span className="text-lg font-bold text-green-600">{stat.goals} Gol(s)</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal('away', stat.player_id)}
                            className="p-1 text-red-600 hover:text-red-900"
                            title="Remover gol(s) deste jogador"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-end gap-2">
                    <div className="flex-1">
                      <PlayerAutocomplete
                        players={awayTeamPlayers}
                        value={selectedAwayGoalPlayerId}
                        onChange={(playerId) => handleGoalPlayerChange('away', playerId)}
                        label="Adicionar Gol para Jogador"
                      />
                      {!formData.away_team_id && (
                        <p className="mt-1 text-sm text-gray-500">Selecione o time visitante primeiro</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddGoal('away')}
                      disabled={!formData.away_team_id || !selectedAwayGoalPlayerId}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={!formData.away_team_id ? "Selecione o time visitante primeiro" : !selectedAwayGoalPlayerId ? "Selecione um jogador" : "Adicionar gol"}
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
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

                {/* Outros campos do formulário (competição, data, status, etc.) */}
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="competition_id" className="block text-sm font-medium text-gray-700">
                      Competição
                    </label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rodada</label>
                    <div className="space-y-2">
                      <select
                        value={formData.round_id}
                        onChange={(e) => setFormData({ ...formData, round_id: e.target.value, round_name: '' })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      >
                        <option value="">Selecione uma rodada existente...</option>
                        {availableRounds.map((round) => (
                          <option key={round.id} value={round.id}>{round.name}</option>
                        ))}
                      </select>
                      <div className="text-center text-sm text-gray-500">ou</div>
                      <input
                        type="text"
                        value={formData.round_name || ''}
                        onChange={(e) => setFormData({ ...formData, round_name: e.target.value, round_id: '' })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                        placeholder="Digite o nome da nova rodada (ex: Rodada 13)"
                      />
                    </div>
                    {!formData.competition_id && (
                      <p className="mt-1 text-sm text-gray-500">Selecione uma competição primeiro</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grupo</label>
                    <input
                      type="text"
                      value={formData.group_name}
                      onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                      placeholder="Ex: A, B, C..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fase</label>
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
                    <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.match_date}
                      onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
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
                
                {/* Adicionado: Campo Leg */}
                <div className="col-span-full sm:col-span-3">
                  <label htmlFor="leg" className="block text-sm font-medium leading-6 text-gray-900">Mão</label>
                  <select
                    id="leg"
                    name="leg"
                    value={formData.leg}
                    onChange={(e) => setFormData({ ...formData, leg: e.target.value as '' | 'first_leg' | 'second_leg' | 'single_match' })}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    disabled={createTwoLegTie}
                  >
                    <option value="">Selecione a mão</option>
                    <option value="single_match">Jogo Único</option>
                    <option value="first_leg">Jogo de ida</option>
                    <option value="second_leg">Jogo de volta</option>
                  </select>
                </div>

                {/* Opção para criar confrontos de ida e volta */}
                {competitions.find(comp => comp.id.toString() === formData.competition_id)?.name.toLowerCase().includes('copa') && !editingMatch && (
                  <div className="col-span-full mt-4 bg-blue-50 p-4 rounded-lg flex items-center">
                    <input
                      id="create_two_leg_tie"
                      name="create_two_leg_tie"
                      type="checkbox"
                      checked={createTwoLegTie}
                      onChange={(e) => {
                        setCreateTwoLegTie(e.target.checked);
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, leg: 'first_leg', tie_id: '' }));
                        } else {
                          setFormData(prev => ({ ...prev, leg: '', tie_id: '', match_date_second_leg: '', stadium_id_second_leg: '', stadium_id: null })); // Definir como null
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="create_two_leg_tie" className="ml-2 block text-sm text-blue-800 font-semibold">
                      Criar Confronto de Ida e Volta (Primeira Mão + Segunda Mão)
                    </label>
                  </div>
                )}

                {/* Adicionado: Campo Tie ID */}
                <div className="col-span-full sm:col-span-3">
                  <label htmlFor="tie_id" className="block text-sm font-medium leading-6 text-gray-900">ID do Confronto (Tie ID)</label>
                  <input
                    type="text"
                    name="tie_id"
                    id="tie_id"
                    value={formData.tie_id}
                    onChange={(e) => setFormData({ ...formData, tie_id: e.target.value })}
                    className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder={createTwoLegTie ? "Gerado automaticamente" : "Preencha para jogos de volta"}
                    disabled={createTwoLegTie || formData.leg !== 'second_leg'}
                  />
                </div>
                
                {/* Campos para a segunda mão (apenas se 'Criar Confronto de Ida e Volta' estiver marcado e não estiver editando) */}
                {createTwoLegTie && !editingMatch && (
                  <div className="mt-8 px-4 py-5 sm:p-6 bg-white shadow sm:rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Dados da Segunda Mão</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900">Data e Hora da Volta</label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.match_date_second_leg}
                          onChange={(e) => setFormData({ ...formData, match_date_second_leg: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900">Estádio da Volta</label>
                        <select
                          value={(formData.stadium_id_second_leg ?? '') as string}
                          onChange={(e) => setFormData({ ...formData, stadium_id_second_leg: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                        >
                          <option value="">Selecione o estádio</option>
                          {stadiums.map((stadium) => (
                            stadium && <option key={stadium.id || 'null-' + Math.random()} value={stadium.id?.toString() || ''}>{stadium.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Adicionado: Campo Estádio (para partidas únicas) */}
                {!createTwoLegTie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Estádio</label>
                    <select
                      value={(formData.stadium_id ?? '') as string}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('🔍 onChange Stadium Select - e.target.value:', value);
                        setFormData({
                          ...formData,
                          stadium_id: value === '' ? null : value, // Armazenar como string ou null
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    >
                      <option value="">Selecione o estádio</option>
                      {stadiums.map((stadium) => (
                        stadium && <option key={stadium.id || 'null-' + Math.random()} value={stadium.id?.toString() || ''}>
                          {stadium.name} ({stadium.city})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
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