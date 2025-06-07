'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/services/authService'
import { User, CreateAdminData } from '@/types/auth'
import { 
  UserGroupIcon, 
  PlusIcon, 
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

export default function AdminsManager() {
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null)
  const [formData, setFormData] = useState<CreateAdminData>({
    username: '',
    email: '',
    password: '',
    name: '',
    phone_number: ''
  })

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await authService.getAdminUsers()
      console.log('📊 AdminsManager: Carregados', data.length, 'administradores')
      setAdmins(data)
    } catch (err) {
      console.error('❌ AdminsManager: Erro ao carregar administradores:', err)
      setError('Erro ao carregar administradores. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (admin: User) => {
    console.log('🔄 AdminsManager: Abrindo modal para editar administrador:', admin)
    setEditingAdmin(admin)
    setFormData({
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      name: admin.name || '',
      phone_number: admin.phone_number || ''
    })
    setShowCreateModal(true)
    setCreateError(null)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 AdminsManager: Iniciando operação de administrador:', formData)
    
    // Validação básica
    if (!formData.name.trim()) {
      setCreateError('Nome é obrigatório')
      return
    }
    
    // A senha é obrigatória apenas na criação de um novo administrador
    if (!editingAdmin && !formData.password.trim()) {
      setCreateError('Senha é obrigatória para novos administradores')
      return
    }
    
    if (!editingAdmin && formData.password.length < 6) {
      setCreateError('Senha deve ter pelo menos 6 caracteres')
      return
    }
    
    try {
      setCreateLoading(true)
      setCreateError(null)
      
      let result
      if (editingAdmin) {
        // Lógica para atualização
        result = await authService.updateAdmin(editingAdmin.id, formData)
        console.log('✅ AdminsManager: Administrador atualizado com sucesso')
        alert('Administrador atualizado com sucesso!')
      } else {
        // Lógica para criação
        result = await authService.createAdmin(formData)
        console.log('✅ AdminsManager: Administrador criado com sucesso')
        alert('Administrador criado com sucesso!')
      }
      
      if (result.success) {
        // Limpar formulário
        setFormData({
          username: '',
          email: '',
          password: '',
          name: '',
          phone_number: ''
        })
        
        // Fechar modal e recarregar lista
        setShowCreateModal(false)
        setEditingAdmin(null)
        await loadAdmins()
        
      } else {
        console.error('❌ AdminsManager: Erro do backend:', result.message)
        setCreateError(result.message || `Erro ao ${editingAdmin ? 'atualizar' : 'criar'} administrador`)
      }
      
    } catch (err: any) {
      console.error('❌ AdminsManager: Erro ao manipular administrador:', err)
      const errorMsg = err.response?.data?.message || err.message || `Erro ao ${editingAdmin ? 'atualizar' : 'criar'} administrador`
      setCreateError(errorMsg)
    } finally {
      setCreateLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleOpenModal = () => {
    console.log('🔄 AdminsManager: Abrindo modal para criar administrador')
    setShowCreateModal(true)
    setCreateError(null)
    setEditingAdmin(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      phone_number: ''
    })
  }

  const handleCloseModal = () => {
    console.log('🔄 AdminsManager: Fechando modal')
    setShowCreateModal(false)
    setCreateError(null)
    setEditingAdmin(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      phone_number: ''
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administradores</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os administradores do sistema</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando administradores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administradores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os administradores do sistema ({admins.length} total)
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Criar Administrador
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={loadAdmins}
            className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => (
          <div key={admin.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {(admin.name || admin.username || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {admin.name || admin.username || 'Sem nome'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{admin.username}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-2">
                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(admin)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  title="Editar Administrador"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {admin.is_admin ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Administrador
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Usuário Comum
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {admin.email && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  <span className="truncate">{admin.email}</span>
                </div>
              )}
              
              {admin.phone_number && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>{admin.phone_number}</span>
                </div>
              )}
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Criado em {formatDate(admin.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                  <UserGroupIcon className="h-3 w-3 mr-1" />
                  Administrador
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  admin.is_active 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                }`}>
                  {admin.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {admins.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Nenhum administrador</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando um novo administrador.
          </p>
          <div className="mt-6">
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Criar Administrador
            </button>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingAdmin ? 'Editar Administrador' : 'Criar Novo Administrador'}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {createError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-red-700 dark:text-red-400 text-sm">{createError}</p>
              </div>
            )}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário (Opcional)</label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Opcional)</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone (Opcional)</label>
                <input
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              {/* Password field only for creation or if explicitly needed for update with password change */}
              {!editingAdmin && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={!editingAdmin} // Senha é obrigatória apenas na criação
                  />
                </div>
              )}
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={createLoading}
                >
                  {createLoading ? 'Salvando...' : (editingAdmin ? 'Salvar Alterações' : 'Criar Administrador')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 