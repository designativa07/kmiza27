'use client'

import { useState } from 'react'
import { 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // Configurações do Chatbot
    chatbot: {
      autoResponse: true,
      responseDelay: 1000,
      maxMessagesPerMinute: 10,
      enableTypingIndicator: true,
      defaultLanguage: 'pt-BR'
    },
    // Configurações de Notificações
    notifications: {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      notificationSound: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    // Configurações de Segurança
    security: {
      enableTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableAuditLog: true
    },
    // Configurações de Sistema
    system: {
      enableMaintenance: false,
      enableDebugMode: false,
      logLevel: 'info',
      backupFrequency: 'daily'
    }
  })

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
  }

  const handleNestedSettingChange = (category: string, nested: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [nested]: {
          ...(prev[category as keyof typeof prev] as any)[nested],
          [setting]: value
        }
      }
    }))
  }

  const saveSettings = async () => {
    try {
      // Simular salvamento
      console.log('Salvando configurações:', settings)
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    }
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Configurações do Sistema</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure o comportamento do chatbot, notificações, segurança e sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={saveSettings}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Configurações do Chatbot */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações do Chatbot</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Resposta Automática</label>
                <p className="text-sm text-gray-700">Responder automaticamente às mensagens</p>
              </div>
              <input
                type="checkbox"
                checked={settings.chatbot.autoResponse}
                onChange={(e) => handleSettingChange('chatbot', 'autoResponse', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Indicador de Digitação</label>
                <p className="text-sm text-gray-700">Mostrar "digitando..." antes de responder</p>
              </div>
              <input
                type="checkbox"
                checked={settings.chatbot.enableTypingIndicator}
                onChange={(e) => handleSettingChange('chatbot', 'enableTypingIndicator', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Delay de Resposta (ms)</label>
              <input
                type="number"
                value={settings.chatbot.responseDelay}
                onChange={(e) => handleSettingChange('chatbot', 'responseDelay', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Máx. Mensagens/Minuto</label>
              <input
                type="number"
                value={settings.chatbot.maxMessagesPerMinute}
                onChange={(e) => handleSettingChange('chatbot', 'maxMessagesPerMinute', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Notificações */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Notificações</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Notificações Push</label>
                <p className="text-sm text-gray-700">Receber notificações no navegador</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.enablePushNotifications}
                onChange={(e) => handleSettingChange('notifications', 'enablePushNotifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Som de Notificação</label>
                <p className="text-sm text-gray-700">Reproduzir som ao receber notificações</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.notificationSound}
                onChange={(e) => handleSettingChange('notifications', 'notificationSound', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Horário Silencioso</label>
                <p className="text-sm text-gray-700">Não enviar notificações em horários específicos</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.quietHours.enabled}
                onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'enabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            {settings.notifications.quietHours.enabled && (
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Início</label>
                    <input
                      type="time"
                      value={settings.notifications.quietHours.start}
                      onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'start', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900">Fim</label>
                    <input
                      type="time"
                      value={settings.notifications.quietHours.end}
                      onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'end', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configurações de Segurança */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Autenticação de Dois Fatores</label>
                <p className="text-sm text-gray-700">Adicionar camada extra de segurança</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enableTwoFactor}
                onChange={(e) => handleSettingChange('security', 'enableTwoFactor', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Log de Auditoria</label>
                <p className="text-sm text-gray-700">Registrar todas as ações do sistema</p>
              </div>
              <input
                type="checkbox"
                checked={settings.security.enableAuditLog}
                onChange={(e) => handleSettingChange('security', 'enableAuditLog', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Timeout de Sessão (min)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Máx. Tentativas de Login</label>
              <input
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Sistema */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Sistema</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Modo de Manutenção</label>
                <p className="text-sm text-gray-700">Desabilitar temporariamente o sistema</p>
              </div>
              <div className="flex items-center">
                {settings.system.enableMaintenance && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
                )}
                <input
                  type="checkbox"
                  checked={settings.system.enableMaintenance}
                  onChange={(e) => handleSettingChange('system', 'enableMaintenance', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Modo Debug</label>
                <p className="text-sm text-gray-700">Ativar logs detalhados para desenvolvimento</p>
              </div>
              <input
                type="checkbox"
                checked={settings.system.enableDebugMode}
                onChange={(e) => handleSettingChange('system', 'enableDebugMode', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Nível de Log</label>
              <select
                value={settings.system.logLevel}
                onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">Frequência de Backup</label>
              <select
                value={settings.system.backupFrequency}
                onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Status do Sistema</h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-gray-700">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">1.2s</div>
              <div className="text-sm text-gray-700">Tempo de Resposta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">45MB</div>
              <div className="text-sm text-gray-700">Uso de Memória</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 