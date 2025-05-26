'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, BellIcon, PlayIcon, PauseIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import NotificationSendControl from './NotificationSendControl'

interface Notification {
  id: number
  title: string
  message: string
  type: 'match_reminder' | 'result' | 'news' | 'custom'
  target_audience: 'all' | 'team_fans' | 'active_users'
  team_filter?: string
  scheduled_time?: string
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled'
  sent_count?: number
  send_interval_ms?: number
  created_at: string
}

export default function NotificationsManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    scheduled: 0,
    reach: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [showSendControl, setShowSendControl] = useState(false)
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'custom' as 'match_reminder' | 'result' | 'news' | 'custom',
    target_audience: 'all' as 'all' | 'team_fans' | 'active_users',
    team_filter: '',
    scheduled_time: '',
    status: 'draft' as 'draft' | 'scheduled' | 'sent' | 'cancelled',
    send_interval_ms: 1000
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [])

  const fetchNotifications = async () => {
    try {
      console.log('🔄 Carregando notificações reais...')
      
      const response = await fetch('API_ENDPOINTS.notifications.list()')
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar notificações: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('📊 Notificações carregadas:', {
        total: data.length,
        tipos: [...new Set(data.map((n: any) => n.type))]
      })
      
      setNotifications(data)
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
      
      // Fallback para dados mockados em caso de erro
      const mockData = [
        {
          id: 1,
          title: 'Flamengo x Palmeiras hoje!',
          message: '🔥 Grande clássico hoje às 16h no Maracanã! Não perca!',
          type: 'match_reminder' as const,
          target_audience: 'team_fans' as const,
          team_filter: 'Flamengo,Palmeiras',
          scheduled_time: '2025-05-26T14:00:00Z',
          status: 'scheduled' as const,
          sent_count: 0,
          created_at: '2025-05-24T10:00:00Z'
        },
        {
          id: 2,
          title: 'Resultado: Santos 2x1 Corinthians',
          message: '⚽ Santos vence o Corinthians por 2x1 na Vila Belmiro!',
          type: 'result' as const,
          target_audience: 'team_fans' as const,
          team_filter: 'Santos,Corinthians',
          status: 'sent' as const,
          sent_count: 1250,
          created_at: '2025-05-23T20:30:00Z'
        }
      ]
      setNotifications(mockData)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('API_ENDPOINTS.notifications.list()/stats')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        type: formData.type === 'match_reminder' ? 'match_start' : 
              formData.type === 'result' ? 'goal' : 
              formData.type,
        title: formData.title,
        message: formData.message,
        is_sent: formData.status === 'sent',
        send_interval_ms: formData.send_interval_ms
      }

      const url = editingNotification 
        ? `API_ENDPOINTS.notifications.list()/${editingNotification.id}`
        : 'API_ENDPOINTS.notifications.list()'
      
      const method = editingNotification ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchNotifications()
        fetchStats()
        setShowModal(false)
        setEditingNotification(null)
        resetForm()
      } else {
        throw new Error(`Erro ao salvar: ${response.status}`)
      }
    } catch (error) {
      console.error('Erro ao salvar notificação:', error)
      alert('Erro ao salvar notificação. Tente novamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'custom',
      target_audience: 'all',
      team_filter: '',
      scheduled_time: '',
      status: 'draft',
      send_interval_ms: 1000
    })
  }

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      target_audience: notification.target_audience,
      team_filter: notification.team_filter || '',
      scheduled_time: notification.scheduled_time ? 
        new Date(notification.scheduled_time).toISOString().slice(0, 16) : '',
      status: notification.status,
      send_interval_ms: notification.send_interval_ms || 1000
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        const response = await fetch(`API_ENDPOINTS.notifications.list()/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchNotifications()
          fetchStats()
        } else {
          throw new Error(`Erro ao excluir: ${response.status}`)
        }
      } catch (error) {
        console.error('Erro ao excluir notificação:', error)
        alert('Erro ao excluir notificação. Tente novamente.')
      }
    }
  }

  const handleSendNow = async (id: number) => {
    setSelectedNotificationId(id)
    setShowSendControl(true)
  }

  const handleOpenSendControl = (id: number) => {
    setSelectedNotificationId(id)
    setShowSendControl(true)
  }

  const handleToggleStatus = async (id: number) => {
    try {
      setNotifications(notifications.map(notif => {
        if (notif.id === id) {
          const newStatus = notif.status === 'scheduled' ? 'cancelled' : 'scheduled'
          return { ...notif, status: newStatus as any }
        }
        return notif
      }))
    } catch (error) {
      console.error('Erro ao alterar status da notificação:', error)
    }
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      match_reminder: { color: 'bg-blue-100 text-blue-800', text: 'Lembrete de Jogo' },
      result: { color: 'bg-green-100 text-green-800', text: 'Resultado' },
      news: { color: 'bg-purple-100 text-purple-800', text: 'Notícia' },
      custom: { color: 'bg-gray-100 text-gray-800', text: 'Personalizada' }
    }
    
    const typeInfo = typeMap[type as keyof typeof typeMap] || typeMap.custom
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.text}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Rascunho' },
      scheduled: { color: 'bg-yellow-100 text-yellow-800', text: 'Agendada' },
      sent: { color: 'bg-green-100 text-green-800', text: 'Enviada' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelada' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const getAudienceBadge = (audience: string, teamFilter?: string) => {
    const audienceMap = {
      all: 'Todos os usuários',
      team_fans: `Fãs de ${teamFilter || 'times específicos'}`,
      active_users: 'Usuários ativos'
    }
    
    return audienceMap[audience as keyof typeof audienceMap] || audience
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

  if (loading) {
    return <div className="text-center">Carregando notificações...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Notificações</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure notificações automáticas para usuários.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Nova Notificação
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Enviadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.sent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PauseIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Agendadas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.scheduled}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Alcance Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.reach.toLocaleString()}</dd>
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
                      Notificação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Público-alvo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agendamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enviados
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {notification.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(notification.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getAudienceBadge(notification.target_audience, notification.team_filter)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(notification.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(notification.scheduled_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {notification.sent_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {notification.status === 'draft' && (
                          <button
                            onClick={() => handleSendNow(notification.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Enviar agora"
                          >
                            <PlayIcon className="h-4 w-4" />
                          </button>
                        )}
                        {(notification.status === 'sent' || (notification.sent_count && notification.sent_count > 0)) && (
                          <button
                            onClick={() => handleOpenSendControl(notification.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Ver relatório de envio"
                          >
                            <ChartBarIcon className="h-4 w-4" />
                          </button>
                        )}
                        {(notification.status === 'scheduled' || notification.status === 'cancelled') && (
                          <button
                            onClick={() => handleToggleStatus(notification.id)}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                            title={notification.status === 'scheduled' ? 'Cancelar' : 'Reagendar'}
                          >
                            <PauseIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(notification)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingNotification ? 'Editar Notificação' : 'Nova Notificação'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Título</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="Ex: Flamengo x Palmeiras hoje!"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">Mensagem</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="Digite a mensagem que será enviada aos usuários..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    >
                      <option value="custom">Personalizada</option>
                      <option value="match_reminder">Lembrete de Jogo</option>
                      <option value="result">Resultado</option>
                      <option value="news">Notícia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Público-alvo</label>
                    <select
                      value={formData.target_audience}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    >
                      <option value="all">Todos os usuários</option>
                      <option value="team_fans">Fãs de times específicos</option>
                      <option value="active_users">Usuários ativos</option>
                    </select>
                  </div>
                </div>
                
                {formData.target_audience === 'team_fans' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Times (separados por vírgula)</label>
                    <input
                      type="text"
                      value={formData.team_filter}
                      onChange={(e) => setFormData({ ...formData, team_filter: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                      placeholder="Ex: Flamengo, Palmeiras"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Agendamento (opcional)</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="scheduled">Agendada</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Intervalo entre envios (milissegundos)
                    <span className="text-xs text-gray-500 ml-2">
                      Recomendado: 1000ms (1 segundo) para evitar bloqueios
                    </span>
                  </label>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="100"
                    value={formData.send_interval_ms}
                    onChange={(e) => setFormData({ ...formData, send_interval_ms: parseInt(e.target.value) || 1000 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    placeholder="1000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Valores menores = envio mais rápido, mas maior risco de bloqueio. 
                    Valores maiores = envio mais lento, mas mais seguro.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingNotification(null)
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
                    {editingNotification ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Controle de Envio */}
      {showSendControl && selectedNotificationId && (
        <NotificationSendControl
          notificationId={selectedNotificationId}
          onClose={() => {
            setShowSendControl(false)
            setSelectedNotificationId(null)
            fetchNotifications()
            fetchStats()
          }}
        />
      )}
    </div>
  )
} 