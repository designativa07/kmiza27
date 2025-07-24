'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserIcon, ChatBubbleLeftRightIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { authService } from '@/services/authService'

interface User {
  id: number
  phone_number: string
  name?: string
  favorite_team?: {
    id: number
    name: string
    slug: string
  }
  is_active: boolean
  is_admin?: boolean
  updated_at?: string
  preferences?: any
  whatsapp_status: string
  created_at: string
  origin: string
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    withFavoriteTeam: 0
  })
  const [formData, setFormData] = useState({
    phone_number: '',
    name: '',
    is_active: true
  })

  useEffect(() => {
    fetchUsers()
    fetchUserStats()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users.list())
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários')
      }
      
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('❌ UsersManager: Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users.stats(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.status}`)
      }
      
      const data = await response.json()
      setUserStats(data)
    } catch (error) {
      console.error('❌ UsersManager: Erro ao carregar estatísticas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        // Atualizar usuário existente
        const response = await fetch(API_ENDPOINTS.users.byId(editingUser.id), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        if (response.ok) {
          fetchUsers() // Recarregar lista
          fetchUserStats() // Recarregar estatísticas
        }
      } else {
        // Criar novo usuário
        const response = await fetch(API_ENDPOINTS.users.list(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: formData.phone_number,
            name: formData.name,
          }),
        })
        
        if (response.ok) {
          fetchUsers() // Recarregar lista
          fetchUserStats() // Recarregar estatísticas
        }
      }

      setShowModal(false)
      setEditingUser(null)
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      phone_number: '',
      name: '',
      is_active: true
    })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      phone_number: user.phone_number,
      name: user.name || '',
      is_active: user.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(API_ENDPOINTS.users.byId(id), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          // Remover da interface apenas após confirmação da API
          setUsers(users.filter(user => user.id !== id))
          fetchUserStats() // Recarregar estatísticas
        } else {
          throw new Error(`Erro ao excluir usuário: ${response.status}`)
        }
      } catch (error) {
        console.error('❌ UsersManager: Erro ao excluir usuário:', error)
        alert('Erro ao excluir usuário. Tente novamente.')
      }
    }
  }

  const toggleUserStatus = async (id: number) => {
    try {
      const user = users.find(u => u.id === id)
      if (!user) return
      
      const response = await fetch(API_ENDPOINTS.users.byId(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !user.is_active
        }),
      })
      
      if (response.ok) {
        // Atualizar interface apenas após confirmação da API
        setUsers(users.map(user => 
          user.id === id ? { ...user, is_active: !user.is_active } : user
        ))
      } else {
        throw new Error(`Erro ao alterar status: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ UsersManager: Erro ao alterar status do usuário:', error)
      alert('Erro ao alterar status do usuário. Tente novamente.')
    }
  }

  const toggleAdminStatus = async (id: number) => {
    try {
      const user = users.find(u => u.id === id)
      if (!user) return
      
      const action = user.is_admin ? 'rebaixar' : 'promover'
      const confirmMessage = user.is_admin 
        ? 'Tem certeza que deseja remover os privilégios de administrador deste usuário?'
        : 'Tem certeza que deseja promover este usuário a administrador?'
      
      if (!confirm(confirmMessage)) return
      
      if (user.is_admin) {
        await authService.demoteFromAdmin(id)
      } else {
        await authService.promoteToAdmin(id)
      }
      
      // Atualizar interface
      setUsers(users.map(u => 
        u.id === id ? { ...u, is_admin: !u.is_admin } : u
      ))
      
    } catch (error) {
      console.error(`❌ UsersManager: Erro ao alterar privilégios de admin:`, error)
      alert('Erro ao alterar privilégios de administrador. Tente novamente.')
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPhone = (phone: string) => {
    // Formatar telefone brasileiro: +55 (11) 99999-9999
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const country = cleaned.slice(0, 2)
      const area = cleaned.slice(2, 4)
      const first = cleaned.slice(4, 9)
      const second = cleaned.slice(9, 13)
      return `+${country} (${area}) ${first}-${second}`
    }
    return phone
  }

  if (loading) {
    return <div className="text-center">Carregando usuários...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Usuários</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie usuários do WhatsApp e suas preferências.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Adicionar Usuário
          </button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Usuários</dt>
                  <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Usuários Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {users.filter(u => u.is_active).length}
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
                <HeartIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Com Time Favorito</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userStats.withFavoriteTeam}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
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
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Favorito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Nome não informado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Cadastrado em {formatDate(user.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPhone(user.phone_number)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.favorite_team?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className="cursor-pointer"
                        >
                          {getStatusBadge(user.is_active)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAdminStatus(user.id)}
                          className="cursor-pointer"
                        >
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_admin 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_admin ? (
                              <>
                                <UserGroupIcon className="h-3 w-3 mr-1" />
                                Admin
                              </>
                            ) : (
                              'Usuário'
                            )}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.origin === 'site' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.origin === 'site' ? '🌐 Site' : '📱 WhatsApp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.whatsapp_status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.updated_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          aria-label="Editar usuário"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Excluir usuário"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Telefone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="5511999887766"
                  />
                  <p className="mt-1 text-sm text-gray-700">
                    Formato: código do país + DDD + número (ex: 5511999887766)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="Nome do usuário"
                  />
                </div>
                

                
                <div className="flex items-center">
                  <input
                    id="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">
                    Usuário ativo
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingUser(null)
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
                    {editingUser ? 'Atualizar' : 'Criar'}
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