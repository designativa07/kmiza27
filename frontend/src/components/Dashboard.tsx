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
  ChartPieIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  FunnelIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import StatsCards from './StatsCards'

import TeamsManager from './TeamsManager'
import PlayersManager from './PlayersManager'
import CompetitionsManager from './CompetitionsManager'
import MatchesManager from './MatchesManager'
import StandingsManager from './StandingsManager'
import ChannelsManager from './ChannelsManager'
import UsersManager from './UsersManager'
import AdminsManager from './AdminsManager'
import ChatbotSettings from './ChatbotSettings'
import NotificationsManager from './NotificationsManager'
import GlobalSearch from './GlobalSearch'
import SystemSettings from './SystemSettings'
import ThemeToggle from './ThemeToggle'
import WhatsAppConversations from './WhatsAppConversations'
import AutomationPanel from './AutomationPanel'
import CompetitionTeamsManager from './CompetitionTeamsManager'
import UserStats from './UserStats'
import StatusContent from './StatusContent'
import StadiumsManager from './StadiumsManager'
import { API_ENDPOINTS } from '../config/api'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'

interface UserStats {
  whatsapp: {
    total_messages: number
    total_users: number
    messages_today: number
    active_users_today: number
    response_time_avg: number
  }
  users: number
  teams: number
  matches: number
  competitions: number
  channels: number
  stadiums: number
  players: number
}

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState('Dashboard')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    totalCompetitions: 0,
    totalChannels: 0,
    totalStadiums: 0,
    totalPlayers: 0,
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

  // Função para fazer logout
  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  // Fechar menu do usuário quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('#user-menu-button') && !target.closest('#user-menu')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
        fetch(API_ENDPOINTS.channels.list()),
        fetch(API_ENDPOINTS.stadiums.list()),
        fetch(API_ENDPOINTS.players.list())
      ])
      
      let whatsappData = null
      let usersData = []
      let teamsData = []
      let matchesData = []
      let competitionsData = []
      let channelsData = []
      let stadiumsData = []
      let playersData = []
      
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
      if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
        stadiumsData = await responses[6].value.json()
      }
      if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
        playersData = await responses[7].value.json()
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
        stadiums: stadiumsData.length,
        players: playersData.length,
        admins: adminsCount,
        usersWithTeam: usersWithTeam
      })
      
      setStats({
        totalUsers: usersData.length || 0,
        totalTeams: teamsData.length || 0,
        totalMatches: matchesData.length || 0,
        totalCompetitions: competitionsData.length || 0,
        totalChannels: channelsData.length || 0,
        totalStadiums: stadiumsData.length || 0,
        totalPlayers: playersData.length || 0,
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
        totalStadiums: 0,
        totalPlayers: 0,
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
                  <div className="absolute rounded-md bg-orange-500 p-3">
                    <UserGroupIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Times</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTeams}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-orange-600 hover:text-orange-500">
                        Gerenciar times →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Jogadores */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Jogadores')}
              >
                <dt>
                  <div className="absolute rounded-md bg-purple-500 p-3">
                    <UsersIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Jogadores</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPlayers}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-purple-600 hover:text-purple-500">
                        Gerenciar jogadores →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Partidas */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Jogos')}
              >
                <dt>
                  <div className="absolute rounded-md bg-pink-500 p-3">
                    <CalendarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Partidas</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMatches}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-pink-600 hover:text-pink-500">
                        Gerenciar partidas →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Competições */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Competições')}
              >
                <dt>
                  <div className="absolute rounded-md bg-green-500 p-3">
                    <TrophyIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Competições</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCompetitions}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-green-600 hover:text-green-500">
                        Gerenciar competições →
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
                  <div className="absolute rounded-md bg-cyan-500 p-3">
                    <TvIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Canais</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalChannels}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-cyan-600 hover:text-cyan-500">
                        Gerenciar canais →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Estádios */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Estádios')}
              >
                <dt>
                  <div className="absolute rounded-md bg-red-500 p-3">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Total de Estádios</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalStadiums}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-red-600 hover:text-red-500">
                        Gerenciar estádios →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Conversas Ativas */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Conversas WhatsApp')}
              >
                <dt>
                  <div className="absolute rounded-md bg-teal-500 p-3">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Conversas Ativas</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeConversations}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-teal-600 hover:text-teal-500">
                        Ver conversas →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Usuários com Time Favorito */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Estatísticas de Usuários')}
              >
                <dt>
                  <div className="absolute rounded-md bg-yellow-500 p-3">
                    <HeartIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Usuários com Time Favorito</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.usersWithFavoriteTeam}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-yellow-600 hover:text-yellow-500">
                        Ver estatísticas de usuários →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Interações Recentes */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Conversas WhatsApp')}
              >
                <dt>
                  <div className="absolute rounded-md bg-indigo-500 p-3">
                    <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Interações Recentes (24h)</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.recentInteractions}</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-indigo-600 hover:text-indigo-500">
                        Ver logs de interações →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>
            </div>

            {/* Outras seções do Dashboard (ex: gráficos, tabelas recentes, etc.) */}
            
            {/* Exemplo de componente de visão geral do Dashboard que pode ser adicionado */}
            {/* <DashboardOverview /> */}
          </div>
        )
      case 'Times':
        return <TeamsManager />
      case 'Jogadores':
        return <PlayersManager />
      case 'Estádios':
        return <StadiumsManager />
      case 'Competições':
        return <CompetitionsManager />
      case 'Jogos':
        return <MatchesManager />
      case 'Classificações':
        return <StandingsManager />
      case 'Canais':
        return <ChannelsManager />
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
      case 'Notificações':
        return <NotificationsManager />
      case 'Status do Sistema':
        return <StatusContent />
      case 'Chatbot':
        return <ChatbotSettings />
      case 'Configurações':
        return <SystemSettings />
      default:
        return (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Selecione uma opção no menu lateral.
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-72">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">Pesquisar</label>
              <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" aria-hidden="true" />
              <input
                id="search-field"
                className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Pesquisar..." type="search" name="search"
              />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <ThemeToggle />

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
              
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  id="user-menu-button" 
                  aria-expanded={showUserMenu} 
                  aria-haspopup="true"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="sr-only">Abrir menu do usuário</span>
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Foto do usuário"
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900 dark:text-white" aria-hidden="true">
                      {user?.name || user?.username || 'Usuário'}
                    </span>
                    <ChevronDownIcon 
                      className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} 
                      aria-hidden="true" 
                    />
                  </span>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div 
                    id="user-menu"
                    className="absolute right-0 z-50 mt-2.5 w-48 origin-top-right rounded-md bg-white dark:bg-slate-800 py-2 shadow-lg ring-1 ring-gray-900/5 dark:ring-slate-700 focus:outline-none" 
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="user-menu-button"
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-600">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.name || user?.username || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || 'Administrador'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        setCurrentPage('Configurações')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      role="menuitem"
                    >
                      ⚙️ Configurações
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        setCurrentPage('Administradores')
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      role="menuitem"
                    >
                      👥 Gerenciar Admins
                    </button>
                    
                    <div className="border-t border-gray-200 dark:border-slate-600 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        role="menuitem"
                      >
                        🚪 Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}