'use client'

import { useState, useEffect } from 'react'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface SendProgress {
  notificationId: number
  status: 'draft' | 'queued' | 'sending' | 'paused' | 'completed' | 'cancelled' | 'failed'
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  startedAt?: string
  pausedAt?: string
  completedAt?: string
}

interface DeliveryReport {
  notificationId: number
  notificationTitle: string
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  failedCount: number
  pendingCount: number
  status: string
  startedAt?: string
  completedAt?: string
  duration?: number
  deliveries: {
    id: number
    userName: string
    phoneNumber: string
    status: 'pending' | 'sending' | 'delivered' | 'failed' | 'cancelled'
    sentAt?: string
    deliveredAt?: string
    errorMessage?: string
    retryCount: number
  }[]
}

interface NotificationSendControlProps {
  notificationId: number
  onClose: () => void
}

export default function NotificationSendControl({ notificationId, onClose }: NotificationSendControlProps) {
  const [progress, setProgress] = useState<SendProgress | null>(null)
  const [report, setReport] = useState<DeliveryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'progress' | 'report'>('progress')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchProgress()
    fetchReport()
  }, [notificationId])

  useEffect(() => {
    if (autoRefresh && progress?.status === 'sending') {
      const interval = setInterval(() => {
        fetchProgress()
        fetchReport()
      }, 2000) // Atualizar a cada 2 segundos

      return () => clearInterval(interval)
    }
  }, [autoRefresh, progress?.status])

  const fetchProgress = async () => {
    try {
      const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/progress`)
      if (response.ok) {
        const data = await response.json()
        // Mapear os dados do backend para o formato esperado pelo frontend
        const mappedProgress = {
          notificationId: data.notification_id,
          status: data.send_status,
          totalRecipients: data.total_recipients || 0,
          sentCount: data.sent_count || 0,
          deliveredCount: data.delivered_count || 0,
          failedCount: data.failed_count || 0,
          startedAt: data.started_at,
          pausedAt: data.paused_at,
          completedAt: data.completed_at
        }
        setProgress(mappedProgress)
      }
    } catch (error) {
      console.error('Erro ao buscar progresso:', error)
    }
  }

  const fetchReport = async () => {
    try {
      const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/report`)
      if (response.ok) {
        const data = await response.json()
        // Mapear os dados do backend para o formato esperado pelo frontend
        const mappedReport = {
          notificationId: data.notification.id,
          notificationTitle: data.notification.title || 'Sem título',
          totalRecipients: data.summary.total_recipients || 0,
          sentCount: data.summary.sent_count || 0,
          deliveredCount: data.summary.delivered_count || 0,
          failedCount: data.summary.failed_count || 0,
          pendingCount: data.summary.pending_count || 0,
          status: data.notification.send_status,
          startedAt: data.notification.started_at,
          completedAt: data.notification.completed_at,
          duration: data.notification.started_at && data.notification.completed_at ? 
            new Date(data.notification.completed_at).getTime() - new Date(data.notification.started_at).getTime() : 
            undefined,
          deliveries: (data.deliveries || []).map((delivery: any) => ({
            id: delivery.id,
            userName: delivery.user_id ? `Usuário ${delivery.user_id}` : 'N/A',
            phoneNumber: delivery.phone_number || 'N/A',
            status: delivery.status,
            sentAt: delivery.sent_at,
            deliveredAt: delivery.delivered_at,
            errorMessage: delivery.error_message,
            retryCount: delivery.retry_count || 0
          }))
        }
        setReport(mappedReport)
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
    }
  }

  const handleStart = async () => {
    setLoading(true)
    try {
      const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/send`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchProgress()
        setAutoRefresh(true)
      }
    } catch (error) {
      console.error('Erro ao iniciar envio:', error)
    }
    setLoading(false)
  }

  const handlePause = async () => {
    setLoading(true)
    try {
      const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/pause`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchProgress()
        setAutoRefresh(false)
      }
    } catch (error) {
      console.error('Erro ao pausar envio:', error)
    }
    setLoading(false)
  }

  const handleResume = async () => {
    setLoading(true)
    try {
      const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/resume`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchProgress()
        setAutoRefresh(true)
      }
    } catch (error) {
      console.error('Erro ao retomar envio:', error)
    }
    setLoading(false)
  }

  const handleCancel = async () => {
    if (confirm('Tem certeza que deseja cancelar o envio?')) {
      setLoading(true)
      try {
        const response = await fetch(`API_ENDPOINTS.notifications.list()/${notificationId}/cancel`, {
          method: 'POST'
        })
        if (response.ok) {
          await fetchProgress()
          setAutoRefresh(false)
        }
      } catch (error) {
        console.error('Erro ao cancelar envio:', error)
      }
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, text: 'Rascunho' },
      queued: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: 'Na Fila' },
      sending: { color: 'bg-yellow-100 text-yellow-800', icon: PlayIcon, text: 'Enviando' },
      paused: { color: 'bg-orange-100 text-orange-800', icon: PauseIcon, text: 'Pausado' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Concluído' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: StopIcon, text: 'Cancelado' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircleIcon, text: 'Falhou' }
    }

    const badge = badges[status as keyof typeof badges] || badges.draft
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    )
  }

  const getDeliveryStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-gray-100 text-gray-800', text: 'Pendente' },
      sending: { color: 'bg-blue-100 text-blue-800', text: 'Enviando' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Entregue' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Falhou' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelado' }
    }

    const badge = badges[status as keyof typeof badges] || badges.pending

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getProgressPercentage = () => {
    if (!progress || !progress.totalRecipients || progress.totalRecipients === 0) return 0
    const sent = (progress.sentCount || 0) + (progress.failedCount || 0)
    return Math.round((sent / progress.totalRecipients) * 100)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Controle de Envio - Notificação #{notificationId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Fechar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'progress'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Progresso
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'report'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Relatório Detalhado
            </button>
          </nav>
        </div>

        {activeTab === 'progress' && progress && (
          <div className="space-y-6">
            {/* Status e Controles */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {getStatusBadge(progress.status)}
                </div>
                <div className="flex space-x-2">
                  {progress.status === 'draft' && (
                    <button
                      onClick={handleStart}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Iniciar Envio
                    </button>
                  )}
                  {progress.status === 'sending' && (
                    <button
                      onClick={handlePause}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <PauseIcon className="w-4 h-4 mr-1" />
                      Pausar
                    </button>
                  )}
                  {progress.status === 'paused' && (
                    <button
                      onClick={handleResume}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Retomar
                    </button>
                  )}
                  {(progress.status === 'sending' || progress.status === 'paused') && (
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      <StopIcon className="w-4 h-4 mr-1" />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso do Envio</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{progress.totalRecipients || 0}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{progress.sentCount || 0}</div>
                  <div className="text-sm text-gray-500">Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{progress.failedCount || 0}</div>
                  <div className="text-sm text-gray-500">Falharam</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {(progress.totalRecipients || 0) - (progress.sentCount || 0) - (progress.failedCount || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Pendentes</div>
                </div>
              </div>
            </div>

            {/* Informações de Tempo */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Informações de Tempo</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Iniciado em:</span>
                  <div className="font-medium">{formatDate(progress.startedAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Pausado em:</span>
                  <div className="font-medium">{formatDate(progress.pausedAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Concluído em:</span>
                  <div className="font-medium">{formatDate(progress.completedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && report && (
          <div className="space-y-6">
            {/* Resumo do Relatório */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">{report.notificationTitle}</h4>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{report.totalRecipients || 0}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{report.sentCount || 0}</div>
                  <div className="text-sm text-gray-500">Enviados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{report.failedCount || 0}</div>
                  <div className="text-sm text-gray-500">Falharam</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{report.pendingCount || 0}</div>
                  <div className="text-sm text-gray-500">Pendentes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{formatDuration(report.duration)}</div>
                  <div className="text-sm text-gray-500">Duração</div>
                </div>
              </div>
            </div>

            {/* Lista de Entregas */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Detalhes das Entregas</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enviado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.deliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {delivery.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getDeliveryStatusBadge(delivery.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(delivery.sentAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                          {delivery.errorMessage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 