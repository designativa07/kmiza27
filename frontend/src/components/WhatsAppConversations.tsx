'use client'

import React, { useState, useEffect, useRef } from 'react'
import '../styles/scrollbar.css'
import { 
  ChatBubbleLeftRightIcon, 
  PhoneIcon, 
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface WhatsAppMessage {
  id: string
  phone: string
  userName?: string
  message: string
  timestamp: string
  messageTimestamp?: number // Timestamp original em segundos para ordenação precisa
  type: 'incoming' | 'outgoing'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  isBot: boolean
}

interface WhatsAppConversation {
  id: string
  phone: string
  userName?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'active' | 'waiting' | 'closed'
  messages: WhatsAppMessage[]
}

interface ConversationStats {
  total: number
  active: number
  waiting: number
  closed: number
  footballRelated: number
  averageResponseTime: string
  topTeams: { team: string; count: number }[]
}

interface EngagementAnalytics {
  totalMessages: number
  activeUsers: number
  responseRate: number
  averageResponseTime: string
  dailyStats: Array<{ date: string; messages: number; users: number }>
}

interface TeamAnalytics {
  team: string
  conversations: number
  engagement: number
  sentiment: 'positive' | 'neutral' | 'negative'
  topKeywords: string[]
}

interface FilterOptions {
  teams: Array<{ value: string; label: string }>
  competitions: Array<{ value: string; label: string }>
  periods: Array<{ value: string; label: string }>
  statuses: Array<{ value: string; label: string }>
}

export default function WhatsAppConversations() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'football' | 'active' | 'waiting' | 'closed'>('all')
  const [stats, setStats] = useState<ConversationStats | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Função para rolar para a última mensagem
  const scrollToBottom = () => {
    console.log('📜 Tentando fazer scroll para baixo...')
    
    // Método mais direto e confiável
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      console.log('📜 Container encontrado, forçando scroll para baixo')
      console.log('📜 ScrollHeight:', container.scrollHeight, 'ClientHeight:', container.clientHeight)
      
      // Forçar scroll para o final de múltiplas formas
      container.scrollTop = container.scrollHeight - container.clientHeight
      
      // Método alternativo mais agressivo
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
      
      // Também tentar com scrollIntoView se o elemento final existir
      if (messagesEndRef.current) {
        console.log('📜 Também usando scrollIntoView como backup')
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        })
      }
      
      console.log('📜 Scroll executado - Nova posição:', container.scrollTop)
    } else {
      console.log('📜 ❌ Container de mensagens não encontrado')
    }
  }

  // Rolar para baixo quando mensagens mudarem
  useEffect(() => {
    const selectedConv = conversations.find(c => c.id === selectedConversation)
    if (selectedConv && selectedConv.messages && selectedConv.messages.length > 0) {
      console.log('📜 Mensagens carregadas, iniciando scroll automático')
      
      // Scroll imediato
      scrollToBottom()
      
      // Scroll com delay para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        console.log('📜 Scroll com delay executado')
        scrollToBottom()
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [conversations, selectedConversation])

  // Detectar scroll para mostrar indicadores visuais
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      setIsScrolling(true)
      
      // Verificar se está próximo do final (dentro de 100px)
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
      
      // Limpar timeout anterior
      clearTimeout(scrollTimeout)
      
      // Definir que parou de fazer scroll após 150ms
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    container.addEventListener('scroll', handleScroll)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [selectedConversation])

  useEffect(() => {
    fetchConversations()
    fetchStats()
    // Configurar polling para atualizações em tempo real
    const interval = setInterval(() => {
      fetchConversations()
      fetchStats()
      
      // Se há uma conversa selecionada, atualizar suas mensagens também
      if (selectedConversation) {
        fetchConversationMessages(selectedConversation)
      }
    }, 20000) // 20 segundos - menos frequente para evitar scroll excessivo

    return () => {
      clearInterval(interval)
    }
  }, [filter, selectedConversation]) // Incluir selectedConversation para atualizar mensagens

  useEffect(() => {
    if (selectedConversation) {
      console.log('🎯 Conversa selecionada mudou para:', selectedConversation)
      fetchConversationMessages(selectedConversation)
    } else {
      console.log('❌ Nenhuma conversa selecionada')
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      console.log('🔍 Buscando conversas do WhatsApp...')
      console.log('🔧 Estado atual:', { filter })
      let url: string
      
      if (filter === 'football') {
        url = API_ENDPOINTS.whatsapp.conversationsFootball()
      } else {
        url = API_ENDPOINTS.whatsapp.conversations()
        
        // Construir parâmetros de query
        const params = new URLSearchParams()
        if (filter !== 'all') {
          params.append('status', filter)
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`
        }
      }

      console.log('🌐 URL final:', url)
      const response = await fetch(url)
      console.log('📡 Status da resposta:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📱 Conversas REAIS carregadas:', data)
        console.log('📊 Quantidade de conversas:', data.length)
        
        // Atualizar conversas sem preservar cache de conversas deletadas
        setConversations(prev => {
          // Apenas preservar mensagens de conversas que ainda existem na API
          return data.map((newConv: WhatsAppConversation) => {
            const existingConv = prev.find(c => c.id === newConv.id)
            
            // Se a conversa já existe e tem mensagens carregadas, preservar apenas as mensagens
            if (existingConv && existingConv.messages && existingConv.messages.length > 0) {
              return {
                ...newConv, // Usar dados atualizados da API
                messages: existingConv.messages // Manter apenas as mensagens carregadas
              }
            }
            
            // Para conversas novas ou sem mensagens, usar dados da API
            return {
              ...newConv,
              messages: newConv.messages || []
            }
          })
        })
      } else {
        console.error('❌ ERRO na API Evolution:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('❌ Detalhes do erro:', errorText)
        setConversations([]) // Array vazio em caso de erro
      }
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao carregar conversas:', error)
      setConversations([]) // Array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.whatsapp.stats())
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }



  const fetchConversationMessages = async (conversationId: string) => {
    try {
      console.log(`🔍 Buscando mensagens para conversa: ${conversationId}`)
      
      // Usar encodeURIComponent para lidar com caracteres especiais como @
      const response = await fetch(API_ENDPOINTS.whatsapp.conversationMessages(conversationId))
      
      console.log(`📡 Status da resposta de mensagens: ${response.status}`)
      
      if (response.ok) {
        const messages = await response.json()
        console.log(`📨 ${messages.length} mensagens carregadas para ${conversationId}:`, messages)
        
        // Usar apenas mensagens reais da Evolution API
        let finalMessages = messages
        if (messages.length === 0) {
          console.log('📝 Nenhuma mensagem real encontrada para:', conversationId)
          finalMessages = [] // Array vazio - sem mensagens de demonstração
        }
        
        // Atualizar a conversa selecionada com as mensagens REAIS da API
        console.log('🔄 Atualizando conversa com mensagens REAIS:', { conversationId, finalMessages })
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === conversationId) {
              const existingMessages = conv.messages || []
              
              // Preservar mensagens enviadas recentemente (últimos 30 segundos) que podem não estar na API ainda
              const now = new Date()
              const recentSentMessages = existingMessages.filter(msg => {
                if (msg.type === 'outgoing' && msg.id.startsWith('sent_')) {
                  const msgTime = new Date(parseInt(msg.id.replace('sent_', '')))
                  const diffInSeconds = (now.getTime() - msgTime.getTime()) / 1000
                  return diffInSeconds < 30 // Preservar mensagens dos últimos 30 segundos
                }
                return false
              })
              
              // Combinar mensagens da API com mensagens enviadas recentemente
              const allMessages = [...finalMessages, ...recentSentMessages]
              
              // Remover duplicatas por ID (mais rigoroso) e ordenar por timestamp
              const uniqueMessages = allMessages.filter((msg, index, arr) => {
                // Verificar duplicatas por ID ou por conteúdo + timestamp similar
                const isDuplicate = arr.findIndex(m => {
                  if (m.id === msg.id) return true
                  // Verificar se é a mesma mensagem (mesmo texto e timestamp próximo)
                  if (m.message === msg.message && m.type === msg.type) {
                    const timeDiff = Math.abs(
                      new Date(`1970-01-01 ${m.timestamp}`).getTime() - 
                      new Date(`1970-01-01 ${msg.timestamp}`).getTime()
                    )
                    return timeDiff < 60000 // Menos de 1 minuto de diferença
                  }
                  return false
                }) !== index
                return !isDuplicate
              }).sort((a, b) => {
                // Usar messageTimestamp quando disponível (mais preciso)
                if (a.messageTimestamp && b.messageTimestamp) {
                  return a.messageTimestamp - b.messageTimestamp
                }
                
                // Para mensagens enviadas localmente, usar timestamp do ID
                if (a.id.includes('sent_') && b.id.includes('sent_')) {
                  const timestampA = parseInt(a.id.replace('sent_', ''))
                  const timestampB = parseInt(b.id.replace('sent_', ''))
                  return timestampA - timestampB
                }
                
                // Fallback: ordenação por horário com ID como desempate
                const timeA = new Date(`1970-01-01 ${a.timestamp}`).getTime()
                const timeB = new Date(`1970-01-01 ${b.timestamp}`).getTime()
                
                if (timeA === timeB) {
                  // Se o horário é igual, usar ID para desempate
                  return a.id.localeCompare(b.id)
                }
                return timeA - timeB
              })
              
              console.log('🔄 Mensagens combinadas:', {
                apiMessages: finalMessages.length,
                recentSent: recentSentMessages.length,
                total: uniqueMessages.length
              })
              
              return { 
                ...conv, 
                messages: uniqueMessages
              }
            }
            return conv
          })
          console.log('🔄 Estado atualizado das conversas:', updated)
          
          // Scroll inteligente: só rola se o usuário estiver no final da conversa
          if (finalMessages.length > 0) {
            // Verificar se o usuário está próximo do final (últimos 100px)
            const container = messagesContainerRef.current
            if (container) {
              const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
              
              // Só fazer auto-scroll se estiver próximo do final
              if (isNearBottom) {
                requestAnimationFrame(() => {
                  scrollToBottom()
                  setTimeout(() => scrollToBottom(), 100)
                })
              }
            }
          }
          
          return updated
        })
      } else {
        const errorText = await response.text()
        console.warn(`⚠️ Erro ao buscar mensagens para ${conversationId}: ${response.status} - ${errorText}`)
        
        // Não criar mensagens de exemplo - usar apenas mensagens reais
        console.log('📝 Nenhuma mensagem real encontrada para:', conversationId)
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: [] } // Array vazio
            : conv
        ))
      }
    } catch (error) {
      console.error('❌ Erro crítico ao carregar mensagens:', error)
      
      // Não mostrar mensagem de erro - usar apenas mensagens reais
      console.log('❌ Erro ao carregar mensagens para:', conversationId)
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: [] } // Array vazio
          : conv
      ))
    }
  }

  // Dados mock removidos - usando apenas conversas reais da Evolution API

  const filteredConversations = conversations.filter(conv => 
    conv.phone.includes(searchTerm) || 
    conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Debug: Log do estado das conversas
  console.log('🔍 Debug - Estado atual das conversas:', {
    totalConversations: conversations.length,
    filteredConversations: filteredConversations.length,
    searchTerm,
    filter,
    loading
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <ClockIcon className="h-4 w-4 text-gray-400" />
      case 'delivered': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />
      case 'read': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'failed': return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation)
  
  // Debug: Log da conversa selecionada
  useEffect(() => {
    if (selectedConv) {
      console.log('🎯 Conversa selecionada atual:', {
        id: selectedConv.id,
        userName: selectedConv.userName,
        messagesCount: selectedConv.messages?.length || 0,
        messages: selectedConv.messages
      })
    }
  }, [selectedConv])

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      console.log('📤 Enviando mensagem:', { to: selectedConversation, message: newMessage })
      
      const response = await fetch(API_ENDPOINTS.whatsapp.sendMessage(selectedConversation), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Mensagem enviada com sucesso:', result)
        
        // Limpar o campo de mensagem
        setNewMessage('')
        
        // Adicionar a mensagem enviada imediatamente à interface
        const newOutgoingMessage: WhatsAppMessage = {
          id: `sent_${Date.now()}`,
          phone: selectedConversation.replace('@s.whatsapp.net', ''),
          userName: 'Você',
          message: newMessage,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          type: 'outgoing',
          status: 'sent',
          isBot: false
        }
        
        // Atualizar a conversa com a nova mensagem
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                messages: [...(conv.messages || []), newOutgoingMessage],
                lastMessage: newMessage,
                lastMessageTime: 'Agora'
              }
            : conv
        ))
        
        // Rolar para baixo imediatamente após enviar
        setTimeout(scrollToBottom, 100)
        
        // NÃO buscar mensagens imediatamente para não sobrescrever a mensagem enviada
        // A mensagem aparecerá na próxima atualização automática (polling)
        console.log('📤 Mensagem adicionada à interface, aguardando próxima sincronização automática')
      } else {
        const errorText = await response.text()
        console.error('❌ Erro ao enviar mensagem:', response.status, errorText)
        alert('Erro ao enviar mensagem. Verifique o console para mais detalhes.')
      }
    } catch (error) {
      console.error('❌ Erro crítico ao enviar mensagem:', error)
      alert('Erro de conexão ao enviar mensagem.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Conversas WhatsApp</h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {conversations.filter(c => c.status === 'active').length} ativas
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                setLoading(true)
                setConversations([]) // Limpar cache
                setSelectedConversation(null) // Limpar seleção
                
                try {
                  // Usar endpoint de refresh para forçar atualização
                  const response = await fetch(API_ENDPOINTS.whatsapp.refreshConversations(), {
                    method: 'POST'
                  })
                  
                  if (response.ok) {
                    const data = await response.json()
                    console.log('🔄 Conversas atualizadas via refresh:', data)
                    setConversations(data)
                  } else {
                    console.error('❌ Erro no refresh:', response.status)
                    fetchConversations() // Fallback
                  }
                } catch (error) {
                  console.error('❌ Erro crítico no refresh:', error)
                  fetchConversations() // Fallback
                } finally {
                  setLoading(false)
                }
              }}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              title="Atualizar conversas"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              Stats
            </button>
            <button
              onClick={async () => {
                if (confirm('Tem certeza que deseja limpar o cache da Evolution API? Isso pode levar alguns segundos.')) {
                  try {
                    console.log('🧹 Iniciando limpeza do cache...');
                    const response = await fetch(API_ENDPOINTS.whatsapp.clearCache(), {
                      method: 'POST'
                    });
                    
                    const result = await response.json();
                    console.log('📡 Resultado da limpeza:', result);
                    
                    if (result.success) {
                      alert(`✅ Cache da Evolution API limpo com sucesso!\n\nMétodo usado: ${result.method || 'automático'}`);
                      // Recarregar conversas após limpeza
                      setLoading(true);
                      setConversations([]);
                      setSelectedConversation(null);
                      setTimeout(() => {
                        fetchConversations();
                      }, 3000); // Aguardar 3 segundos para reconexão
                    } else {
                      // Mostrar instruções detalhadas se a limpeza automática falhou
                      let message = `❌ Limpeza automática falhou: ${result.message}\n\n`;
                      
                      if (result.instructions && Array.isArray(result.instructions)) {
                        message += '📋 INSTRUÇÕES MANUAIS:\n';
                        result.instructions.forEach((instruction: string, index: number) => {
                          message += `${instruction}\n`;
                        });
                        message += '\n💡 Após seguir as instruções, clique em "Atualizar" nesta página.';
                      }
                      
                      if (result.details && Array.isArray(result.details)) {
                        message += '\n\n🔍 DETALHES TÉCNICOS:\n';
                        result.details.forEach((detail: any) => {
                          message += `• ${detail.method}: Status ${detail.status}\n`;
                        });
                      }
                      
                      alert(message);
                    }
                  } catch (error) {
                    console.error('❌ Erro ao limpar cache:', error);
                    alert('❌ Erro de conexão ao limpar cache. Verifique se o backend está funcionando.');
                  }
                }
              }}
              className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50"
              title="Limpar cache da Evolution API"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Cache
            </button>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Filtros:</span>
          {(['all', 'football', 'active', 'waiting', 'closed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === filterOption
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption === 'all' ? 'Todas' : 
               filterOption === 'football' ? '⚽ Futebol' :
               filterOption === 'active' ? 'Ativas' :
               filterOption === 'waiting' ? 'Aguardando' : 'Fechadas'}
            </button>
          ))}
        </div>

        {/* Estatísticas */}
        {showStats && stats && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">📊 Estatísticas das Conversas</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-xs text-gray-500">Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
                <div className="text-xs text-gray-500">Aguardando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.footballRelated}</div>
                <div className="text-xs text-gray-500">⚽ Futebol</div>
              </div>
            </div>
            
            {stats.topTeams.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">🏆 Times Mais Mencionados:</h5>
                <div className="flex flex-wrap gap-2">
                  {stats.topTeams.map((team, index) => (
                    <span
                      key={team.team}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {team.team} ({team.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 h-[500px]">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1 border-r border-gray-200 overflow-y-auto conversations-scrollbar smooth-scroll">
          <div className="divide-y divide-gray-200">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
                <p className="text-xs text-gray-500">
                  {conversations.length === 0 
                    ? 'Não há conversas disponíveis no momento.' 
                    : 'Tente ajustar os filtros de busca.'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Total de conversas: {conversations.length}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  console.log('🖱️ Clicou na conversa:', conversation.id)
                  setSelectedConversation(conversation.id)
                  
                  // Aguardar um pouco e depois rolar para baixo (onde estão as mensagens mais recentes)
                  setTimeout(() => {
                    console.log('📜 Forçando scroll após seleção de conversa')
                    scrollToBottom()
                  }, 300)
                }}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation === conversation.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.userName || conversation.phone}
                      </p>
                      <div className="flex items-center space-x-1">
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{conversation.phone}</p>
                      <p className="text-xs text-gray-400">{conversation.lastMessageTime}</p>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="lg:col-span-2 flex flex-col relative">
          {selectedConv ? (
            <>
              {/* Header da Conversa */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedConv.userName || selectedConv.phone}
                      </p>
                      <p className="text-xs text-gray-500">{selectedConv.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div 
                ref={messagesContainerRef}
                className={`flex-1 overflow-y-auto p-4 space-y-3 min-h-0 messages-scrollbar smooth-scroll scroll-indicator ${isScrolling ? 'scrolling' : ''}`}
                style={{ minHeight: '300px', maxHeight: '350px' }}
              >
                {(() => {
                  console.log('🎨 Renderizando mensagens:', {
                    hasMessages: !!selectedConv.messages,
                    messagesLength: selectedConv.messages?.length || 0,
                    messages: selectedConv.messages
                  })
                  return selectedConv.messages && selectedConv.messages.length > 0
                })() ? (
                  selectedConv.messages.map((message, index) => {
                    console.log(`🎨 Renderizando mensagem ${index}:`, message)
                    return (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'outgoing'
                          ? message.isBot
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message || 'Mensagem sem texto'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-75">{message.timestamp}</p>
                        {message.type === 'outgoing' && (
                          <div className="ml-2">
                            {getStatusIcon(message.status)}
                          </div>
                        )}
                      </div>
                      {message.isBot && (
                        <p className="text-xs opacity-75 mt-1">🤖 Bot</p>
                      )}
                    </div>
                  </div>
                    )
                  })
                ) : (
                  (() => {
                    console.log('🎨 Mostrando placeholder - Nenhuma mensagem')
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-sm font-medium text-gray-900 mb-2">Nenhuma mensagem</h3>
                          <p className="text-xs text-gray-500">
                            As mensagens desta conversa aparecerão aqui.
                          </p>
                        </div>
                      </div>
                    )
                  })()
                )}
                {/* Elemento para scroll automático */}
                <div ref={messagesEndRef} />
              </div>

              {/* Botão para rolar para baixo */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-16 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-10 flex items-center space-x-2"
                  title="Rolar para baixo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Input de Resposta */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Digite uma resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button 
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Selecione uma conversa</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escolha uma conversa da lista para visualizar as mensagens
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 