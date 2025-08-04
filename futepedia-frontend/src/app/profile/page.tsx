'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  PuzzlePieceIcon,
  CogIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  origin: 'whatsapp' | 'site';
  role: string;
  favorite_team?: {
    id: number;
    name: string;
    logo_url?: string;
  };
  preferences: any;
  whatsapp_status: string;
  created_at: string;
}

interface UserStats {
  pools_participated: number;
  pools_won: number;
  total_predictions: number;
  exact_predictions: number;
  total_points: number;
  amateur_competitions: number;
  whatsapp_conversations: number;
  game_sessions: number;
}

export default function ProfilePage() {
  const { isAuthenticated, user, requireAuth } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      notifications: true,
      language: 'pt-BR',
      theme: 'auto',
      email_notifications: true,
      whatsapp_notifications: true
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchProfile()
    fetchStats()
  }, [isAuthenticated])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          preferences: {
            notifications: data.preferences?.notifications ?? true,
            language: data.preferences?.language ?? 'pt-BR',
            theme: data.preferences?.theme ?? 'auto',
            email_notifications: data.preferences?.email_notifications ?? true,
            whatsapp_notifications: data.preferences?.whatsapp_notifications ?? true,
          }
        })
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchProfile()
        setEditMode(false)
        alert('Perfil atualizado com sucesso!')
      } else {
        const error = await response.json()
        alert('Erro ao atualizar perfil: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      alert('Erro ao atualizar perfil')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserCircleIcon className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Perfil não encontrado</h3>
          <p className="mt-2 text-gray-500">Não foi possível carregar suas informações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="mt-2 text-gray-600">
                  Gerencie suas informações e preferências em todos os nossos serviços
                </p>
              </div>
              
              <div className="flex space-x-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Salvar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      title="Digite seu nome completo"
                      placeholder="Seu nome"
                    />
                  ) : (
                    <div className="mt-1 flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{profile.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      title="Digite seu endereço de email"
                      placeholder="seu@email.com"
                    />
                  ) : (
                    <div className="mt-1 flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">{profile.email}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <div className="mt-1 flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{profile.phone_number || 'Não informado'}</span>
                    {profile.origin === 'whatsapp' && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        WhatsApp
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Origem da Conta</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      profile.origin === 'whatsapp' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {profile.origin === 'whatsapp' ? 'Criada via WhatsApp' : 'Criada no Site'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Favorito</label>
                  <div className="mt-1">
                    {profile.favorite_team ? (
                      <div className="flex items-center">
                        <TrophyIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900">{profile.favorite_team.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">Nenhum time selecionado</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Membro desde</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferências */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferências</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notificações</label>
                    <p className="text-sm text-gray-500">Receber notificações gerais do sistema</p>
                  </div>
                  {editMode ? (
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.preferences.notifications}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notifications: e.target.checked
                        }
                      }))}
                      title="Ativar/desativar notificações gerais"
                    />
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      formData.preferences.notifications
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.preferences.notifications ? 'Ativado' : 'Desativado'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notificações por Email</label>
                    <p className="text-sm text-gray-500">Receber emails sobre bolões e competições</p>
                  </div>
                  {editMode ? (
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.preferences.email_notifications}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          email_notifications: e.target.checked
                        }
                      }))}
                      title="Ativar/desativar notificações por email"
                    />
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      formData.preferences.email_notifications
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.preferences.email_notifications ? 'Ativado' : 'Desativado'}
                    </span>
                  )}
                </div>

                {profile.origin === 'whatsapp' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notificações WhatsApp</label>
                      <p className="text-sm text-gray-500">Receber mensagens do chatbot</p>
                    </div>
                    {editMode ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.preferences.whatsapp_notifications}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            whatsapp_notifications: e.target.checked
                          }
                        }))}
                        title="Ativar/desativar notificações do WhatsApp"
                      />
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        formData.preferences.whatsapp_notifications
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.preferences.whatsapp_notifications ? 'Ativado' : 'Desativado'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar com Estatísticas */}
          <div>
            {/* Estatísticas Gerais */}
            {stats && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Suas Estatísticas</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrophyIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-700">Bolões Participados</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.pools_participated}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrophyIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-gray-700">Bolões Vencidos</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.pools_won}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <EyeIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Palpites Feitos</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.total_predictions}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-700">Placares Exatos</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.exact_predictions}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrophyIcon className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm text-gray-700">Pontos Totais</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.total_points}</span>
                  </div>

                  {stats.amateur_competitions > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <PuzzlePieceIcon className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm text-gray-700">Competições Amadoras</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.amateur_competitions}</span>
                    </div>
                  )}

                  {stats.whatsapp_conversations > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-gray-700">Conversas WhatsApp</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stats.whatsapp_conversations}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links Rápidos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h2>
              
              <div className="space-y-3">
                <a
                  href="/pools"
                  className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <TrophyIcon className="h-5 w-5 text-blue-600 mr-3" />
                  Ver Todos os Bolões
                </a>
                
                <a
                  href="/futebot"
                  className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600 mr-3" />
                  Chat Público
                </a>
                
                <a
                  href="/amadores"
                  className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <PuzzlePieceIcon className="h-5 w-5 text-red-600 mr-3" />
                  Competições Amadoras
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}