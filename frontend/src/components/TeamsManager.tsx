'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'

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
  stadium?: Stadium;
  stadium_id?: number;
  created_at: string
}

export default function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [paginatedTeams, setPaginatedTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload')
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [selectedStadiumId, setSelectedStadiumId] = useState<string>('')
  
  // Estados do filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    city: '',
    state: '',
    founded_year: '',
    logo_url: '',
    stadium_id: ''
  })

  useEffect(() => {
    fetchTeams()
    fetchStadiums()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [teams, searchTerm, stateFilter])

  useEffect(() => {
    applyPagination()
  }, [filteredTeams, currentPage, itemsPerPage])

  const fetchStadiums = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list());
      const data = await response.json();
      setStadiums(data);
    } catch (error) {
      console.error('Erro ao carregar estádios:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...teams]

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por estado
    if (stateFilter) {
      filtered = filtered.filter(team => 
        team.state?.toLowerCase().includes(stateFilter.toLowerCase())
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
  }

  const getUniqueStates = () => {
    const states = new Set<string>()
    teams.forEach(team => {
      if (team.state) states.add(team.state)
    })
    return Array.from(states).sort()
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.teams.list())
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Erro ao carregar times:', error)
    } finally {
      setLoading(false)
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      formData.append('escudo', selectedFile)

      const response = await fetch(API_ENDPOINTS.teams.uploadLogo(teamId), {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.filePath
      }
      return null
    } catch (error) {
      console.error('Erro ao fazer upload do escudo:', error)
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
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null
        }),
      })

      if (response.ok) {
        const savedTeam = await response.json()
        
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
        
        fetchTeams()
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar time:', error)
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
      founded_year: '',
      logo_url: '',
      stadium_id: ''
    })
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setShowModal(true)
    setPreviewUrl(team.logo_url || '')
    setLogoInputType(team.logo_url ? 'url' : 'upload')
    setFormData({
      name: team.name,
      short_name: team.short_name || '',
      city: team.city || '',
      state: team.state || '',
      founded_year: team.founded_year?.toString() || '',
      logo_url: team.logo_url || '',
      stadium_id: team.stadium_id?.toString() || ''
    })
  }

  const handleDelete = async (id: number) => {
    const team = teams.find(t => t.id === id);
    const teamName = team?.name || 'este time';
    
    if (confirm(`Tem certeza que deseja excluir ${teamName}?`)) {
      try {
        const response = await fetch(API_ENDPOINTS.teams.byId(id), {
          method: 'DELETE',
        });

        if (response.ok) {
          // Sucesso
          alert('Time excluído com sucesso!');
          fetchTeams();
        } else {
          // Erro do servidor
          const errorText = await response.text();
          let errorMessage = 'Erro ao excluir time';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Se não conseguir fazer parse do JSON, usar o texto direto
            if (errorText.includes('Não é possível excluir')) {
              errorMessage = errorText;
            }
          }
          
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Erro ao excluir time:', error);
        alert('Erro de conexão. Tente novamente.');
      }
    }
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
                {Math.min(currentPage * itemsPerPage, filteredTeams.length)}
              </span>
              {' '}de{' '}
              <span className="font-medium">{filteredTeams.length}</span>
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
    return <div className="text-center">Carregando times...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Times</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os times cadastrados no sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Adicionar Time
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="mt-6 bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, nome curto, cidade..."
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Estado */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todos os estados</option>
            {getUniqueStates().map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          {/* Botão Limpar Filtros */}
          <div className="flex items-center justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Limpar filtros
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {filteredTeams.length} times encontrados
          </span>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-white dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome Curto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fundação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estádio
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTeams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {team.logo_url && (
                            <img 
                              className="h-6 w-6 rounded-md mr-3 object-cover" 
                              src={imageUrl(team.logo_url)} 
                              alt={`Escudo ${team.name}`}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-700">{team.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.short_name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.city && team.state ? `${team.city}, ${team.state}` : team.city || team.state || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.founded_year || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.stadium ? `${team.stadium.name} (${team.stadium.city || team.stadium.state || '-'})` : '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(team)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTeam ? 'Editar Time' : 'Adicionar Time'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome Curto</label>
                  <input
                    type="text"
                    required
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Ano de Fundação</label>
                  <input
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                
                {/* Campo Estádio */}
                <div>
                  <label htmlFor="stadium" className="block text-sm font-medium text-gray-900">Estádio</label>
                  <select
                    id="stadium"
                    name="stadium_id"
                    value={formData.stadium_id}
                    onChange={(e) => setFormData({ ...formData, stadium_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 px-4 py-3"
                  >
                    <option value="">Selecione um estádio (Opcional)</option>
                    {stadiums.map((stadium) => (
                      <option key={stadium.id} value={stadium.id}>
                        {stadium.name} {stadium.city ? `(${stadium.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Escudo do Time</label>
                  
                  <div className="mb-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="logoInputType"
                          value="upload"
                          checked={logoInputType === 'upload'}
                          onChange={(e) => {
                            setLogoInputType('upload')
                            setFormData(prev => ({ ...prev, logo_url: '' }))
                            setPreviewUrl('')
                          }}
                          className="mr-2"
                        />
                        Upload de Arquivo
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="logoInputType"
                          value="url"
                          checked={logoInputType === 'url'}
                          onChange={(e) => {
                            setLogoInputType('url')
                            setSelectedFile(null)
                            setPreviewUrl('')
                          }}
                          className="mr-2"
                        />
                        URL Externa
                      </label>
                    </div>
                  </div>
                  
                  {previewUrl && (
                    <div className="mb-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview do escudo" 
                        className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-team.png'
                        }}
                      />
                    </div>
                  )}
                  
                  {logoInputType === 'upload' ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="escudo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Enviar escudo</span>
                            <input
                              id="escudo-upload"
                              name="escudo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, SVG até 5MB
                        </p>
                        {selectedFile && (
                          <p className="text-xs text-green-600">
                            Arquivo selecionado: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        placeholder="https://exemplo.com/escudo.png"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cole a URL direta de uma imagem hospedada externamente
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {uploading ? 'Enviando...' : (editingTeam ? 'Atualizar' : 'Criar')}
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