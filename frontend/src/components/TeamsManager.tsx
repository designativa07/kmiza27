'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, apiUrl } from '../config/api'
import { getTeamLogoUrl, handleImageError } from '../lib/cdn'

interface Stadium {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

interface Team {
  id: number
  name: string
  slug: string
  short_name: string
  logo_url?: string
  founded_year?: number
  city?: string
  state?: string
  country?: string
  stadium?: Stadium;
  stadium_id?: number;
  created_at: string
}

interface Player {
  id: number;
  name: string;
  position?: string;
  image_url?: string;
}

interface PlayerTeamHistory {
  id: number;
  player_id: number;
  team_id: number;
  start_date: string;
  end_date?: string;
  jersey_number?: string;
  role?: string;
  player?: Player;
}

export default function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [paginatedTeams, setPaginatedTeams] = useState<Team[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload')
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [managingTeamRoster, setManagingTeamRoster] = useState<Team | null>(null)
  const [teamPlayersHistory, setTeamPlayersHistory] = useState<PlayerTeamHistory[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [selectedPlayerToAddId, setSelectedPlayerToAddId] = useState<string>('')
  const [playerJerseyNumber, setPlayerJerseyNumber] = useState<string>('')
  const [playerRole, setPlayerRole] = useState<string>('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  const [stateFilter, setStateFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    city: '',
    state: '',
    country: 'Brasil',
    founded_year: '',
    logo_url: '',
    stadium_id: ''
  })

  useEffect(() => {
    fetchAllTeams()
    fetchStadiums()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [teams, debouncedSearchTerm, stateFilter, countryFilter])

  useEffect(() => {
    applyPagination()
  }, [filteredTeams, currentPage])

  const fetchTeamPlayers = async (teamId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.teams.byId(teamId)}/players-history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PlayerTeamHistory[] = await response.json();
      setTeamPlayersHistory(data);
    } catch (error) {
      console.error(`Erro ao carregar histórico de jogadores do time ${teamId}:`, error);
      setTeamPlayersHistory([]);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.players.list()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Player[] = await response.json();
      setAllPlayers(data);
    } catch (error) {
      console.error('Erro ao carregar todos os jogadores:', error);
      setAllPlayers([]);
    }
  };

