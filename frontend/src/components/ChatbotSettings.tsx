'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface SystemStatus {
  status: string
  evolution?: any
  database?: {
    connected: boolean
    teams: number
    matches: number
  }
  timestamp: string
}

export default function ChatbotSettings() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/chatbot/status')
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Erro ao carregar status:', error)
    }
  }

  const testChatbot = async () => {
    if (!testMessage.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/chatbot/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          from: '+5511999999999'
        }),
      })
      
      const data = await response.json()
      setTestResponse(data.response)
    } catch (error) {
      console.error('Erro ao testar chatbot:', error)
      setTestResponse('Erro ao processar mensagem')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'operational') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Operacional
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Erro
      </span>
    )
  }

  return (
    <div>
      <h1 className="text-base font-semibold leading-6 text-gray-900">Configurações do Chatbot</h1>
      <p className="mt-2 text-sm text-gray-700">
        Configure e teste o comportamento do chatbot.
      </p>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Sistema */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status do Sistema</h3>
          {systemStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sistema Geral</span>
                {getStatusBadge(systemStatus.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Evolution API</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {systemStatus.evolution?.state || 'Conectado'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Banco de Dados</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {systemStatus.database?.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Times cadastrados: {systemStatus.database?.teams || 0}</p>
                  <p>Jogos cadastrados: {systemStatus.database?.matches || 0}</p>
                  <p>Última atualização: {new Date(systemStatus.timestamp).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700">Carregando status...</p>
          )}
        </div>

        {/* Testador de Mensagens */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Testar Chatbot</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="test-message" className="block text-sm font-medium text-gray-900">
                Mensagem de Teste
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Ex: Próximo jogo do Flamengo"
                  className="flex-1 rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && testChatbot()}
                />
                <button
                  type="button"
                  onClick={testChatbot}
                  disabled={loading || !testMessage.trim()}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-slate-600 rounded-r-md bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {testResponse && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resposta do Chatbot
                </label>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-md border border-gray-200 dark:border-slate-600">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{testResponse}</pre>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-700">
              <p>Exemplos de mensagens para testar:</p>
              <ul className="mt-1 space-y-1">
                <li>• "Próximo jogo do Flamengo"</li>
                <li>• "Informações do Palmeiras"</li>
                <li>• "Jogos de hoje"</li>
                <li>• "Tabela do Brasileirão"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 