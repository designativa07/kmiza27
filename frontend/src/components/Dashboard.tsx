'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CogIcon, 
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  CalendarIcon,
  TvIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import Sidebar from './Sidebar'
import StatsCards from './StatsCards'

import TeamsManager from './TeamsManager'
import CompetitionsManager from './CompetitionsManager'
import MatchesManager from './MatchesManager'
import StandingsManager from './StandingsManager'
import UsersManager from './UsersManager'
import ChatbotSettings from './ChatbotSettings'
import BroadcastManager from './BroadcastManager'
import NotificationsManager from './NotificationsManager'
import GlobalSearch from './GlobalSearch'
import SystemSettings from './SystemSettings'
import ThemeToggle from './ThemeToggle'
import WhatsAppConversations from './WhatsAppConversations'
import AutomationPanel from './AutomationPanel'


const navigation = [
  { name: 'Dashboard', href: '#', icon: ChartBarIcon, current: true },
  { name: 'Times', href: '#', icon: TrophyIcon, current: false },
  { name: 'Competições', href: '#', icon: TrophyIcon, current: false },
  { name: 'Jogos', href: '#', icon: CalendarIcon, current: false },
  { name: 'Classificações', href: '#', icon: ChartBarIcon, current: false },
  { name: 'Usuários', href: '#', icon: UsersIcon, current: false },
  { name: 'Conversas WhatsApp', href: '#', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'Automação IA', href: '#', icon: CogIcon, current: false },
  { name: 'Notificações', href: '#', icon: BellIcon, current: false },
  { name: 'Chatbot', href: '#', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'Configurações', href: '#', icon: CogIcon, current: false },
]

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState('Dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalMatches: 0,
    activeConversations: 0
  })

  useEffect(() => {
    // Carregar estatísticas do backend
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      console.log('🔄 Dashboard: Carregando estatísticas reais...')
      
      // Buscar dados reais de múltiplas APIs (removendo chatbot/status que está causando erro)
      const responses = await Promise.allSettled([
        fetch('http://localhost:3000/whatsapp/status'),
        fetch('http://localhost:3000/users'),
        fetch('http://localhost:3000/teams'),
        fetch('http://localhost:3000/matches')
      ])
      
      let whatsappData = null
      let usersData = []
      let teamsData = []
      let matchesData = []
      
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
      
      console.log('📊 Dashboard: Dados recebidos:', {
        whatsapp: whatsappData,
        users: usersData.length,
        teams: teamsData.length,
        matches: matchesData.length
      })
      
      setStats({
        totalUsers: usersData.length || 0,
        totalTeams: teamsData.length || 0,
        totalMatches: matchesData.length || 0,
        activeConversations: whatsappData?.totalConversations || 0
      })
      
    } catch (error) {
      console.error('❌ Dashboard: Erro ao carregar estatísticas:', error)
      // Dados de fallback em caso de erro
      setStats({
        totalUsers: 0,
        totalTeams: 0,
        totalMatches: 0,
        activeConversations: 0
      })
    }
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return (
          <div className="space-y-8">
            <StatsCards stats={stats} />
          </div>
        )
      case 'Times':
        return <TeamsManager />
      case 'Competições':
        return <CompetitionsManager />
      case 'Jogos':
        return <MatchesManager />
      case 'Classificações':
        return <StandingsManager />
      case 'Usuários':
        return <UsersManager />
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
      case 'Configurações':
        return <SystemSettings />
      default:
        return (
          <div className="space-y-8">
            <StatsCards stats={stats} />
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
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Painel Administrativo - Kmiza27 Chatbot
              </h1>
            </div>
            <div className="flex flex-1 justify-center">
              <GlobalSearch onNavigate={setCurrentPage} />
            </div>
            <div className="flex items-center">
              <ThemeToggle />
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