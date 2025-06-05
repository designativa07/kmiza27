'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface Stadium {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export default function StadiumsManager() {
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [filteredStadiums, setFilteredStadiums] = useState<Stadium[]>([])
  const [paginatedStadiums, setPaginatedStadiums] = useState<Stadium[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStadium, setEditingStadium] = useState<Stadium | null>(null)
  
  // Estados do filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  
  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    country: 'Brasil',
    capacity: '',
    latitude: '',
    longitude: '',
  })

  useEffect(() => {
    fetchStadiums()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [stadiums, searchTerm, cityFilter, stateFilter])

  useEffect(() => {
    applyPagination()
  }, [filteredStadiums, currentPage, itemsPerPage])

  const applyFilters = () => {
    let filtered = [...stadiums]

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(stadium => 
        stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stadium.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stadium.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stadium.country?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por cidade
    if (cityFilter) {
      filtered = filtered.filter(stadium => 
        stadium.city?.toLowerCase().includes(cityFilter.toLowerCase())
      )
    }

    // Filtro por estado
    if (stateFilter) {
      filtered = filtered.filter(stadium => 
        stadium.state?.toLowerCase().includes(stateFilter.toLowerCase())
      )
    }

    setFilteredStadiums(filtered)
    setCurrentPage(1) // Reset para primeira página quando filtrar
  }

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedStadiums(filteredStadiums.slice(startIndex, endIndex))
  }

  const totalPages = Math.ceil(filteredStadiums.length / itemsPerPage)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCityFilter('')
    setStateFilter('')
  }

  const getUniqueCities = () => {
    const cities = new Set<string>()
    stadiums.forEach(stadium => {
      if (stadium.city) cities.add(stadium.city)
    })
    return Array.from(cities).sort()
  }

  const getUniqueStates = () => {
    const states = new Set<string>()
    stadiums.forEach(stadium => {
      if (stadium.state) states.add(stadium.state)
    })
    return Array.from(states).sort()
  }

  const fetchStadiums = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list())
      const data = await response.json()
      setStadiums(data)
    } catch (error) {
      console.error('Erro ao carregar estádios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStadium 
        ? API_ENDPOINTS.stadiums.byId(editingStadium.id)
        : API_ENDPOINTS.stadiums.list()
      
      const method = editingStadium ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      })

      if (response.ok) {
        fetchStadiums()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Erro: ${errorData.message}`)
      }
    } catch (error) {
      console.error('Erro ao salvar estádio:', error)
      alert('Erro ao salvar estádio. Verifique o console para mais detalhes.')
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingStadium(null)
    setFormData({
      name: '',
      city: '',
      state: '',
      country: 'Brasil',
      capacity: '',
      latitude: '',
      longitude: '',
    })
  }

  const handleEdit = (stadium: Stadium) => {
    setEditingStadium(stadium)
    setShowModal(true)
    setFormData({
      name: stadium.name,
      city: stadium.city || '',
      state: stadium.state || '',
      country: stadium.country || 'Brasil',
      capacity: stadium.capacity?.toString() || '',
      latitude: stadium.latitude?.toString() || '',
      longitude: stadium.longitude?.toString() || '',
    })
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este estádio? Esta ação é irreversível.')) {
      try {
        const response = await fetch(API_ENDPOINTS.stadiums.byId(id), {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchStadiums()
        } else {
          const errorData = await response.json()
          alert(`Erro ao excluir estádio: ${errorData.message}`)
        }
      } catch (error) {
        console.error('Erro ao excluir estádio:', error)
        alert('Erro ao excluir estádio. Verifique o console para mais detalhes.')
      }
    }
  }

  const PaginationControls = () => {
    const getPageNumbers = () => {
      const pageNumbers = []
      const maxPagesToShow = 5
      const half = Math.floor(maxPagesToShow / 2)

      if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else if (currentPage <= half) {
        for (let i = 1; i <= maxPagesToShow; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...', totalPages)
      } else if (currentPage + half >= totalPages) {
        pageNumbers.push(1, '...')
        for (let i = totalPages - maxPagesToShow + 1; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        pageNumbers.push(1, '...')
        for (let i = currentPage - half; i <= currentPage + half; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...', totalPages)
      }
      return pageNumbers
    }

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> até{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredStadiums.length)}
              </span>{' '}
              de <span className="font-medium">{filteredStadiums.length}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {getPageNumbers().map((pageNumber, index) => (
                <span key={index}>
                  {pageNumber === '...' ? (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  ) : (
                    <button
                      onClick={() => goToPage(pageNumber as number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )}
                </span>
              ))}
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Próxima</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando estádios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-xl rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Estádios</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gerencie os estádios da plataforma
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Estádio
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar estádios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Cidade */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Todas as cidades</option>
            {getUniqueCities().map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

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
            {filteredStadiums.length} estádios encontrados
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
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      País
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacidade
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStadiums.map((stadium) => (
                    <tr key={stadium.id}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stadium.name}</div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {stadium.city && stadium.state ? `${stadium.city}, ${stadium.state}` : stadium.city || stadium.state || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {stadium.country || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {stadium.capacity?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(stadium)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stadium.id)}
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
                {editingStadium ? 'Editar Estádio' : 'Adicionar Estádio'}
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
                  <label className="block text-sm font-medium text-gray-900">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Capacidade</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>

                <div className="mt-4 flex justify-end gap-x-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    {editingStadium ? 'Salvar Alterações' : 'Adicionar Estádio'}
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