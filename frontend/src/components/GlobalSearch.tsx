'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { 
  TrophyIcon, 
  CalendarIcon, 
  UsersIcon, 
  BellIcon,
  CogIcon 
} from '@heroicons/react/24/solid'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'team' | 'match' | 'user' | 'notification' | 'setting'
  icon: any
  action: () => void
}

interface GlobalSearchProps {
  onNavigate: (page: string) => void
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Dados simulados para busca
  const searchData: SearchResult[] = [
    {
      id: 'team-flamengo',
      title: 'Flamengo',
      subtitle: 'Time - Rio de Janeiro',
      type: 'team',
      icon: TrophyIcon,
      action: () => onNavigate('Times')
    },
    {
      id: 'team-palmeiras',
      title: 'Palmeiras',
      subtitle: 'Time - São Paulo',
      type: 'team',
      icon: TrophyIcon,
      action: () => onNavigate('Times')
    },
    {
      id: 'match-flamengo-palmeiras',
      title: 'Flamengo x Palmeiras',
      subtitle: 'Jogo - 26/05/2025 16:00',
      type: 'match',
      icon: CalendarIcon,
      action: () => onNavigate('Jogos')
    },
    {
      id: 'user-joao',
      title: 'João Silva',
      subtitle: 'Usuário - +55 (11) 99999-9999',
      type: 'user',
      icon: UsersIcon,
      action: () => onNavigate('Usuários')
    },
    {
      id: 'notification-reminder',
      title: 'Lembrete de Jogo',
      subtitle: 'Notificação - Agendada',
      type: 'notification',
      icon: BellIcon,
      action: () => onNavigate('Notificações')
    },
    {
      id: 'setting-chatbot',
      title: 'Configurações do Chatbot',
      subtitle: 'Configuração - Status do Sistema',
      type: 'setting',
      icon: CogIcon,
      action: () => onNavigate('Chatbot')
    }
  ]

  // Atalho de teclado Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  // Filtrar resultados baseado na query
  useEffect(() => {
    if (query.trim() === '') {
      setResults(searchData.slice(0, 6)) // Mostrar alguns resultados por padrão
    } else {
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
    }
    setSelectedIndex(0)
  }, [query])

  // Navegação com teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        results[selectedIndex].action()
        setIsOpen(false)
        setQuery('')
      }
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      team: 'bg-blue-100 text-blue-800',
      match: 'bg-green-100 text-green-800',
      user: 'bg-purple-100 text-purple-800',
      notification: 'bg-yellow-100 text-yellow-800',
      setting: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || colors.setting
  }

  const getTypeName = (type: string) => {
    const names = {
      team: 'Time',
      match: 'Jogo',
      user: 'Usuário',
      notification: 'Notificação',
      setting: 'Configuração'
    }
    return names[type as keyof typeof names] || 'Item'
  }

  return (
    <>
      {/* Botão de busca */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center w-full max-w-sm px-3 py-1.5 text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
        <span>Buscar...</span>
        <span className="ml-auto text-xs text-gray-400">Ctrl+K</span>
      </button>

      {/* Modal de busca */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-start justify-center px-4 pt-16">
            <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={() => setIsOpen(false)} />
            
            <div className="relative w-full max-w-lg transform rounded-lg bg-white dark:bg-slate-800 shadow-xl transition-all">
              {/* Input de busca */}
              <div className="flex items-center border-b border-gray-200 dark:border-slate-600 px-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar times, jogos, usuários..."
                  className="w-full border-0 py-4 pl-3 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-transparent focus:outline-none focus:ring-0"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Resultados */}
              <div className="max-h-96 overflow-y-auto py-2">
                {results.length > 0 ? (
                  results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        result.action()
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 ${
                        index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 p-2 rounded-md ${getTypeColor(result.type)}`}>
                        <result.icon className="h-4 w-4" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                        {getTypeName(result.type)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">
                      Tente buscar por times, jogos, usuários ou configurações.
                    </p>
                  </div>
                )}
              </div>

              {/* Dicas de navegação */}
              {results.length > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-600 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Use ↑↓ para navegar</span>
                    <span>Enter para selecionar</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 