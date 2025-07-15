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
import { API_ENDPOINTS, apiUrl } from '../config/api'

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
  buttonText: string
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
    footer: 'Kmiza27 Bot ⚽',
    buttonText: 'VER OPÇÕES',
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
          title: '👥 Times, Jogadores e Estádios',
          rows: [
            {
              id: 'CMD_INFO_TIME',
              title: 'ℹ️ Informações do Time',
              description: 'Dados gerais de um time'
            },
            {
              id: 'CMD_ELENCO_TIME',
              title: '👥 Elenco do Time',
              description: 'Ver elenco de um time'
            },
            {
              id: 'CMD_INFO_JOGADOR',
              title: '👤 Informações do Jogador',
              description: 'Dados de um jogador'
            },
            {
              id: 'CMD_POSICAO_TIME',
              title: '📍 Posição na Tabela',
              description: 'Posição do time na competição'
            },
            {
              id: 'CMD_ESTATISTICAS_TIME',
              title: '📈 Estatísticas do Time',
              description: 'Estatísticas detalhadas de um time'
            },
            {
              id: 'CMD_ESTADIOS',
              title: '🏟️ Estádios',
              description: 'Informações sobre estádios'
            }
          ]
        },
        {
          title: '🏆 Competições e Outros',
          rows: [
            {
              id: 'CMD_ARTILHEIROS',
              title: '🥇 Artilheiros',
              description: 'Maiores goleadores de uma competição'
            },
            {
              id: 'CMD_CANAIS',
              title: '📡 Canais',
              description: 'Canais de transmissão'
            },
            {
              id: 'CMD_INFO_COMPETICOES',
              title: '🏆 Informações de Competições',
              description: 'Dados gerais de uma competição'
            }
          ]
        }
    ]
  })

  useEffect(() => {
    fetchConfigs()
    loadWhatsAppMenu()
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

  const loadWhatsAppMenu = async () => {
    try {
      // Carregar seções do menu
      const sectionsResponse = await fetch(apiUrl('whatsapp-menu/sections'))
      const sections = await sectionsResponse.json()
      
      // Carregar configurações gerais do menu
      const generalResponse = await fetch(apiUrl('whatsapp-menu/general-config'))
      const generalConfig = await generalResponse.json()
      
      // Converter o formato da API para o formato do frontend
      const menuConfig = {
        title: generalConfig.title || 'Kmiza27 Bot',
        description: generalConfig.description || 'Selecione uma das opções abaixo',
        footer: generalConfig.footer || 'Kmiza27 Bot ⚽',
        buttonText: generalConfig.buttonText || 'VER OPÇÕES',
        sections: sections
      }
      
      setWhatsappMenu(menuConfig)
    } catch (error) {
      console.error('Erro ao carregar menu do WhatsApp:', error)
      // Manter o menu padrão em caso de erro
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
      // Salvar configurações gerais do menu
      await fetch(apiUrl('whatsapp-menu/general-config'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: whatsappMenu.title,
          description: whatsappMenu.description,
          footer: whatsappMenu.footer,
          buttonText: whatsappMenu.buttonText
        })
      })

      // Primeiro, limpar todas as configurações existentes
      const existingConfigs = await fetch(apiUrl('whatsapp-menu/configs'))
      const configs = await existingConfigs.json()
      
      // Desativar todas as configurações existentes (exceto as configurações gerais)
      for (const config of configs) {
        if (!config.item_id.startsWith('MENU_GENERAL_')) {
          await fetch(apiUrl(`whatsapp-menu/configs/${config.id}`), {
            method: 'DELETE'
          })
        }
      }
      
      // Salvar novas configurações das seções
      let itemOrder = 1
      for (let sectionIndex = 0; sectionIndex < whatsappMenu.sections.length; sectionIndex++) {
        const section = whatsappMenu.sections[sectionIndex]
        const sectionId = `section_${sectionIndex + 1}`
        
        for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
          const row = section.rows[rowIndex]
          
          const menuConfig = {
            section_id: sectionId,
            section_title: section.title,
            section_order: sectionIndex + 1,
            item_id: row.id,
            item_title: row.title,
            item_description: row.description,
            item_order: rowIndex + 1,
            active: true
          }
          
          await fetch(apiUrl('whatsapp-menu/configs'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(menuConfig)
          })
        }
      }
      
      setMessage({ type: 'success', text: 'Menu WhatsApp salvo com sucesso! As alterações já estão ativas.' })
    } catch (error: any) {
      console.error('Erro ao salvar menu WhatsApp:', error)
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
            {/* Configurações Básicas - Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {usedConfigs.filter(config => ['auto_response_enabled', 'BOT_NOME'].includes(config.key)).map((config) => (
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
                      ) : config.key === 'menu_description' ? (
                        <textarea
                          value={config.value}
                          onChange={(e) => handleConfigChange(config.id, e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Digite a descrição do menu..."
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
            </div>

            {/* Outras Configurações - Empilhadas */}
            {usedConfigs.filter(config => !['auto_response_enabled', 'BOT_NOME'].includes(config.key)).map((config) => (
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
                    ) : config.key === 'menu_description' ? (
                      <textarea
                        value={config.value}
                        onChange={(e) => handleConfigChange(config.id, e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Digite a descrição do menu..."
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

            {/* Configurações Gerais do Menu */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">📱 Configurações do Menu WhatsApp</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🤖 Título do Menu (Cabeçalho)
                  </label>
                  <input
                    type="text"
                    value={whatsappMenu.title}
                    onChange={(e) => setWhatsappMenu(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Kmiza27 Bot, FuteBot..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Aparece no topo do menu do WhatsApp</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔘 Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={whatsappMenu.buttonText}
                    onChange={(e) => setWhatsappMenu(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: VER OPÇÕES, MENU, ESCOLHER..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Texto do botão que abre o menu</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Descrição do Menu
                </label>
                <textarea
                  value={whatsappMenu.description}
                  onChange={(e) => setWhatsappMenu(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Selecione uma das opções abaixo para começar..."
                />
                <p className="text-xs text-gray-500 mt-1">Aparece abaixo do título, antes das opções</p>
              </div>

              {/* Campo Footer - Oculto mas mantido para compatibilidade */}
              <input
                type="hidden"
                value={whatsappMenu.footer}
                onChange={(e) => setWhatsappMenu(prev => ({ ...prev, footer: e.target.value }))}
              />

              {/* Aviso sobre Rodapé */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Nota:</strong> O campo "Rodapé" foi removido pois não funcionava corretamente no WhatsApp. 
                  O sistema agora usa apenas os campos funcionais: Título, Descrição e Texto do Botão.
                </p>
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
              <h4 className="text-sm font-medium text-gray-900 mb-4">📱 Preview do Menu WhatsApp</h4>
              <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
                <div className="text-sm">
                  {/* Cabeçalho do Menu */}
                  <div className="font-bold text-gray-900 text-center border-b border-gray-200 pb-2">
                    {whatsappMenu.title}
                  </div>
                  
                  {/* Descrição */}
                  <div className="text-gray-700 mt-2 text-center text-xs">
                    {whatsappMenu.description}
                  </div>
                  
                  {/* Seções */}
                  <div className="mt-4 space-y-3">
                    {whatsappMenu.sections.map((section, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-800 text-xs mb-1">{section.title}</div>
                        {section.rows.slice(0, 3).map((row, rowIndex) => (
                          <div key={rowIndex} className="ml-2 text-xs text-gray-600 truncate">
                            • {row.title}
                          </div>
                        ))}
                        {section.rows.length > 3 && (
                          <div className="ml-2 text-xs text-gray-500">
                            ... e mais {section.rows.length - 3} opções
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Botão */}
                  <div className="mt-4 text-center">
                    <div className="inline-block bg-green-500 text-white text-xs px-3 py-1 rounded">
                      {whatsappMenu.buttonText}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                ✅ Este preview mostra como o menu aparecerá no WhatsApp. 
                Note que o rodapé foi removido pois não era compatível com a Evolution API.
              </p>
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