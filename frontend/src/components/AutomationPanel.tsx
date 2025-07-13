'use client'

import React, { useState, useEffect } from 'react'
import { 
  CogIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon
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

interface WhatsAppMenuConfig {
  title: string
  description: string
  footer: string
  sections: {
    title: string
    rows: {
      id: string
      title: string
      description: string
    }[]
  }[]
}

type TabType = 'general' | 'whatsapp-menu'

export default function AutomationPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [configs, setConfigs] = useState<BotConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [whatsappMenu, setWhatsappMenu] = useState<WhatsAppMenuConfig>({
    title: 'Kmiza27 Bot',
    description: 'Escolha uma das opções abaixo para começar:',
    footer: 'Selecione uma das opções',
    sections: [
      {
        title: '⚡ Ações Rápidas',
        rows: [
          {
            id: 'MENU_TABELAS_CLASSIFICACAO',
            title: '📊 Tabelas de Classificação',
            description: 'Ver classificação das competições'
          },
          {
            id: 'CMD_JOGOS_HOJE',
            title: '📅 Jogos de Hoje',
            description: 'Todos os jogos de hoje'
          },
          {
            id: 'CMD_JOGOS_AMANHA',
            title: '📆 Jogos de Amanhã',
            description: 'Todos os jogos de amanhã'
          },
          {
            id: 'CMD_JOGOS_SEMANA',
            title: '🗓️ Jogos da Semana',
            description: 'Jogos desta semana'
          }
        ]
      },
      {
        title: '⚽ Informações de Partidas',
        rows: [
          {
            id: 'CMD_PROXIMOS_JOGOS',
            title: '⚽ Próximos Jogos',
            description: 'Próximo jogo de um time'
          },
          {
            id: 'CMD_ULTIMO_JOGO',
            title: '🏁 Últimos Jogos',
            description: 'Últimos 3 jogos de um time'
          },
          {
            id: 'CMD_TRANSMISSAO',
            title: '📺 Transmissão',
            description: 'Onde passa o jogo de um time'
          }
        ]
      },
      {
        title: '👥 Times e Jogadores',
        rows: [
          {
            id: 'CMD_INFO_TIME',
            title: 'ℹ️ Informações do Time',
            description: 'Dados completos de um time'
          },
          {
            id: 'CMD_ELENCO_TIME',
            title: '👥 Elenco do Time',
            description: 'Jogadores de um time'
          },
          {
            id: 'CMD_INFO_JOGADOR',
            title: '👤 Informações do Jogador',
            description: 'Dados de um jogador específico'
          }
        ]
      }
    ]
  })

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

  const saveWhatsAppMenu = async () => {
    setSaving(true)
    try {
      // Aqui você implementaria a lógica para salvar o menu do WhatsApp
      // Por enquanto, apenas simular o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: 'Menu WhatsApp salvo com sucesso!' })
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao salvar menu WhatsApp' })
    } finally {
      setSaving(false)
    }
  }

  const addMenuSection = () => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: [...prev.sections, {
        title: 'Nova Seção',
        rows: []
      }]
    }))
  }

  const addMenuRow = (sectionIndex: number) => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => 
        index === sectionIndex 
          ? {
              ...section,
              rows: [...section.rows, {
                id: `CMD_NOVO_${Date.now()}`,
                title: 'Nova Opção',
                description: 'Descrição da opção'
              }]
            }
          : section
      )
    }))
  }

  const updateMenuSection = (sectionIndex: number, field: string, value: string) => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) => 
        index === sectionIndex 
          ? { ...section, [field]: value }
          : section
      )
    }))
  }

  const updateMenuRow = (sectionIndex: number, rowIndex: number, field: string, value: string) => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) => 
        sIndex === sectionIndex 
          ? {
              ...section,
              rows: section.rows.map((row, rIndex) => 
                rIndex === rowIndex 
                  ? { ...row, [field]: value }
                  : row
              )
            }
          : section
      )
    }))
  }

  const removeMenuSection = (sectionIndex: number) => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
    }))
  }

  const removeMenuRow = (sectionIndex: number, rowIndex: number) => {
    setWhatsappMenu(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) => 
        sIndex === sectionIndex 
          ? {
              ...section,
              rows: section.rows.filter((_, rIndex) => rIndex !== rowIndex)
            }
          : section
      )
    }))
  }

  // Filtrar apenas configurações que são realmente usadas
  const usedConfigs = configs.filter(config => {
    const usedKeys = ['welcome_message', 'auto_response_enabled', 'BOT_NOME']
    return usedKeys.includes(config.key)
  })

  const tabs = [
    {
      id: 'general' as TabType,
      name: 'Configurações Gerais',
      icon: Cog6ToothIcon,
      description: 'Configurações básicas do bot'
    },
    {
      id: 'whatsapp-menu' as TabType,
      name: 'Menu WhatsApp',
      icon: DevicePhoneMobileIcon,
      description: 'Configuração visual do menu interativo'
    }
  ]

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
            <h3 className="text-lg font-medium text-gray-900">Configurações do Bot</h3>
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

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center">
                <tab.icon className="h-5 w-5 mr-2" />
                <span>{tab.name}</span>
              </div>
              <p className="text-xs mt-1 text-gray-400">{tab.description}</p>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {usedConfigs.map((config) => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {config.key === 'BOT_NOME' ? 'Nome do Bot' :
                     config.key === 'welcome_message' ? 'Mensagem de Boas-vindas' :
                     config.key === 'auto_response_enabled' ? 'Resposta Automática' :
                     config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    config.key === 'welcome_message' ? (
                      <textarea
                        value={config.value}
                        onChange={(e) => handleConfigChange(config.id, e.target.value)}
                        rows={8}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Digite a mensagem de boas-vindas..."
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      aria-label={`Configuração ${config.key}`}
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

            {usedConfigs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma configuração encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  As configurações do bot serão exibidas aqui quando estiverem disponíveis.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'whatsapp-menu' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📱 Configuração do Menu WhatsApp</h4>
              <p className="text-sm text-blue-700">
                Configure o menu interativo que será exibido aos usuários do WhatsApp. 
                Este menu aparece quando o usuário envia mensagens que não são reconhecidas pelo bot.
              </p>
            </div>

            {/* Configurações Gerais do Menu */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Configurações Gerais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Menu
                  </label>
                  <input
                    type="text"
                    value={whatsappMenu.title}
                    onChange={(e) => setWhatsappMenu(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nome do bot..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rodapé do Menu
                  </label>
                  <input
                    type="text"
                    value={whatsappMenu.footer}
                    onChange={(e) => setWhatsappMenu(prev => ({ ...prev, footer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Texto do rodapé..."
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do Menu
                </label>
                <textarea
                  value={whatsappMenu.description}
                  onChange={(e) => setWhatsappMenu(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Descrição que aparece no topo do menu..."
                />
              </div>
            </div>

            {/* Seções do Menu */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Seções do Menu</h4>
                <button
                  onClick={addMenuSection}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  + Adicionar Seção
                </button>
              </div>

              {whatsappMenu.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateMenuSection(sectionIndex, 'title', e.target.value)}
                      className="text-sm font-medium border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 py-1"
                      placeholder="Título da seção..."
                    />
                    <button
                      onClick={() => removeMenuSection(sectionIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover Seção
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={row.id}
                            onChange={(e) => updateMenuRow(sectionIndex, rowIndex, 'id', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 font-mono"
                            placeholder="ID..."
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => updateMenuRow(sectionIndex, rowIndex, 'title', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Título..."
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) => updateMenuRow(sectionIndex, rowIndex, 'description', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Descrição..."
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            onClick={() => removeMenuRow(sectionIndex, rowIndex)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addMenuRow(sectionIndex)}
                      className="w-full text-sm text-gray-600 border border-dashed border-gray-300 rounded p-2 hover:bg-gray-50"
                    >
                      + Adicionar Opção
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview do Menu */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">📱 Preview do Menu</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
                <div className="text-sm">
                  <div className="font-medium text-green-900">{whatsappMenu.title}</div>
                  <div className="text-green-700 mt-1">{whatsappMenu.description}</div>
                  
                  <div className="mt-3 space-y-2">
                    {whatsappMenu.sections.map((section, index) => (
                      <div key={index}>
                        <div className="font-medium text-green-800 text-xs">{section.title}</div>
                        {section.rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="ml-2 text-xs text-green-700">
                            • {row.title}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-green-600 mt-3 border-t border-green-200 pt-2">
                    {whatsappMenu.footer}
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <button
                onClick={saveWhatsAppMenu}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Menu WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 