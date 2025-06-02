'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, TvIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface Channel {
  id: number
  name: string
  logo?: string
  channel_number?: string
  channel_link?: string
  type: string
  active: boolean
  created_at: string
}

export default function ChannelsManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [paginatedChannels, setPaginatedChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    channel_number: '',
    channel_link: '',
    type: '',
    active: true
  })

  useEffect(() => {
    fetchChannels()
  }, [])

  // Effect para filtrar canais
  useEffect(() => {
    let filtered = channels

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(channel => 
        channel.name.toLowerCase().includes(query) ||
        (channel.channel_number && channel.channel_number.toLowerCase().includes(query)) ||
        (channel.type && channel.type.toLowerCase().includes(query))
      )
    }

    // Filtro por tipo
    if (typeFilter) {
      filtered = filtered.filter(channel => channel.type === typeFilter)
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter(channel => 
        statusFilter === 'active' ? channel.active : !channel.active
      )
    }

    setFilteredChannels(filtered)
  }, [channels, searchQuery, typeFilter, statusFilter])

  // Effect para paginação
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedChannels(filteredChannels.slice(startIndex, endIndex))
  }, [filteredChannels, currentPage, itemsPerPage])

  const fetchChannels = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.channels.list())
      if (response.ok) {
        const data = await response.json()
        setChannels(data)
      }
    } catch (error) {
      console.error('Erro ao carregar canais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 Iniciando salvamento de canal...')
    console.log('📝 Dados do formulário:', formData)
    console.log('✏️ Modo de edição:', editingChannel ? 'Editando' : 'Criando novo')
    
    // Validação básica
    if (!formData.name.trim()) {
      alert('Por favor, insira o nome do canal')
      return
    }
    
    if (!formData.type) {
      alert('Por favor, selecione o tipo do canal')
      return
    }
    
    try {
      const url = editingChannel 
        ? `${API_ENDPOINTS.channels.list()}/${editingChannel.id}`
        : API_ENDPOINTS.channels.list()
      
      console.log('🌐 URL da requisição:', url)
      
      const method = editingChannel ? 'PATCH' : 'POST'
      console.log('📡 Método HTTP:', method)
      
      // Limpar dados vazios
      const cleanFormData = {
        name: formData.name.trim(),
        logo: formData.logo?.trim() || '',
        channel_number: formData.channel_number?.trim() || '',
        channel_link: formData.channel_link?.trim() || '',
        type: formData.type,
        active: formData.active
      }
      
      console.log('🧹 Dados limpos:', cleanFormData)
      
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanFormData),
      }
      
      console.log('📦 Enviando requisição...')
      
      const response = await fetch(url, requestOptions)
      
      console.log('📥 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ Dados da resposta:', responseData)
        console.log('🔄 Recarregando lista de canais...')
        await fetchChannels()
        resetForm()
        console.log('✅ Canal salvo com sucesso!')
        alert('Canal salvo com sucesso!')
      } else {
        const errorText = await response.text()
        console.error('❌ Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          data: errorText
        })
        alert(`Erro ao salvar canal: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      alert(`Erro ao salvar canal: ${error}`)
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingChannel(null)
    setFormData({
      name: '',
      logo: '',
      channel_number: '',
      channel_link: '',
      type: '',
      active: true
    })
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setFormData({
      name: channel.name,
      logo: channel.logo || '',
      channel_number: channel.channel_number || '',
      channel_link: channel.channel_link || '',
      type: channel.type || '',
      active: channel.active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este canal?')) {
      try {
        await fetch(`${API_ENDPOINTS.channels.list()}/${id}`, {
          method: 'DELETE',
        })
        fetchChannels()
      } catch (error) {
        console.error('Erro ao excluir canal:', error)
      }
    }
  }

  // Funções utilitárias
  const getUniqueCategories = () => {
    const types = new Set<string>()
    channels.forEach(channel => {
      if (channel.type) types.add(channel.type)
    })
    return Array.from(types).sort()
  }

  const formatChannelType = (type: string) => {
    const typeLabels: Record<string, string> = {
      'tv': 'TV Aberta',
      'cable': 'TV por Assinatura', 
      'streaming': 'Streaming',
      'other': 'Outros'
    }
    return typeLabels[type] || type
  }

  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage)

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
            {Math.min(currentPage * itemsPerPage, filteredChannels.length)} de{' '}
            {filteredChannels.length} canais
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            ←
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
            return (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  pageNumber === currentPage
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            )
          })}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            →
          </button>
        </nav>
      </div>
    </div>
  )

  if (loading) {
    return <div className="text-center">Carregando canais...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Canais de TV</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os canais de televisão cadastrados no sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Adicionar Canal
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Buscar e Filtrar</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar canais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">Todos os tipos</option>
              {getUniqueCategories().map((type) => (
                <option key={type} value={type}>{formatChannelType(type)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          
          <div>
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Indicadores de filtros ativos */}
        {(searchQuery || typeFilter || statusFilter) && (
          <div className="mt-4 flex flex-wrap gap-2">
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
            {typeFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tipo: {formatChannelType(typeFilter)}
                <button
                  type="button"
                  onClick={() => setTypeFilter('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {statusFilter === 'active' ? 'Ativo' : 'Inativo'}
                <button
                  type="button"
                  onClick={() => setStatusFilter('')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabela de Canais */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Canal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Website</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedChannels.map((channel) => (
                    <tr key={channel.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {channel.logo ? (
                              <img className="h-10 w-10 rounded-lg object-cover" src={channel.logo} alt={channel.name} />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <TvIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{channel.name}</div>
                            <div className="text-sm text-gray-500">{channel.channel_number || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatChannelType(channel.type) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          channel.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {channel.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {channel.channel_link ? (
                          <a href={channel.channel_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                            Visitar
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(channel)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(channel.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingChannel ? 'Editar Canal' : 'Adicionar Canal'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome do Canal</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="Ex: Globo, SporTV"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Número do Canal</label>
                  <input
                    type="text"
                    value={formData.channel_number}
                    onChange={(e) => setFormData({ ...formData, channel_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="Ex: 13, 23"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Link do Canal</label>
                  <input
                    type="url"
                    value={formData.channel_link}
                    onChange={(e) => setFormData({ ...formData, channel_link: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                    placeholder="https://www.canal.com.br"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 px-4 py-3"
                  >
                    <option value="">Selecione um tipo</option>
                    <option value="tv">TV Aberta</option>
                    <option value="cable">TV por Assinatura</option>
                    <option value="streaming">Streaming</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Canal ativo
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
                  >
                    {editingChannel ? 'Atualizar' : 'Criar'}
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