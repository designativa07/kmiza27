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
  is_knockout?: boolean;
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
  is_knockout?: boolean;
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
                    aria-label={`Selecionar canal ${channel.name}`}
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
  const [query, setQuery] = useState('');

  const filteredTeams = query === ''
    ? (Array.isArray(teams) ? teams.filter(t => t) : [])
    : (Array.isArray(teams) ? teams.filter(team =>
        team && team.name?.toLowerCase().includes(query.toLowerCase())
      ) : []);

  const selectedTeam = Array.isArray(teams) ? teams.find(team => team && team.id.toString() === value) : undefined;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <Combobox value={selectedTeam || null} onChange={(team: Team | null) => {
        if (team) {
          onChange(team.id.toString());
        }
      }}>
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
  const [query, setQuery] = useState('');

  const filteredPlayers = query === ''
    ? (Array.isArray(players) ? players.filter(p => p) : [])
    : (Array.isArray(players) ? players.filter(player =>
        player && player.name?.toLowerCase().includes(query.toLowerCase())
      ) : []);

  const selectedPlayer = Array.isArray(players) ? players.find(player => player && player.id === value) : undefined;

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
  const [availableRounds, setAvailableRounds] = useState<any[]>([])
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
  
  // Estados específicos para o modal de edição/criação
  const [availableGroupsForModal, setAvailableGroupsForModal] = useState<string[]>([])

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Estado para ordenação por data
  const [dateSort, setDateSort] = useState<'asc' | 'desc' | 'none'>('none');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

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
    is_knockout: false,
  })

  const [showPenalties, setShowPenalties] = useState(false);

  const fetchStadiums = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list(1, 1000)) // Buscar todos os estádios
      const data = await response.json()
      // A API retorna dados paginados: { data: Stadium[], total: number }
      if (data && Array.isArray(data.data)) {
        setStadiums(data.data)
        console.log('✅ Estádios carregados com sucesso:', data.data.length, 'estádios')
      } else if (Array.isArray(data)) {
        // Fallback para caso a API mude
        setStadiums(data)
        console.log('✅ Estádios carregados (formato direto):', data.length, 'estádios')
      } else {
        console.error('Formato de dados de estádios inesperado:', data)
        setStadiums([])
      }
    } catch (error) {
      console.error('Erro ao carregar estádios:', error)
      setStadiums([])
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
      const responseData = await response.json();
      
      // Corrigido para lidar com a resposta paginada do backend
      if (responseData && Array.isArray(responseData.data)) {
        const players = responseData.data.map((entry: PlayerTeamHistoryResponse) => entry.player);
        setPlayers(players);
      } else if (Array.isArray(responseData)) { // Fallback para o caso da API retornar um array diretamente
        const players = responseData.map((entry: PlayerTeamHistoryResponse) => entry.player);
        setPlayers(players);
      } else {
        console.error(`A resposta para os jogadores do time ${teamId} não é um array ou objeto esperado:`, responseData);
        setPlayers([]);
      }
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
  }, [filters, matches, dateSort])

  useEffect(() => {
    applyPagination()
  }, [filteredMatches, currentPage])

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
      fetchGroupsByCompetition(formData.competition_id)
    } else {
      setAvailableGroupsForModal([])
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
        fetch(API_ENDPOINTS.matches.list(1, 5000)),
        fetch(`${API_ENDPOINTS.teams.list()}?limit=1000`),
        fetch(`${API_ENDPOINTS.competitions.list()}?active=true`),
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
        if (teamsData && Array.isArray(teamsData.data)) {
          setTeams(teamsData.data)
        } else if (Array.isArray(teamsData)) {
          setTeams(teamsData)
        } else {
          console.error('Teams data is not in expected format:', teamsData)
          setTeams([])
        }
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
      // Usar o novo endpoint do módulo de matches que retorna rodadas ordenadas por display_order
      const response = await fetch(`${API_ENDPOINTS.matches.list(1, 1).split('?')[0]}/competition/${competitionId}/rounds`)
      if (response.ok) {
        const rounds = await response.json()
        setAvailableRounds(rounds)
      }
    } catch (error) {
      console.error('Erro ao buscar rodadas:', error)
      setAvailableRounds([])
    }
  }

  // Nova função para buscar grupos específicos da competição para o modal
  const fetchGroupsByCompetition = async (competitionId: string) => {
    if (!competitionId) {
      setAvailableGroupsForModal([])
      return
    }
    
    try {
      // Buscar diretamente da configuração da competição (times e seus grupos)
      const response = await fetch(`${API_ENDPOINTS.competitions.list()}/${competitionId}/teams`)
      if (response.ok) {
        const competitionTeams = await response.json()
        
        // Extrair grupos únicos dos times da competição
        const groups = new Set<string>()
        competitionTeams.forEach((ct: any) => {
          if (ct.group_name) {
            groups.add(ct.group_name)
          }
        })
        
        const sortedGroups = Array.from(groups).sort()
        setAvailableGroupsForModal(sortedGroups)
        console.log('Grupos encontrados na competição:', sortedGroups)
      }
    } catch (error) {
      console.error('Erro ao buscar grupos da competição:', error)
      setAvailableGroupsForModal([])
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

  }

  const applyFilters = () => {
    if (!Array.isArray(matches)) {
      setFilteredMatches([]);
      return;
    }

    let filtered = [...matches];

    if (filters.competition) {
      filtered = filtered.filter(match => match.competition?.id?.toString() === filters.competition);
    }

    if (filters.round) {
      filtered = filtered.filter(match => match.round?.id?.toString() === filters.round);
    }

    if (filters.group) {
      filtered = filtered.filter(match => match.group_name?.toLowerCase().includes(filters.group.toLowerCase()));
    }

    if (filters.phase) {
      filtered = filtered.filter(match => match.phase?.toLowerCase().includes(filters.phase.toLowerCase()));
    }

    if (filters.status) {
      filtered = filtered.filter(match => match.status?.toLowerCase().includes(filters.status.toLowerCase()));
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(match => 
        match.home_team?.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.away_team?.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.competition?.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (dateSort !== 'none') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.match_date).getTime();
        const dateB = new Date(b.match_date).getTime();
        return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredMatches(filtered);
    
    // Reset para página 1 quando os filtros mudam
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  };

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
    setDateSort('none');
    setCurrentPage(1); // Mantido: Ao limpar filtros, volta para a página 1
  }

  const toggleDateSort = () => {
    setDateSort(prev => {
      switch (prev) {
        case 'none': return 'asc'
        case 'asc': return 'desc'
        case 'desc': return 'none'
        default: return 'asc'
      }
    })
    setCurrentPage(1) // Reset para primeira página ao mudar ordenação
  }

  const getUniqueRoundsByCompetition = (competitionId: string): { id: number; name: string }[] => {
    if (!Array.isArray(matches)) {
      return [];
    }
  
    const roundsMap = new Map<number, { id: number; name: string }>();
    matches.forEach(match => {
      if (match.competition?.id?.toString() === competitionId && match.round?.id && match.round?.name) {
        if (!roundsMap.has(match.round.id)) {
          roundsMap.set(match.round.id, { id: match.round.id, name: match.round.name });
        }
      }
    });
  
    return Array.from(roundsMap.values()).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ''));
      const numB = parseInt(b.name.replace(/\D/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.name.localeCompare(b.name);
    });
  };

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
        fetch(`${API_ENDPOINTS.competitions.list()}?active=true`)
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
    
    // Validações básicas
    if (!formData.home_team_id || !formData.away_team_id) {
      alert('Selecione os times da casa e visitante')
      return
    }
    
    if (!formData.competition_id) {
      alert('Selecione uma competição')
      return
    }

    if (createTwoLegTie && !editingMatch) {
      if (!formData.match_date_second_leg) {
        alert('Informe a data da segunda mão')
        return
      }
      if (!formData.stadium_id_second_leg) {
        alert('Selecione o estádio da segunda mão')
        return
      }
    }

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
        match_date: new Date(formData.match_date).toISOString(),
        broadcast_channels: formData.broadcast_channels || null,
        channel_ids: formData.channel_ids,
        home_score: formData.home_score !== undefined ? formData.home_score : null,
        away_score: formData.away_score !== undefined ? formData.away_score : null,
        home_yellow_cards: formData.home_yellow_cards !== undefined ? formData.home_yellow_cards : null,
        away_yellow_cards: formData.away_yellow_cards !== undefined ? formData.away_yellow_cards : null,
        home_red_cards: formData.home_red_cards !== undefined ? formData.home_red_cards : null,
        away_red_cards: formData.away_red_cards !== undefined ? formData.away_red_cards : null,
        home_score_penalties: formData.home_score_penalties !== undefined ? formData.home_score_penalties : null,
        away_score_penalties: formData.away_score_penalties !== undefined ? formData.away_score_penalties : null,
        leg: formData.leg,
        tie_id: formData.tie_id === '' ? null : formData.tie_id,
        home_team_player_stats: formData.home_team_player_stats,
        away_team_player_stats: formData.away_team_player_stats,
        // Automaticamente definir como mata-mata se for confronto ida e volta
        is_knockout: formData.is_knockout || formData.leg === 'first_leg' || formData.leg === 'second_leg' || createTwoLegTie,
      };

      if (editingMatch) {
        // Editando jogo existente
        url = API_ENDPOINTS.matches.update(editingMatch.id);
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
        // Criando confronto de ida e volta
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
        
        console.log('🏆 Criando confronto de ida e volta:', payload);
      } else {
        // Criando jogo único
        url = API_ENDPOINTS.matches.list();
        method = 'POST';
        payload = {
          home_team_id: parseInt(String(formData.home_team_id || '')),
          away_team_id: parseInt(String(formData.away_team_id || '')),
          stadium_id: formData.stadium_id === null || formData.stadium_id === ''
            ? null
            : parseInt(String(formData.stadium_id)),
          ...basePayload,
        };
      }

      console.log('🔍 Frontend - Enviando payload:', payload);
      console.log('🔍 Frontend - home_score enviado:', payload.home_score);
      console.log('🔍 Frontend - away_score enviado:', payload.away_score);

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
        
        // Mensagem de sucesso específica
        if (createTwoLegTie && !editingMatch) {
          alert('✅ Confronto de ida e volta criado com sucesso!')
        } else if (editingMatch) {
          alert('✅ Jogo atualizado com sucesso!')
        } else {
          alert('✅ Jogo criado com sucesso!')
        }
        
        setShowModal(false)
        setEditingMatch(null)
        resetForm()
        
        // Aguardar um pouco mais para garantir que o backend processou
        setTimeout(() => {
          console.log('🔄 Recarregando dados após operação...');
          fetchData()
        }, 800)
      } else {
        const errorText = await response.text();
        console.error('❌ Frontend - Erro na resposta:', response.status, errorText);
        
        // Tentar parsear como JSON para obter mais detalhes
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {
          errorMessage = errorText || `Erro ${response.status}`;
        }
        
        alert(`❌ Erro ao salvar: ${errorMessage}`)
      }
    } catch (error) {
      console.error('❌ Frontend - Erro ao salvar jogo:', error)
      alert('❌ Erro de conexão. Verifique sua internet e tente novamente.')
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
      is_knockout: false,
    })
    setCreateTwoLegTie(false)
    setSelectedHomeGoalPlayerId(undefined);
    setSelectedAwayGoalPlayerId(undefined);
    // Limpar estados auxiliares do modal
    setAvailableRounds([])
    setAvailableGroupsForModal([])
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

    const stadiumId = typeof match.stadium === 'number'
      ? match.stadium
      : (match.stadium?.id || null);

    // Extrair os IDs dos canais do array de broadcasts
    const broadcastChannelIds = Array.isArray((match as any).broadcasts)
      ? (match as any).broadcasts.map((b: any) => b.channel?.id).filter(Boolean)
      : [];

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
      channel_ids: broadcastChannelIds.length > 0 ? broadcastChannelIds : (match.channel_ids || []),
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
      stadium_id: stadiumId !== null ? stadiumId.toString() : null, // Correção aqui
      home_team_player_stats: match.home_team_player_stats || [],
      away_team_player_stats: match.away_team_player_stats || [],
      is_knockout: match.is_knockout,
    } as MatchFormData;

    setFormData(newFormData);
    setShowModal(true)
    console.log('🔍 handleEdit - stadium_id após processamento:', newFormData.stadium_id);
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      try {
        await fetch(API_ENDPOINTS.matches.byId(id), {
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
                aria-label="Selecionar itens por página"
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
    const newStat: MatchPlayerStat = {
      player_id: teamType === 'home' ? selectedHomeGoalPlayerId! : selectedAwayGoalPlayerId!,
      goals: 1, // Começa com 1 gol ao adicionar
    };

    setFormData(prevData => {
      const currentStats = teamType === 'home' ? prevData.home_team_player_stats : prevData.away_team_player_stats;
      const updatedStats = [...currentStats, newStat];

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
  const calculateTotalScore = (playerStats: MatchPlayerStat[]): number | undefined => {
    const total = playerStats.reduce((total, stat) => total + (stat.goals || 0), 0);
    return total === 0 ? undefined : total; // Retorna undefined se o total for 0
  };

  // Função para sincronizar o placar total com os gols dos jogadores
  const syncScoreWithPlayerGoals = () => {
    setFormData(prevData => ({
      ...prevData,
      home_score: calculateTotalScore(prevData.home_team_player_stats),
      away_score: calculateTotalScore(prevData.away_team_player_stats),
    }));
  };

  // Efeito para sincronizar automaticamente o placar quando os gols dos jogadores mudarem
  useEffect(() => {
    if (formData.home_team_player_stats.length > 0 || formData.away_team_player_stats.length > 0) {
      syncScoreWithPlayerGoals();
    }
  }, [formData.home_team_player_stats, formData.away_team_player_stats]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Resetar para a primeira página ao mudar um filtro
  };

  useEffect(() => {
    fetchData()
  }, [filters, dateSort])

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
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">🎯 Filtros de Jogos</h3>
              {dateSort !== 'none' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📅 {dateSort === 'asc' ? 'Data: Crescente' : 'Data: Decrescente'}
                </span>
              )}
            </div>
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
                aria-label="Filtrar por competição"
              >
                <option value="">Todas</option>
                {Array.isArray(competitions) && competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="round-filter" className="block text-sm font-medium text-gray-700 mb-2">🔄 Rodada</label>
              <select
                id="round-filter"
                name="round"
                value={filters.round}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm h-10"
                disabled={!filters.competition}
              >
                <option value="">Todas</option>
                {filters.competition && getUniqueRoundsByCompetition(filters.competition).map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
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
                aria-label="Filtrar por grupo"
              >
                <option value="">Todos</option>
                {filters.competition && Array.isArray(getUniqueGroupsByCompetition(filters.competition)) && getUniqueGroupsByCompetition(filters.competition).map((group) => (
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
                aria-label="Filtrar por fase"
              >
                <option value="">Todas</option>
                {Array.isArray(getUniquePhasesByCompetition(filters.competition)) && getUniquePhasesByCompetition(filters.competition).map((phase) => (
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
                aria-label="Filtrar por status"
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
                      <button
                        onClick={toggleDateSort}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        title={`Ordenar por data ${dateSort === 'none' ? '(clique para crescente)' : dateSort === 'asc' ? '(crescente - clique para decrescente)' : '(decrescente - clique para remover)'}`}
                      >
                        <span>📅 Data/Hora</span>
                        {dateSort === 'asc' && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                        {dateSort === 'desc' && (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                        {dateSort === 'none' && (
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </button>
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
                        <div className="grid grid-cols-3 items-center gap-2">
                          {/* ID da partida - pequeno e discreto */}
                          <div className="col-span-3 text-xs text-gray-400 mb-1">
                            ID: {match.id}
                          </div>
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
                          aria-label={`Editar jogo ${match.home_team?.name || 'Time A'} vs ${match.away_team?.name || 'Time B'}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Excluir jogo ${match.home_team?.name || 'Time A'} vs ${match.away_team?.name || 'Time B'}`}
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
          <div className="relative top-2 mx-auto p-4 border w-[95vw] max-w-8xl shadow-lg rounded-md bg-white max-h-[96vh] overflow-y-auto">
            <div className="mt-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-inter-medium text-gray-900 tracking-tight">
                  {editingMatch ? 'Editar Jogo' : 'Adicionar Jogo'}
                </h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingMatch(null)
                      resetForm()
                    }}
                    className="rounded-md border border-gray-300 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    form="match-form"
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
                  >
                    {editingMatch 
                      ? 'Atualizar Jogo' 
                      : createTwoLegTie 
                        ? '🔄 Criar Ida e Volta' 
                        : 'Criar Jogo'
                    }
                  </button>
                </div>
              </div>
              <form id="match-form" onSubmit={handleSubmit} className="space-y-3">
                
                {/* Checkboxes para Ida e Volta + Mata-mata - TOPO DO FORMULÁRIO */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Checkbox Ida e Volta */}
                    {!editingMatch && (
                      <div>
                        <div className="flex items-center">
                          <input
                            id="create_two_leg_tie"
                            name="create_two_leg_tie"
                            type="checkbox"
                            checked={createTwoLegTie}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setCreateTwoLegTie(isChecked);
                              if (isChecked) {
                                // Gerar automaticamente um tie_id único quando marcar ida e volta
                                const newTieId = crypto.randomUUID();
                                setFormData(prev => ({ ...prev, leg: 'first_leg', tie_id: newTieId, is_knockout: true }));
                              } else {
                                setFormData(prev => ({ ...prev, leg: '', tie_id: '', match_date_second_leg: '', stadium_id_second_leg: '', is_knockout: false }));
                              }
                            }}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="create_two_leg_tie" className="ml-3 block text-xs font-inter-medium text-blue-800">
                            🔄 Criar Confronto de Ida e Volta
                          </label>
                        </div>
                        {createTwoLegTie && (
                          <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded border border-blue-200">
                            ℹ️ <strong>Automaticamente:</strong> Cria jogo de ida e volta + marca como mata-mata
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Checkbox Mata-mata */}
                    <div>
                      <div className="flex items-center">
                        <input
                          id="is_knockout"
                          type="checkbox"
                          checked={formData.is_knockout || false}
                          onChange={(e) => setFormData({ ...formData, is_knockout: e.target.checked })}
                          disabled={createTwoLegTie || formData.leg === 'first_leg' || formData.leg === 'second_leg'}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <label htmlFor="is_knockout" className="ml-3 block text-xs font-inter-medium text-red-800">
                          🏆 Partida mata-mata
                        </label>
                      </div>
                      {(createTwoLegTie || formData.leg === 'first_leg' || formData.leg === 'second_leg') && (
                        <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded border border-red-200">
                          ℹ️ <strong>Automático:</strong> Confrontos ida e volta são sempre mata-mata
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                                 {/* Seção 1: Times e Placares - Layout Horizontal */}
                 <div className="bg-gray-50 p-2 rounded-lg">
                   {/* Times e Placares na mesma linha */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-2 gap-y-4 items-end mb-2">
                     <div className="lg:col-span-2">
                       <TeamAutocomplete
                         teams={teams}
                         value={formData.home_team_id}
                         onChange={(teamId) => {
                           setFormData({ ...formData, home_team_id: teamId })
                           fetchPlayersByTeam(teamId, setHomeTeamPlayers)
                         }}
                         label="Time da Casa"
                       />
                     </div>
                     <div className="lg:col-span-1">
                       <label className="block text-xs font-medium text-gray-600">Placar Casa</label>
                       <input
                         type="number"
                         value={formData.home_score == null ? '' : formData.home_score}
                         onChange={(e) => setFormData({ ...formData, home_score: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                         className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center font-bold"
                         title="Placar do Time da Casa"
                       />
                     </div>
                     <div className="lg:col-span-1">
                       <label className="block text-xs font-medium text-gray-600">Placar Visitante</label>
                       <input
                         type="number"
                         value={formData.away_score == null ? '' : formData.away_score}
                         onChange={(e) => setFormData({ ...formData, away_score: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                         className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-center font-bold"
                         title="Placar do Time Visitante"
                       />
                     </div>
                     <div className="lg:col-span-2">
                       <TeamAutocomplete
                         teams={teams}
                         value={formData.away_team_id}
                         onChange={(teamId) => {
                           setFormData({ ...formData, away_team_id: teamId })
                           fetchPlayersByTeam(teamId, setAwayTeamPlayers)
                         }}
                         label="Time Visitante"
                       />
                     </div>
                     <div className="lg:col-span-1 flex justify-center">
                       <button
                         type="button"
                         onClick={syncScoreWithPlayerGoals}
                         className="px-2 py-2 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors w-12 h-10"
                         title="Sincronizar placares com gols dos jogadores"
                       >
                         🔄
                       </button>
                     </div>
                     <div className="lg:col-span-2">
                       <label htmlFor="match_date" className="block text-sm font-medium text-gray-700">Data e Hora</label>
                       <input
                         id="match_date"
                         type="datetime-local"
                         required
                         value={formData.match_date}
                         onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                       />
                     </div>
                     {/* Novo local para o estádio */}
                     <div className="lg:col-span-2">
                       <label className="block text-sm font-medium text-gray-700">Estádio da Partida</label>
                       <select
                         id="stadium_id"
                         value={formData.stadium_id || ''}
                         onChange={(e) => setFormData({ ...formData, stadium_id: e.target.value })}
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                         aria-label="Selecionar estádio da partida"
                       >
                         <option value="">Selecione o estádio</option>
                         {Array.isArray(stadiums) && stadiums.length > 0 ? (
                           stadiums.map((stadium) => (
                             stadium && stadium.id && <option key={stadium.id} value={stadium.id}>
                               {stadium.name}{stadium.city ? ` (${stadium.city})` : ''}
                             </option>
                           ))
                         ) : (
                           <option value="" disabled>Nenhum estádio disponível</option>
                         )}
                       </select>
                     </div>
                     <div className="lg:col-span-1">
                       <label className="block text-sm font-medium text-gray-700">Status</label>
                       <select
                         value={formData.status}
                         onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                         aria-label="Selecionar status da partida"
                       >
                         <option value="scheduled">Agendado</option>
                         <option value="live">Ao Vivo</option>
                         <option value="finished">Finalizado</option>
                         <option value="postponed">Adiado</option>
                         <option value="cancelled">Cancelado</option>
                       </select>
                     </div>
                   </div>

                  {/* Checkbox para Pênaltis */}
                  <div className="mt-4 flex items-center">
                    <input
                      id="show_penalties"
                      type="checkbox"
                      checked={showPenalties}
                      onChange={(e) => setShowPenalties(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="show_penalties" className="ml-2 block text-sm text-gray-700">
                      ⚽ Decisão por Pênaltis
                    </label>
                  </div>

                  {/* Campos de Pênaltis (condicionais) */}
                  {showPenalties && (
                    <div className="mt-3 grid grid-cols-4 gap-3 bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div>
                        <label className="block text-xs font-medium text-yellow-700">Pênaltis Mandante</label>
                        <input
                          type="number"
                          value={formData.home_score_penalties == null ? '' : formData.home_score_penalties}
                          onChange={(e) => setFormData({ ...formData, home_score_penalties: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm text-center font-bold"
                          title="Placar de Pênaltis do Mandante"
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-lg font-bold text-yellow-600">🥅</span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-yellow-700">Pênaltis Visitante</label>
                        <input
                          type="number"
                          value={formData.away_score_penalties == null ? '' : formData.away_score_penalties}
                          onChange={(e) => setFormData({ ...formData, away_score_penalties: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-yellow-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm text-center font-bold"
                          title="Placar de Pênaltis do Visitante"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-yellow-600">Após empate</span>
                      </div>
                    </div>
                  )}


                </div>

                {/* Novo contêiner para Gols e Cartões */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Seção 2: Gols dos Jogadores */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-xs font-inter-medium text-gray-800 mb-3 uppercase tracking-wide">⚽ Registrar Gols dos Jogadores</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Time da Casa */}
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-inter-medium text-gray-900">{Array.isArray(teams) && teams.find(t => t.id.toString() === formData.home_team_id)?.name || 'Time da Casa'}</h5>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {calculateTotalScore(formData.home_team_player_stats)} gol(s)
                          </span>
                        </div>
                        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                          {formData.home_team_player_stats.filter(stat => stat.goals && stat.goals > 0).map((stat) => {
                            const player = homeTeamPlayers.find(p => p.id === stat.player_id);
                            return (
                              <div key={stat.player_id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{player?.name || 'Jogador desconhecido'}</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-green-600">{stat.goals} gol(s)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGoal('home', stat.player_id)}
                                    className="p-1 text-red-600 hover:text-red-900"
                                    title="Remover gol(s)"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <PlayerAutocomplete
                              players={homeTeamPlayers}
                              value={selectedHomeGoalPlayerId}
                              onChange={(playerId) => handleGoalPlayerChange('home', playerId)}
                              label="Jogador"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddGoal('home')}
                            disabled={!formData.home_team_id || !selectedHomeGoalPlayerId}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Adicionar gol"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Time Visitante */}
                      <div className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-inter-medium text-gray-900">{Array.isArray(teams) && teams.find(t => t.id.toString() === formData.away_team_id)?.name || 'Time Visitante'}</h5>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {calculateTotalScore(formData.away_team_player_stats)} gol(s)
                          </span>
                        </div>
                        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                          {formData.away_team_player_stats.filter(stat => stat.goals && stat.goals > 0).map((stat) => {
                            const player = awayTeamPlayers.find(p => p.id === stat.player_id);
                            return (
                              <div key={stat.player_id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{player?.name || 'Jogador desconhecido'}</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-green-600">{stat.goals} gol(s)</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGoal('away', stat.player_id)}
                                    className="p-1 text-red-600 hover:text-red-900"
                                    title="Remover gol(s)"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <PlayerAutocomplete
                              players={awayTeamPlayers}
                              value={selectedAwayGoalPlayerId}
                              onChange={(playerId) => handleGoalPlayerChange('away', playerId)}
                              label="Jogador"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddGoal('away')}
                            disabled={!formData.away_team_id || !selectedAwayGoalPlayerId}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            title="Adicionar gol"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção 3: Cartões e Transmissão */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-xs font-inter-medium text-gray-800 mb-3 uppercase tracking-wide">🟨 Cartões</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amarelos Casa</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.home_yellow_cards ?? ''}
                          onChange={(e) => setFormData({ ...formData, home_yellow_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vermelhos Casa</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.home_red_cards ?? ''}
                          onChange={(e) => setFormData({ ...formData, home_red_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amarelos Visitante</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.away_yellow_cards ?? ''}
                          onChange={(e) => setFormData({ ...formData, away_yellow_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vermelhos Visitante</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.away_red_cards ?? ''}
                          onChange={(e) => setFormData({ ...formData, away_red_cards: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    
                    {/* Transmissão dentro da seção de cartões */}
                    <div className="border-t border-yellow-200 pt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">📺 Transmissão</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <ChannelMultiSelect
                            channels={channels}
                            selectedIds={formData.channel_ids}
                            onChange={(ids) => setFormData({ ...formData, channel_ids: ids })}
                            label="Canais de Transmissão"
                          />
                        </div>
                        <div>
                          <label htmlFor="broadcast_channels" className="block text-sm font-medium text-gray-700">LINK direto para transmissão</label>
                          <input
                            type="text"
                            name="broadcast_channels"
                            id="broadcast_channels"
                            value={formData.broadcast_channels}
                            onChange={(e) => setFormData({ ...formData, broadcast_channels: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção 4: Informações da Partida - Todos os campos na mesma linha */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-xs font-inter-medium text-gray-800 mb-3 uppercase tracking-wide">📋 Informações da Partida</h4>
                  
                  {/* Todos os campos na mesma linha */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="competition_id" className="block text-sm font-inter-medium text-gray-700 mb-2">
                        🏆 Competição
                      </label>
                      <select
                        id="competition_id"
                        required
                        value={formData.competition_id}
                        onChange={(e) => {
                          const newCompetitionId = e.target.value;
                          setFormData({
                            ...formData,
                            competition_id: newCompetitionId,
                            round_id: '',
                            group_name: '',
                            phase: '',
                          });
                          if (newCompetitionId) {
                            fetchRoundsByCompetition(newCompetitionId);
                          } else {
                            setAvailableRounds([]);
                          }
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-sm px-2 py-2"
                      >
                        <option value="">Selecione competição...</option>
                        {Array.isArray(competitions) && competitions.map((comp) => (
                          <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="round_id" className="block text-sm font-inter-medium text-gray-700 mb-2">📅 Rodada</label>
                      <div className="space-y-1">
                        <select
                          id="round_id"
                          value={formData.round_id}
                          onChange={(e) => setFormData({ ...formData, round_id: e.target.value, round_name: '' })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-sm px-2 py-2"
                          disabled={!formData.competition_id || availableRounds.length === 0}
                        >
                          <option value="">Selecione rodada...</option>
                          {Array.isArray(availableRounds) && availableRounds.map((round) => (
                            <option key={round.id} value={round.id}>{round.name}</option>
                          ))}
                        </select>
                        <div className="text-center text-xs text-gray-400">ou</div>
                        <label htmlFor="round_name" className="sr-only">Nova rodada</label>
                        <input
                          id="round_name"
                          type="text"
                          value={formData.round_name || ''}
                          onChange={(e) => setFormData({ ...formData, round_name: e.target.value, round_id: '' })}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-sm px-2 py-2"
                          placeholder="Nova rodada (ex: Rodada 13)"
                        />
                      </div>
                      {!formData.competition_id && (
                        <p className="mt-1 text-xs text-gray-400">Selecione competição primeiro</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="group_name" className="block text-sm font-inter-medium text-gray-700 mb-2">👥 Grupo</label>
                      <select
                        id="group_name"
                        value={formData.group_name}
                        onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-sm px-2 py-2"
                        disabled={!formData.competition_id}
                      >
                        <option value="">Selecione grupo</option>
                        {availableGroupsForModal.map((group) => (
                          <option key={group} value={group}>
                            Grupo {group}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="phase" className="block text-sm font-inter-medium text-gray-700 mb-2">⚡ Fase</label>
                      <input
                        id="phase"
                        type="text"
                        value={formData.phase}
                        onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 text-sm px-2 py-2"
                        placeholder="Ex: Oitavas, Quartas, Semifinal, Final"
                      />
                    </div>
                  </div>
                </div>

                {/* Campos para a segunda mão (apenas se 'Criar Confronto de Ida e Volta' estiver marcado e não estiver editando) */}
                {createTwoLegTie && !editingMatch && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-3">🔄 Dados da Segunda Mão</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="match_date_second_leg" className="block text-sm font-medium text-gray-700">📅 Data e Hora da Volta</label>
                        <input
                          id="match_date_second_leg"
                          type="datetime-local"
                          required
                          value={formData.match_date_second_leg}
                          onChange={(e) => setFormData({ ...formData, match_date_second_leg: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="stadium_id_second_leg" className="block text-sm font-medium text-gray-700">🏟️ Estádio do Jogo de Volta</label>
                        <select
                          id="stadium_id_second_leg"
                          value={formData.stadium_id_second_leg || ''}
                          onChange={(e) => setFormData({ ...formData, stadium_id_second_leg: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Selecionar estádio...</option>
                          {Array.isArray(stadiums) && stadiums.map((stadium) => (
                            <option key={stadium.id} value={stadium.id}>
                              {stadium.name} {stadium.city ? `- ${stadium.city}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          <strong>🔄 Times na volta:</strong><br/>
                          <span className="text-blue-600">Mandante:</span> {teams.find(t => t.id.toString() === formData.away_team_id)?.name || 'Selecione time visitante'}<br/>
                          <span className="text-red-600">Visitante:</span> {teams.find(t => t.id.toString() === formData.home_team_id)?.name || 'Selecione time da casa'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 