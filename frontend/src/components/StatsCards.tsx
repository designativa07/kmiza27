'use client'

import { useState } from 'react'
import { UsersIcon, TrophyIcon, CalendarIcon, ChatBubbleLeftRightIcon, ChartBarIcon, HeartIcon, ClockIcon } from '@heroicons/react/24/outline'
import AdvancedCharts from './AdvancedCharts'
import WhatsAppConversations from './WhatsAppConversations'

interface StatsProps {
  stats: {
    totalUsers: number
    totalTeams: number
    totalMatches: number
    activeConversations: number
  }
}

export default function StatsCards({ stats }: StatsProps) {
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false)
  const [showWhatsAppConversations, setShowWhatsAppConversations] = useState(false)

  // Primeira linha de cards (dados principais)
  const mainStatsData = [
    {
      name: 'Usuários Ativos',
      stat: stats.totalUsers > 0 ? '1' : '0', // Usar dados reais quando disponível
      icon: UsersIcon,
      change: 'Online agora',
      changeType: 'neutral',
    },
    {
      name: 'Com Time Favorito',
      stat: '0', // Placeholder até termos dados reais
      icon: HeartIcon,
      change: 'Configurado',
      changeType: 'neutral',
    },
    {
      name: 'Interações Recentes (24h)',
      stat: '1',
      icon: ClockIcon,
      change: 'Últimas 24h',
      changeType: 'neutral',
    },
  ]

  // Segunda linha de cards (visão geral)
  const overviewStatsData = [
    {
      name: 'Total de Usuários',
      stat: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Times Cadastrados',
      stat: stats.totalTeams.toString(),
      icon: TrophyIcon,
      change: `${stats.totalTeams} times`,
      changeType: 'neutral',
    },
    {
      name: 'Jogos Cadastrados',
      stat: stats.totalMatches.toLocaleString(),
      icon: CalendarIcon,
      change: '+5 hoje',
      changeType: 'increase',
    },
    {
      name: 'Conversas Ativas',
      stat: stats.activeConversations.toString(),
      icon: ChatBubbleLeftRightIcon,
      change: 'Em tempo real',
      changeType: 'neutral',
      onClick: () => setShowWhatsAppConversations(true),
    },
  ]

  return (
    <div>
      {/* Primeira linha de cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {mainStatsData.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.stat}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' 
                    ? 'text-green-600' 
                    : item.changeType === 'neutral'
                    ? 'text-gray-500'
                    : 'text-red-600'
                }`}
              >
                {item.change}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                    {item.name === 'Conversas Ativas' ? 'Ver conversas' : 'Ver detalhes'}
                  </span>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </div>

      {/* Seção Visão Geral */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Visão Geral</h3>
        <button
          onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          {showAdvancedCharts ? 'Visão Simples' : 'Gráficos Avançados'}
        </button>
      </div>

      {!showAdvancedCharts ? (
        <>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {overviewStatsData.map((item) => (
          <div
            key={item.name}
            className={`relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 ${
              item.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
            }`}
            onClick={item.onClick}
          >
                <dt>
                  <div className="absolute rounded-md bg-indigo-500 p-3">
                    <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{item.stat}</p>
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'increase' 
                        ? 'text-green-600' 
                        : item.changeType === 'neutral'
                        ? 'text-gray-500'
                        : 'text-red-600'
                    }`}
                  >
                    {item.change}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-indigo-600 hover:text-indigo-500">
                        Ver detalhes
                      </span>
                    </div>
                  </div>
                </dd>
              </div>
            ))}
          </dl>

          {/* Gráfico de atividade recente */}
          <div className="mt-8">
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
              <div className="p-6">
                                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Atividade Recente</h3>
                <div className="mt-6 flow-root">
                                      <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-slate-600">
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            Nova conversa iniciada
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
                            Usuário perguntou sobre próximo jogo do Flamengo
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-300">
                          2 min atrás
                        </div>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <CalendarIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Novo jogo cadastrado
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Flamengo x Palmeiras - 26/05/2025
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          15 min atrás
                        </div>
                      </div>
                    </li>
                    <li className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center">
                            <UsersIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Novos usuários registrados
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            25 novos usuários hoje
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          1 hora atrás
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <AdvancedCharts />
      )}

      {/* Modal/Seção de Conversas WhatsApp */}
      {showWhatsAppConversations && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Conversas WhatsApp em Tempo Real</h3>
            <button
              onClick={() => setShowWhatsAppConversations(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Fechar
            </button>
          </div>
          <WhatsAppConversations />
        </div>
      )}
    </div>
  )
} 