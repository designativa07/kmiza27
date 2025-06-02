'use client'

import React, { useState, useEffect } from 'react'
import { 
  CogIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface BotConfig {
  id: number
  key: string
  value: string
  description: string
  type: 'string' | 'text' | 'number' | 'boolean' | 'json'
  active: boolean
}

export default function AutomationPanel() {
  const [configs, setConfigs] = useState<BotConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.botConfig.list())
      if (response.ok) {
        const data = await response.json()
        setConfigs(data)
      }
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (id: number, value: string) => {
    console.log('🔧 Iniciando updateConfig:', { id, value: value.substring(0, 50) + '...' });
    setSaving(true)
    try {
      const url = API_ENDPOINTS.botConfig.byId(id);
      console.log('🌐 URL da requisição:', url);
      
      const requestBody = { value };
      console.log('📦 Body da requisição:', requestBody);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('📡 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Dados da resposta:', responseData);
        setMessage({ type: 'success', text: 'Configuração salva com sucesso!' })
        fetchConfigs()
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        setMessage({ type: 'error', text: `Erro ao salvar configuração: ${response.status}` })
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error)
      setMessage({ type: 'error', text: `Erro ao salvar configuração: ${error.message}` })
    } finally {
      setSaving(false)
    }
  }

  const resetDefaults = async () => {
    setSaving(true)
    try {
      const response = await fetch(API_ENDPOINTS.botConfig.resetDefaults(), {
        method: 'POST',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configurações padrão restauradas!' })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: 'Erro ao restaurar configurações' })
      }
    } catch (error: any) {
      console.error('Erro ao restaurar:', error)
      setMessage({ type: 'error', text: 'Erro ao restaurar configurações' })
    } finally {
      setSaving(false)
    }
  }

  const handleConfigChange = (id: number, value: string) => {
    setConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, value } : config
    ))
  }

  const handleSave = (id: number, value: string) => {
    updateConfig(id, value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Painel de Automação</h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              🤖 Bot Ativo
            </span>
          </div>
          <button
            onClick={resetDefaults}
            disabled={saving}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Restaurar Padrões
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
              <div className="ml-3">
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {configs.map((config) => (
          <div key={config.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {config.type}
              </span>
            </div>
            
            {config.description && (
              <p className="text-sm text-gray-600 mb-3">{config.description}</p>
            )}

            <div className="space-y-3">
              {config.type === 'text' ? (
                config.key === 'openai_prompt' || config.key === 'welcome_message' ? (
                  <textarea
                    value={config.value}
                    onChange={(e) => handleConfigChange(config.id, e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Digite o prompt aqui..."
                  />
                ) : (
                  <input
                    type="text"
                    value={config.value}
                    onChange={(e) => handleConfigChange(config.id, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Digite o valor..."
                  />
                )
              ) : config.type === 'boolean' ? (
                <select
                  value={config.value}
                  onChange={(e) => handleConfigChange(config.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:focus:border-indigo-500"
                >
                  <option value="true">Habilitado</option>
                  <option value="false">Desabilitado</option>
                </select>
              ) : (
                <input
                  type={config.type === 'number' ? 'number' : 'text'}
                  value={config.value}
                  onChange={(e) => handleConfigChange(config.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Digite o valor..."
                />
              )}

              <button
                onClick={() => handleSave(config.id, config.value)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ))}

        {configs.length === 0 && (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhuma configuração encontrada</h3>
            <p className="text-xs text-gray-500">
              As configurações do bot aparecerão aqui quando estiverem disponíveis.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 