  const fetchStadiums = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list(1, 1000));
      const data = await response.json();
      setStadiums(data.data);
    } catch (error) {
      console.error('Erro ao carregar estádios:', error);
      setStadiums([]);
    }
  };

  const fetchAllTeams = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.teams.list(1, 1000)) // Buscar todos os times
      const paginatedData = await response.json()
      setTeams(paginatedData.data)
      setTotalTeams(paginatedData.total)
    } catch (error) {
      console.error('Erro ao carregar times:', error)
      setTeams([])
      setTotalTeams(0)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (!teams.length) return;
    
    let filtered = [...teams]

    // Filtro por termo de busca
    if (debouncedSearchTerm) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        team.short_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        team.city?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        team.state?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        team.country?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (stateFilter) {
      filtered = filtered.filter(team => 
        team.state?.toLowerCase() === stateFilter.toLowerCase()
      )
    }

    // Filtro por país
    if (countryFilter) {
      filtered = filtered.filter(team => 
        team.country?.toLowerCase() === countryFilter.toLowerCase()
      )
    }

    setFilteredTeams(filtered)
    setCurrentPage(1) // Reset para primeira página quando filtrar
  }

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedTeams(filteredTeams.slice(startIndex, endIndex))
  }

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStateFilter('')
    setCountryFilter('')
    setCurrentPage(1)
  }

  const getUniqueStates = () => {
    const states = new Set<string>()
    teams.forEach(team => {
      if (team.state) states.add(team.state)
    })
    return Array.from(states).sort()
  }

  const getUniqueCountries = () => {
    const countries = new Set<string>()
    teams.forEach(team => {
      if (team.country) countries.add(team.country)
    })
    return Array.from(countries).sort()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setFormData(prev => ({ ...prev, logo_url: '' }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'logo_url' && value) {
      setSelectedFile(null)
      setPreviewUrl(value)
    }
  }

  const uploadEscudo = async (teamId: number): Promise<string | null> => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('folder', 'escudos')
      formData.append('namingStrategy', 'name')
      formData.append('entityName', `time-${teamId}`)

      const response = await fetch(apiUrl('upload/cloud'), {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Upload do escudo bem-sucedido:', result)
        return result.url // URL do CDN
      } else {
        const errorText = await response.text()
        console.error('❌ Erro no upload do escudo:', errorText)
        return null
      }
    } catch (error) {
      console.error('❌ Erro de conexão no upload do escudo:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTeam 
        ? API_ENDPOINTS.teams.byId(editingTeam.id)
        : API_ENDPOINTS.teams.list()
      
      const method = editingTeam ? 'PATCH' : 'POST'
      
      // Preparar dados para envio, tratando campos vazios
      const dataToSend = {
        name: formData.name,
        short_name: formData.short_name,
        city: formData.city || null,
        state: formData.state || null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        logo_url: formData.logo_url || null,
        stadium_id: formData.stadium_id ? parseInt(formData.stadium_id) : null
      }

      // Log para debug
      console.log('🚀 Enviando dados do time:', dataToSend)
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        const savedTeam = await response.json()
        console.log('✅ Time salvo com sucesso:', savedTeam)
        
        if (selectedFile) {
          const uploadedPath = await uploadEscudo(savedTeam.id)
          if (uploadedPath) {
            await fetch(API_ENDPOINTS.teams.byId(savedTeam.id), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ logo_url: uploadedPath })
            })
          }
        }
        
        fetchAllTeams()
        resetForm()
      } else {
        // Log do erro para debug
        const errorText = await response.text()
        console.error('❌ Erro ao salvar time:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        alert(`Erro ao salvar time: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Erro de conexão ao salvar time:', error)
      alert('Erro de conexão ao salvar time.')
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingTeam(null)
    setSelectedFile(null)
    setPreviewUrl('')
    setLogoInputType('upload')
    setFormData({
      name: '',
      short_name: '',
      city: '',
      state: '',
      country: 'Brasil',
      founded_year: '',
      logo_url: '',
      stadium_id: ''
    })
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setShowModal(true)
    setFormData({
      name: team.name,
      short_name: team.short_name,
      city: team.city || '',
      state: team.state || '',
      country: team.country || 'Brasil',
      founded_year: team.founded_year?.toString() || '',
      logo_url: team.logo_url || '',
      stadium_id: team.stadium_id?.toString() || ''
    })
    if (team.logo_url) {
      setPreviewUrl(getTeamLogoUrl(team.logo_url))
      setLogoInputType('url')
    } else {
      setPreviewUrl('')
      setLogoInputType('upload')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este time?')) {
      try {
        await fetch(API_ENDPOINTS.teams.byId(id), {
          method: 'DELETE',
        })
        fetchAllTeams()
      } catch (error) {
        console.error('Erro ao excluir time:', error)
      }
    }
  }

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

  const PaginationControls = () => {
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
            className="ml-3 relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalTeams)}</span> de <span className="font-medium">{totalTeams}</span> resultados
            </p>
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
                  <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Botão Página Anterior */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página anterior"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {/* Números das Páginas */}
              {getPageNumbers().map((pageNumber, index) =>
                pageNumber === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber as number)}
                    aria-current={currentPage === pageNumber ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNumber ? 'bg-indigo-600 text-white focus:z-20 focus:outline-offset-0' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                  >
                    {pageNumber}
                  </button>
                )
              )}
              
              {/* Botão Próxima Página */}
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
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  const handleManageRoster = (team: Team) => {
    setManagingTeamRoster(team);
    setShowRosterModal(true);
    fetchTeamPlayers(team.id); // Carrega jogadores do time selecionado
    fetchAllPlayers(); // Carrega todos os jogadores para a lista de adição
  };

  const handleAddPlayerToTeam = async () => {
    if (!managingTeamRoster || !selectedPlayerToAddId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.teams.byId(managingTeamRoster.id)}/add-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: parseInt(selectedPlayerToAddId),
          start_date: new Date().toISOString().split('T')[0], // Data atual
          jersey_number: playerJerseyNumber || null,
          role: playerRole || null,
        }),
      });

      if (response.ok) {
        alert('Jogador adicionado ao elenco com sucesso!');
        setSelectedPlayerToAddId('');
        setPlayerJerseyNumber('');
        setPlayerRole('');
        fetchTeamPlayers(managingTeamRoster.id); // Recarrega o histórico do time
        fetchAllPlayers(); // Atualiza a lista de jogadores disponíveis (se necessário)
      } else {
        const errorData = await response.json();
        alert(`Erro ao adicionar jogador: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar jogador ao time:', error);
      alert('Erro de conexão ao adicionar jogador.');
    }
  };

  const handleRemovePlayerFromTeam = async (historyId: number, playerId: number) => {
    if (confirm('Tem certeza que deseja remover este jogador do elenco? Isso registrará a data de saída.')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.players.byId(playerId)}/remove-from-team`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            history_id: historyId,
            end_date: new Date().toISOString().split('T')[0], // Data atual como data de saída
          }),
        });

        if (response.ok) {
          alert('Jogador removido do elenco com sucesso!');
          if (managingTeamRoster) {
            fetchTeamPlayers(managingTeamRoster.id); // Recarrega o histórico
          }
        } else {
          const errorData = await response.json();
          alert(`Erro ao remover jogador: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('Erro ao remover jogador do time:', error);
        alert('Erro de conexão ao remover jogador.');
      }
    }
  };

  if (loading) {
    return <div className="text-center">Carregando times...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Times</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os times e suas informações, incluindo os elencos.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Time
          </button>
        </div>
      </div>

      <div className="mt-4 mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Buscar times..."
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
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Todos os Estados</option>
            {getUniqueStates().map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="">Todos os Países</option>
            {getUniqueCountries().map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Mostrando {paginatedTeams.length} de {filteredTeams.length} times
        </p>
        <button
          onClick={clearFilters}
          className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
        >
          Limpar Filtros
        </button>
      </div>

      <div className="-mx-4 mt-8 sm:-mx-0">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                Nome
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                Nome Curto
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">
                Cidade/Estado
              </th>
              <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">
                Fundado
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedTeams.map((team) => (
              <tr key={team.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                  <div className="flex items-center">
                    {team.logo_url && (
                      <img src={getTeamLogoUrl(team.logo_url)} alt={`${team.name} logo`} className="h-8 w-8 mr-2 object-contain" />
                    )}
                    {!team.logo_url && (
                      <div className="h-8 w-8 mr-2 flex items-center justify-center bg-gray-200 rounded-full text-xs font-semibold text-gray-600">
                        {team.short_name?.substring(0, 3) || '?'}
                      </div>
                    )}
                    {team.name}
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                  {team.short_name}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                  {team.city}{team.city && team.state ? '/' : ''}{team.state}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                  {team.founded_year || 'N/A'}
                </td>
                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <button
                    onClick={() => handleEdit(team)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Editar<span className="sr-only">, {team.name}</span>
                  </button>
                  <button
                    onClick={() => handleManageRoster(team)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Gerenciar Elenco"
                  >
                    <UserGroupIcon className="h-4 w-4" />
                    <span className="sr-only">Gerenciar Elenco, {team.name}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir<span className="sr-only">, {team.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <PaginationControls />

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{editingTeam ? 'Editar Time' : 'Adicionar Novo Time'}</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="short_name" className="block text-sm font-medium text-gray-700">Nome Curto</label>
                    <input
                      type="text"
                      name="short_name"
                      id="short_name"
                      value={formData.short_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700">Ano de Fundação</label>
                  <input
                    type="number"
                    name="founded_year"
                    id="founded_year"
                    value={formData.founded_year}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="stadium_id" className="block text-sm font-medium text-gray-700">Estádio</label>
                  <select
                    id="stadium_id"
                    name="stadium_id"
                    value={formData.stadium_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Nenhum</option>
                    {stadiums.map(stadium => (
                      <option key={stadium.id} value={stadium.id}>{stadium.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Escudo</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setLogoInputType('upload')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${logoInputType === 'upload' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoInputType('url')}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${logoInputType === 'url' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                      URL
                    </button>
                  </div>
                  {logoInputType === 'upload' ? (
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
                      name="logo_url"
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://exemplo.com/escudo.png"
                    />
                  )}
                  {previewUrl && (
                    <div className="mt-4">
                      <p className="block text-sm font-medium text-gray-700 mb-2">Prévia do Escudo:</p>
                      <img src={previewUrl} alt="Prévia do Escudo" className="h-20 w-20 object-contain" />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={uploading}
                  >
                    {editingTeam ? 'Salvar Alterações' : 'Adicionar Time'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRosterModal && managingTeamRoster && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="roster-modal">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Gerenciar Elenco: {managingTeamRoster.name}</h3>
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-800">Jogadores Atuais</h4>
                {teamPlayersHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum jogador no elenco.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-gray-200">
                    {teamPlayersHistory.map((history) => (
                      <li key={history.id} className="py-2 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{history.player?.name} ({history.jersey_number || 'N/A'})</p>
                          <p className="text-xs text-gray-500">{history.start_date} - {history.end_date || 'Presente'}</p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleRemovePlayerFromTeam(history.id, history.player_id)}
                            className="ml-3 text-red-600 hover:text-red-900 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800">Adicionar Jogador</h4>
                <div className="mt-2 space-y-3">
                  <div>
                    <label htmlFor="select-player" className="sr-only">Selecione um jogador</label>
                    <select
                      id="select-player"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={selectedPlayerToAddId}
                      onChange={(e) => setSelectedPlayerToAddId(e.target.value)}
                    >
                      <option value="">Selecione um jogador</option>
                      {allPlayers.map(player => (
                        <option key={player.id} value={player.id}>{player.name} ({player.position || 'N/A'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="jersey-number" className="sr-only">Número da Camisa</label>
                      <input
                        type="text"
                        id="jersey-number"
                        placeholder="Número da Camisa (Opcional)"
                        value={playerJerseyNumber}
                        onChange={(e) => setPlayerJerseyNumber(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="player-role" className="sr-only">Função no Time</label>
                      <input
                        type="text"
                        id="player-role"
                        placeholder="Função (Ex: Titular, Reserva)"
                        value={playerRole}
                        onChange={(e) => setPlayerRole(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPlayerToTeam}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPlayerToAddId}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar ao Elenco
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRosterModal(false);
                    setManagingTeamRoster(null);
                    setTeamPlayersHistory([]);
                    setSelectedPlayerToAddId('');
                    setPlayerJerseyNumber('');
                    setPlayerRole('');
                  }}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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