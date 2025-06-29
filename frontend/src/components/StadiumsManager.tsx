'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, PhotoIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { getStadiumImageUrl } from '@/lib/cdn'

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
  image_url?: string;
  url?: string;
}

export default function StadiumsManager() {
  const [stadiums, setStadiums] = useState<Stadium[]>([])
  const [filteredStadiums, setFilteredStadiums] = useState<Stadium[]>([])
  const [paginatedStadiums, setPaginatedStadiums] = useState<Stadium[]>([])
  const [totalStadiums, setTotalStadiums] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStadium, setEditingStadium] = useState<Stadium | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Estados do filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
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
    url: '',
  })

  useEffect(() => {
    fetchStadiums(currentPage, debouncedSearchTerm)
  }, [currentPage, debouncedSearchTerm])

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

  const totalPages = Math.ceil(totalStadiums / itemsPerPage)

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

  const fetchStadiums = async (page: number, search: string) => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.stadiums.list(page, itemsPerPage, search))
      const paginatedData = await response.json()
      setPaginatedStadiums(paginatedData.data)
      setTotalStadiums(paginatedData.total)
    } catch (error) {
      console.error('Erro ao carregar estádios:', error)
      setPaginatedStadiums([])
      setTotalStadiums(0)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('--- Iniciando handleSubmit ---');
    console.log('É modo de edição?', !!editingStadium);
    console.log('Arquivo de imagem selecionado?', imageFile);

    let stadiumIdToUpdate = editingStadium?.id;

    // Se estiver criando um estádio, primeiro crie-o para obter um ID
    if (!editingStadium) {
      try {
        const response = await fetch(API_ENDPOINTS.stadiums.list(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            capacity: formData.capacity ? parseInt(formData.capacity) : null,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          alert(`Erro ao criar estádio: ${errorData.message}`);
          return;
        }
        const newStadium = await response.json();
        stadiumIdToUpdate = newStadium.id;
      } catch (error) {
        console.error('Erro ao criar estádio:', error);
        alert('Erro ao criar estádio. Verifique o console para mais detalhes.');
        return;
      }
    }

    // Se há um arquivo de imagem, faça o upload agora que temos um ID
    if (stadiumIdToUpdate && imageFile) {
      console.log(`Entrou no bloco de upload. ID: ${stadiumIdToUpdate}`);
      const imageFormData = new FormData();
      imageFormData.append('image', imageFile);

      try {
        const uploadResponse = await fetch(API_ENDPOINTS.stadiums.uploadImage(stadiumIdToUpdate), {
          method: 'POST',
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Falha no upload da imagem');
        }
        const uploadedImageStadium = await uploadResponse.json();
        // Atualiza o formData com a URL da imagem
        setFormData(prev => ({
          ...prev,
          url: uploadedImageStadium.image_url || prev.url,
        }));
        
        // Atualiza o estádio com a URL da imagem
        if (editingStadium) {
            const finalData = {
              ...formData,
              capacity: formData.capacity ? parseInt(formData.capacity) : null,
              latitude: formData.latitude ? parseFloat(formData.latitude) : null,
              longitude: formData.longitude ? parseFloat(formData.longitude) : null,
              image_url: uploadedImageStadium.image_url,
              url: uploadedImageStadium.url || uploadedImageStadium.image_url,
            };

            await fetch(API_ENDPOINTS.stadiums.byId(stadiumIdToUpdate), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });
        }

      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao fazer upload da imagem.');
        // Não retorna aqui, pois o estádio já foi criado/atualizado
      }
    } else if (editingStadium && stadiumIdToUpdate) { // Se estiver editando, mas sem nova imagem, apenas atualize os dados
        try {
            const finalData = {
              ...formData,
              capacity: formData.capacity ? parseInt(formData.capacity) : null,
              latitude: formData.latitude ? parseFloat(formData.latitude) : null,
              longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            };
            await fetch(API_ENDPOINTS.stadiums.byId(stadiumIdToUpdate), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });
        } catch (error) {
            console.error('Erro ao atualizar estádio:', error);
            alert('Erro ao atualizar estádio.');
        }
    }

    fetchStadiums(currentPage, debouncedSearchTerm);
    resetForm();
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingStadium(null)
    setImageFile(null)
    setImagePreview(null)
    setFormData({
      name: '',
      city: '',
      state: '',
      country: 'Brasil',
      capacity: '',
      latitude: '',
      longitude: '',
      url: '',
    })
  }

  const handleEdit = (stadium: Stadium) => {
    setEditingStadium(stadium)
    setShowModal(true)
    setImageFile(null)
    setImagePreview(stadium.image_url ? getStadiumImageUrl(stadium.image_url) : null)
    setFormData({
      name: stadium.name,
      city: stadium.city || '',
      state: stadium.state || '',
      country: stadium.country || 'Brasil',
      capacity: stadium.capacity?.toString() || '',
      latitude: stadium.latitude?.toString() || '',
      longitude: stadium.longitude?.toString() || '',
      url: stadium.url || '',
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Arquivo selecionado em handleImageChange:', file);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file);
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, url: '', image_url: '' }))
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este estádio? Esta ação é irreversível.')) {
      try {
        const response = await fetch(API_ENDPOINTS.stadiums.byId(id), {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchStadiums(currentPage, debouncedSearchTerm) // Recarregar
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
                {Math.min(currentPage * itemsPerPage, totalStadiums)}
              </span>{' '}
              de <span className="font-medium">{totalStadiums}</span> resultados
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
            {totalStadiums} estádios encontrados
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
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h2 className="text-lg font-medium text-gray-900">{editingStadium ? 'Editar Estádio' : 'Adicionar Estádio'}</h2>

              <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                
                {/* Seção de Imagem e URL */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Estádio</label>
                  <div className="flex items-center space-x-4">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview do estádio" className="h-20 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-md bg-gray-100 flex items-center justify-center">
                        <PhotoIcon className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      <div>
                        <label htmlFor="image-upload" className="cursor-pointer bg-white text-indigo-600 hover:text-indigo-500 font-medium py-2 px-3 border border-gray-300 rounded-md text-sm">
                          {imagePreview ? 'Trocar Imagem' : 'Adicionar Imagem'}
                        </label>
                        <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                      </div>
                      {imagePreview && (
                        <button type="button" onClick={handleRemoveImage} className="text-red-600 hover:text-red-500 text-sm font-medium">
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP até 2MB.</p>
                  
                  <div className="mt-4">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL da Imagem</label>
                    <input
                      type="text"
                      name="url"
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="URL da imagem do estádio"
                    />
                  </div>
                </div>

                {/* Campos de Texto */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacidade</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div className="pt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editingStadium ? 'Salvar Alterações' : 'Criar Estádio'}
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