'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
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
  BuildingOfficeIcon,
  UserIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  ComputerDesktopIcon
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

import NotificationsManager from './NotificationsManager'
import GlobalSearch from './GlobalSearch'
import SystemSettings from './SystemSettings'
import ThemeToggle from './ThemeToggle'
import TopScorersTable from './TopScorersTable'
import AutomationPanel from './AutomationPanel'
import StatusContent from './StatusContent'
import StadiumsManager from './StadiumsManager'
import TitlesPage from '../app/titles/page'
import ProfilePage from '../app/profile/page'
import PoolsManager from './PoolsManager'

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
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState('Dashboard')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Usuários', 'Jogadores'])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    totalCompetitions: 0,
    totalChannels: 0,
    totalStadiums: 0,
    totalPlayers: 0,
    totalAdmins: 0,
    usersWithFavoriteTeam: 0
  })

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
  }, [isAuthenticated])

  // Detectar parâmetros da URL para navegação direta
  useEffect(() => {
    const page = searchParams.get('page')
    if (page) {
      const pageMap: { [key: string]: string } = {
        'dashboard': 'Dashboard',
        'times': 'Times',
        'jogadores': 'Jogadores',
        'estadios': 'Estádios',
        'competicoes': 'Competições',
        'jogos': 'Jogos',
        'classificacoes': 'Classificações',
        'artilharia': 'Artilharia',
        'boloes': 'Bolões',
        'canais': 'Canais',
        'usuarios': 'Usuários',
        'administradores': 'Administradores',
        'conversas': 'Conversas WhatsApp',
        'automacao': 'Automação IA',
        'notificacoes': 'Notificações',
        'status': 'Status do Sistema',
        'chatbot': 'Chatbot',
        'configuracoes': 'Configurações'
      }
      
      const targetPage = pageMap[page.toLowerCase()]
      if (targetPage) {
        setCurrentPage(targetPage)
      }
    }
  }, [searchParams])

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

  useEffect(() => {
    // Listener para navegação customizada
    const handleNavigateToAutomation = (event: CustomEvent) => {
      setCurrentPage('Configurações do Bot')
    }

    window.addEventListener('navigate-to-automation', handleNavigateToAutomation as EventListener)
    
    return () => {
      window.removeEventListener('navigate-to-automation', handleNavigateToAutomation as EventListener)
    }
  }, [])

  const fetchStats = async () => {
    try {
      // Buscar dados reais de múltiplas APIs
      const responses = await Promise.allSettled([
        fetch(API_ENDPOINTS.whatsapp.status()),
        fetch(API_ENDPOINTS.users.list()),
        fetch(API_ENDPOINTS.teams.list()),
        fetch(API_ENDPOINTS.matches.list(1, 5000)),
        fetch(`${API_ENDPOINTS.competitions.list()}?active=true`),
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
        const res = await responses[1].value.json()
        usersData = res.data ? res.data : res; // Lida com ambos os formatos
      }
      if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
        teamsData = await responses[2].value.json()
      }
      if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
        matchesData = await responses[3].value.json()
      }
      if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
        const res = await responses[4].value.json()
        competitionsData = res.data ? res.data : res; // Lida com ambos os formatos
      }
      if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
        const res = await responses[5].value.json()
        channelsData = res.data ? res.data : res; // Lida com ambos os formatos
      }
      if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
        stadiumsData = await responses[6].value.json()
      }
      if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
        playersData = await responses[7].value.json()
      }
      
      // Calcular estatísticas derivadas
      const adminsCount = Array.isArray(usersData) ? usersData.filter((user: any) => user.is_admin).length : 0;
      const usersWithTeam = Array.isArray(usersData) ? usersData.filter((user: any) => user.favorite_team_id).length : 0;
      
      const totalUsers = usersData?.total ?? (Array.isArray(usersData) ? usersData.length : 0);
      const totalTeams = teamsData?.total ?? 0;
      const totalMatches = matchesData?.total ?? 0;
      const totalCompetitions = competitionsData?.total ?? (Array.isArray(competitionsData) ? competitionsData.length : 0);
      const totalChannels = channelsData?.total ?? (Array.isArray(channelsData) ? channelsData.length : 0);
      const totalStadiums = stadiumsData?.total ?? 0;
      const totalPlayers = playersData?.total ?? 0;
      
      setStats({
        totalUsers,
        totalTeams,
        totalMatches,
        totalCompetitions,
        totalChannels,
        totalStadiums,
        totalPlayers,
        totalAdmins: adminsCount || 0,
        usersWithFavoriteTeam: usersWithTeam || 0
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
        totalAdmins: 0,
        usersWithFavoriteTeam: 0
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

              {/* Card Chatwoot */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.open('https://chat.kmiza27.com', '_blank', 'noopener,noreferrer')}
              >
                <dt>
                  <div className="absolute rounded-md bg-teal-500 p-3">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Chatwoot</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">Live</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-teal-600 hover:text-teal-500">
                        Abrir Chatwoot →
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
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Status do Sistema</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">Online</p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-emerald-600 hover:text-emerald-500">
                        Ver detalhes →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>

              {/* Card Usuários com Time Favorito */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Usuários')}
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
                        Gerenciar usuários →
                      </span>
                    </div>
                  </div>
                </dd>
              </div>



              {/* Card Artilharia */}
              <div 
                className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setCurrentPage('Artilharia')}
              >
                <dt>
                  <div className="absolute rounded-md bg-yellow-500 p-3">
                    <TrophyIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">Artilharia</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">🏆</p>
                  <p className="ml-2 flex items-baseline text-sm font-semibold text-yellow-600">
                    Top Scorers
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gray-50 dark:bg-slate-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-yellow-600 hover:text-yellow-500">
                        Ver artilharia →
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
      case 'Bolões':
        return <PoolsManager />
      case 'Canais':
        return <ChannelsManager />
      case 'Usuários':
        return <UsersManager />
      case 'Administradores':
        return <AdminsManager />
      case 'Configurações do Bot':
        return <AutomationPanel />
      case 'Notificações':
        return <NotificationsManager />
      case 'Status do Sistema':
        return <StatusContent />

      case 'Artilharia':
        return <TopScorersTable />
      case 'Títulos':
        return <TitlesPage />
      case 'Perfil':
        return <ProfilePage />
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

  const menuItems = [
    { name: 'Dashboard', icon: ChartBarIcon, page: 'Dashboard' },
    { name: 'Times', icon: ShieldCheckIcon, page: 'Times' },
    { 
      name: 'Jogadores', 
      icon: UserIcon, 
      page: 'Jogadores',
      subItems: [
        { name: 'Lista de Jogadores', page: 'Jogadores' },
        { name: 'Artilharia', page: 'Artilharia' }
      ]
    },
    { name: 'Estádios', icon: BuildingOfficeIcon, page: 'Estádios' },
    { name: 'Títulos', icon: TrophyIcon, page: 'Títulos' },
    { name: 'Competições', icon: TrophyIcon, page: 'Competições' },
    { name: 'Jogos', icon: CalendarIcon, page: 'Jogos' },
    { name: 'Classificações', icon: ChartPieIcon, page: 'Classificações' },
    { name: 'Bolões', icon: TrophyIcon, page: 'Bolões' },
    { name: 'Canais', icon: TvIcon, page: 'Canais' },
    { 
      name: 'Usuários', 
      icon: UsersIcon, 
      page: 'Usuários',
      subItems: [
        { name: 'Gerenciar Usuários', page: 'Usuários' },
        { name: 'Administradores', page: 'Administradores' }
      ]
    },
    { name: 'Chatwoot', icon: ChatBubbleLeftRightIcon, page: 'Chatwoot', isExternalLink: true },
    { name: 'Configurações do Bot', icon: CpuChipIcon, page: 'Configurações do Bot' },
    { name: 'Notificações', icon: BellIcon, page: 'Notificações' },
    { name: 'Status do Sistema', icon: ComputerDesktopIcon, page: 'Status do Sistema' },
    { name: 'Perfil', icon: UserIcon, page: 'Perfil' },

    { name: 'Configurações', icon: CogIcon, page: 'Configurações' }
  ]

  // Função para gerenciar expansão de menus
  const toggleMenuExpansion = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  // Função para lidar com cliques no menu
  const handleMenuClick = (item: any) => {
    if (item.isExternalLink && item.page === 'Chatwoot') {
      // Abrir Chatwoot em nova aba
      window.open('https://chat.kmiza27.com', '_blank', 'noopener,noreferrer')
      setSidebarOpen(false) // Fechar sidebar mobile
    } else if (item.subItems) {
      // Se tem subitens, expandir/contrair
      toggleMenuExpansion(item.name)
    } else {
      setCurrentPage(item.page)
      setSidebarOpen(false) // Fechar sidebar mobile
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-xl z-60">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kmiza27 Admin</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="mt-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {menuItems.map((item) => {
              const isActive = currentPage === item.page
              const isExpanded = expandedMenus.includes(item.name)
              return (
                <div key={item.name}>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`flex w-full items-center px-4 py-3 text-sm font-medium ${
                      isActive || (item.subItems && item.subItems.some((sub: any) => sub.page === currentPage))
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.subItems && (
                      <svg
                        className={`ml-auto h-4 w-4 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    )}
                  </button>
                  {item.subItems && isExpanded && (
                    <div className="bg-gray-50 dark:bg-slate-700/50">
                      {item.subItems.map((subItem: any) => {
                        const isSubActive = currentPage === subItem.page
                        return (
                          <button
                            key={subItem.name}
                            onClick={() => {
                              setCurrentPage(subItem.page)
                              setSidebarOpen(false)
                            }}
                            className={`flex w-full items-center px-8 py-2 text-sm font-medium ${
                              isSubActive
                                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600 dark:bg-blue-800/20 dark:text-blue-300'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-600'
                            }`}
                          >
                            <span className="mr-3 w-5 flex justify-center text-xs">•</span>
                            {subItem.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-slate-800 px-6 shadow-lg border-r border-gray-200 dark:border-slate-700">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kmiza27 Admin</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = currentPage === item.page
                    const isExpanded = expandedMenus.includes(item.name)
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => handleMenuClick(item)}
                          className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive || (item.subItems && item.subItems.some((sub: any) => sub.page === currentPage))
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <item.icon className="h-6 w-6 shrink-0" />
                          {item.name}
                          {item.subItems && (
                            <svg
                              className={`ml-auto h-4 w-4 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          )}
                        </button>
                        {item.subItems && isExpanded && (
                          <ul className="ml-6 mt-1 space-y-1">
                            {item.subItems.map((subItem: any) => {
                              const isSubActive = currentPage === subItem.page
                              return (
                                <li key={subItem.name}>
                                  <button
                                    onClick={() => {
                                      setCurrentPage(subItem.page)
                                      setSidebarOpen(false)
                                    }}
                                    className={`group flex w-full gap-x-3 rounded-md p-2 text-sm leading-6 font-medium ${
                                      isSubActive
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-800/20 dark:text-blue-300'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/10'
                                    }`}
                                  >
                                    <span className="w-6 flex justify-center">•</span>
                                    {subItem.name}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
            
            {/* Status do Sistema no final do menu */}

          </nav>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-72">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white dark:bg-slate-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <GlobalSearch onNavigate={setCurrentPage} />
            </div>
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
                    className="absolute right-0 z-50 mt-2.5 w-56 origin-top-right rounded-lg bg-white dark:bg-slate-800 shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-slate-700 focus:outline-none" 
                    role="menu" 
                    aria-orientation="vertical" 
                    aria-labelledby="user-menu-button"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full bg-gray-50 ring-2 ring-white dark:ring-slate-800"
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt="Foto do usuário"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.name || user?.username || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email || 'Administrador'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors group"
                        role="menuitem"
                      >
                        <svg className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair
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