'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  CalendarIcon,
  TvIcon,
  BellIcon,
  ServerIcon,
  UserGroupIcon,
  HeartIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon,
  ChartPieIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import StatsCards from './StatsCards'

import TeamsManager from './TeamsManager'
import CompetitionsManager from './CompetitionsManager'
import MatchesManager from './MatchesManager'
import StandingsManager from './StandingsManager'
import ChannelsManager from './ChannelsManager'
import UsersManager from './UsersManager'
import AdminsManager from './AdminsManager'
import ChatbotSettings from './ChatbotSettings'
import BroadcastManager from './BroadcastManager'
import NotificationsManager from './NotificationsManager'
import GlobalSearch from './GlobalSearch'
import SystemSettings from './SystemSettings'
import ThemeToggle from './ThemeToggle'
import WhatsAppConversations from './WhatsAppConversations'
import AutomationPanel from './AutomationPanel'
import CompetitionTiebreakers from './CompetitionTiebreakers'
import CompetitionTeamsManager from './CompetitionTeamsManager'
import UserStats from './UserStats'
import StatusContent from './StatusContent'
import { API_ENDPOINTS } from '../config/api'

// Navegação atualizada com todas as páginas disponíveis
const navigation = [
  { name: 'Dashboard', href: '#', icon: ChartBarIcon, current: true },
  { name: 'Times', href: '#', icon: TrophyIcon, current: false },
  { name: 'Competições', href: '#', icon: TrophyIcon, current: false },
  { name: 'Times por Competição', href: '#', icon: UserGroupIcon, current: false },
  { name: 'Jogos', href: '#', icon: CalendarIcon, current: false },
  { name: 'Classificações', href: '#', icon: ChartBarIcon, current: false },
  { name: 'Critérios de Desempate', href: '#', icon: WrenchScrewdriverIcon, current: false },
  { name: 'Canais', href: '#', icon: TvIcon, current: false },
  { name: 'Usuários', href: '#', icon: UsersIcon, current: false },
  { name: 'Estatísticas de Usuários', href: '#', icon: ChartPieIcon, current: false },
  { name: 'Administradores', href: '#', icon: UserGroupIcon, current: false },
  { name: 'Conversas WhatsApp', href: '#', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'Automação IA', href: '#', icon: CogIcon, current: false },
  { name: 'Transmissões', href: '#', icon: PlayIcon, current: false },
  { name: 'Notificações', href: '#', icon: BellIcon, current: false },
  { name: 'Status do Sistema', href: '#', icon: ServerIcon, current: false },
  { name: 'Chatbot', href: '#', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'Configurações', href: '#', icon: CogIcon, current: false },
]

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState('Dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    totalCompetitions: 0,
    totalChannels: 0,
    activeConversations: 0,
    totalAdmins: 0,
    usersWithFavoriteTeam: 0,
    recentInteractions: 0
  })

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Carregar estatísticas do backend
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      console.log('🔄 Dashboard: Carregando estatísticas reais...')
      
      // Buscar dados reais de múltiplas APIs
      const responses = await Promise.allSettled([
        fetch(API_ENDPOINTS.whatsapp.status()),
        fetch(API_ENDPOINTS.users.list()),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.matches.list()),
        fetch(API_ENDPOINTS.competitions.list()),
        fetch(API_ENDPOINTS.channels.list())
      ])
      
      let whatsappData = null
      let usersData = []
      let teamsData = []
      let matchesData = []
      let competitionsData = []
      let channelsData = []
      
      // Processar respostas de forma segura
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        whatsappData = await responses[0].value.json()
      }
      if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
        usersData = await responses[1].value.json()
      }
      if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
        teamsData = await responses[2].value.json()
      }
      if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
        matchesData = await responses[3].value.json()
      }
      if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
        competitionsData = await responses[4].value.json()
      }
      if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
        channelsData = await responses[5].value.json()
      }
      
      // Calcular estatísticas derivadas
      const adminsCount = usersData.filter((user: any) => user.is_admin).length
      const usersWithTeam = usersData.filter((user: any) => user.favorite_team_id).length
      
      console.log('📊 Dashboard: Dados recebidos:', {
        whatsapp: whatsappData,
        users: usersData.length,
        teams: teamsData.length,
        matches: matchesData.length,
        competitions: competitionsData.length,
        channels: channelsData.length,
        admins: adminsCount,
        usersWithTeam: usersWithTeam
      })
      
      setStats({
        totalUsers: usersData.length || 0,
        totalTeams: teamsData.length || 0,
        totalMatches: matchesData.length || 0,
        totalCompetitions: competitionsData.length || 0,
        totalChannels: channelsData.length || 0,
        activeConversations: whatsappData?.totalConversations || 0,
        totalAdmins: adminsCount || 0,
        usersWithFavoriteTeam: usersWithTeam || 0,
        recentInteractions: whatsappData?.recentInteractions || 0
      })
      
    } catch (error) {
      console.error('❌ Dashboard: Erro ao carregar estatísticas:', error)
      // Dados de fallback em caso de erro
      setStats({
        totalUsers: 0,
        totalTeams: 0,
        totalMatches: 0,
        totalCompetitions: 0,
        totalChannels: 0,
        activeConversations: 0,
        totalAdmins: 0,
        usersWithFavoriteTeam: 0,
        recentInteractions: 0
      })
    }
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return (
          <div className="space-y-8">
            {/* Título da página no topo */}
            <div className="border-b border-gray-200 dark:border-slate-600 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Visão Geral
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Painel de controle do sistema Kmiza27 Chatbot
              </p>
            </div>

            {/* Cards de estatísticas principais */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card Usuários */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Usuários')}
              >
                <dt>
                  <div className="absolute rounded-md bg-blue-500 p-3">
                    <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Usuários</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                    {stats.totalAdmins} admins
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Gerenciar usuários →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Times */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Times')}
              >
                <dt>
                  <div className="absolute rounded-md bg-green-500 p-3">
                    <TrophyIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Times Cadastrados</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTeams}</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                    {stats.usersWithFavoriteTeam} favoritos
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-green-600 hover:text-green-500">
                        Gerenciar times →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Jogos */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Jogos')}
              >
                <dt>
                  <div className="absolute rounded-md bg-purple-500 p-3">
                    <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Jogos Cadastrados</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMatches}</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-purple-600">
                    {stats.totalCompetitions} competições
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-purple-600 hover:text-purple-500">
                        Gerenciar jogos →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Conversas */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Conversas WhatsApp')}
              >
                <dt>
                  <div className="absolute rounded-md bg-orange-500 p-3">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Conversas Ativas</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeConversations}</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-orange-600">
                    WhatsApp
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-orange-600 hover:text-orange-500">
                        Ver conversas →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>
            </div>

            {/* Cards secundários */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Card Competições */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Competições')}
              >
                <dt>
                  <div className="absolute rounded-md bg-indigo-500 p-3">
                    <TrophyIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Competições</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCompetitions}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-indigo-600 hover:text-indigo-500">
                        Gerenciar →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Canais */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Canais')}
              >
                <dt>
                  <div className="absolute rounded-md bg-red-500 p-3">
                    <TvIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Canais de TV</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalChannels}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-red-600 hover:text-red-500">
                        Gerenciar →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Status do Sistema */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Status do Sistema')}
              >
                <dt>
                  <div className="absolute rounded-md bg-emerald-500 p-3">
                    <ServerIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Sistema</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Online</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-emerald-600 hover:text-emerald-500">
                        Ver status →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={() => setCurrentPage('Classificações')}
                    className="relative group bg-gray-50 dark:bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 ring-4 ring-white dark:ring-slate-800">
                        <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Classificações
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Ver tabelas e classificações das competições
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentPage('Automação IA')}
                    className="relative group bg-gray-50 dark:bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-400 ring-4 ring-white dark:ring-slate-800">
                        <CogIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Automação IA
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Configurar respostas automáticas e IA
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentPage('Notificações')}
                    className="relative group bg-gray-50 dark:bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-orange-50 dark:bg-orange-900 text-orange-600 dark:text-orange-400 ring-4 ring-white dark:ring-slate-800">
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Notificações
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Enviar notificações e mensagens
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentPage('Configurações')}
                    className="relative group bg-gray-50 dark:bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    <div>
                      <span className="rounded-lg inline-flex p-3 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 ring-4 ring-white dark:ring-slate-800">
                        <CogIcon className="h-6 w-6" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        <span className="absolute inset-0" aria-hidden="true" />
                        Configurações
                      </h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Configurações gerais do sistema
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'Times':
        return <TeamsManager />
      case 'Competições':
        return <CompetitionsManager />
      case 'Times por Competição':
        return <CompetitionTeamsManager />
      case 'Jogos':
        return <MatchesManager />
      case 'Canais':
        return <ChannelsManager />
      case 'Classificações':
        return <StandingsManager />
      case 'Critérios de Desempate':
        return <CompetitionTiebreakers />
      case 'Usuários':
        return <UsersManager />
      case 'Estatísticas de Usuários':
        return <UserStats />
      case 'Administradores':
        return <AdminsManager />
      case 'Conversas WhatsApp':
        return <WhatsAppConversations />
      case 'Automação IA':
        return <AutomationPanel />
      case 'Chatbot':
        return <ChatbotSettings />
      case 'Transmissões':
        return <BroadcastManager />
      case 'Notificações':
        return <NotificationsManager />
      case 'Status do Sistema':
        return <StatusContent />
      case 'Configurações':
        return <SystemSettings />
      default:
        return (
          <div className="space-y-8">
            <div className="border-b border-gray-200 dark:border-slate-600 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Visão Geral
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Painel de controle do sistema Kmiza27 Chatbot
              </p>
            </div>
            <StatsCards stats={stats} onNavigate={setCurrentPage} />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Sidebar 
        navigation={navigation} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
      />
      
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-slate-600" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Painel Administrativo - Kmiza27 Chatbot
              </h1>
            </div>
            <div className="flex flex-1 justify-center">
              <GlobalSearch onNavigate={setCurrentPage} />
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name || user.username}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Administrador
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      window.location.href = '/login'
                    }}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}