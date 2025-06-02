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
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function AdminsManager() {
  const [admins, setAdmins] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
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

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔄 AdminsManager: Iniciando criação de administrador:', formData)
    
    // Validação básica
    if (!formData.name.trim()) {
      setCreateError('Nome é obrigatório')
      return
    }
    
    if (!formData.password.trim()) {
      setCreateError('Senha é obrigatória')
      return
    }
    
    if (formData.password.length < 6) {
      setCreateError('Senha deve ter pelo menos 6 caracteres')
      return
    }
    
    try {
      setCreateLoading(true)
      setCreateError(null)
      
      const result = await authService.createAdmin(formData)
      console.log('✅ AdminsManager: Resposta do backend:', result)
      
      if (result.success) {
        console.log('✅ AdminsManager: Administrador criado com sucesso')
        
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
        await loadAdmins()
        
        // Mostrar mensagem de sucesso
        alert('Administrador criado com sucesso!')
        
      } else {
        console.error('❌ AdminsManager: Erro do backend:', result.message)
        setCreateError(result.message || 'Erro ao criar administrador')
      }
      
    } catch (err: any) {
      console.error('❌ AdminsManager: Erro ao criar administrador:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Erro ao criar administrador'
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
  }

  const handleCloseModal = () => {
    console.log('🔄 AdminsManager: Fechando modal')
    setShowCreateModal(false)
    setCreateError(null)
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{admin.username || admin.email || admin.phone_number}
                </p>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />
            
            <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Criar Novo Administrador
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {createError && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-700 dark:text-red-400">{createError}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="João Silva"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="admin@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Senha *
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Senha segura"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Mínimo de 6 caracteres
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando...
                      </span>
                    ) : (
                      'Criar Administrador'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={createLoading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Cancelar
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