'use client'

import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { 
  TrophyIcon, 
  CalendarIcon, 
  UsersIcon, 
  BellIcon,
  CogIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/solid'
import { apiUrl } from '../config/api'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'team' | 'player' | 'stadium' | 'competition' | 'channel'
  icon: any
  action: () => void
}

interface GlobalSearchProps {
  onNavigate: (page: string) => void
}

interface SearchResponse {
  teams: Array<{id: number, name: string, short_name?: string, city?: string, state?: string}>
  players: Array<{id: number, name: string, position?: string, nationality?: string}>
  stadiums: Array<{id: number, name: string, city?: string, state?: string, country?: string}>
  competitions: Array<{id: number, name: string, slug?: string}>
  channels: Array<{id: number, name: string, description?: string, type?: string}>
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Função para buscar dados do backend
  const fetchSearchResults = async (searchTerm: string): Promise<SearchResult[]> => {
    if (!searchTerm || searchTerm.length < 2) return []
    
    try {
      setLoading(true)
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchTerm)}`)
      if (!response.ok) throw new Error('Erro na busca')
      
      const data: SearchResponse = await response.json()
      const searchResults: SearchResult[] = []

      // Converter times
      data.teams.forEach(team => {
        searchResults.push({
          id: `team-${team.id}`,
          title: team.name,
          subtitle: `Time - ${team.city || team.state || 'Brasil'}`,
          type: 'team',
          icon: TrophyIcon,
          action: () => onNavigate('Times')
        })
      })

      // Converter jogadores
      data.players.forEach(player => {
        searchResults.push({
          id: `player-${player.id}`,
          title: player.name,
          subtitle: `Jogador - ${player.position || 'Posição não informada'}`,
          type: 'player',
          icon: UsersIcon,
          action: () => onNavigate('Jogadores')
        })
      })

      // Converter estádios
      data.stadiums.forEach(stadium => {
        searchResults.push({
          id: `stadium-${stadium.id}`,
          title: stadium.name,
          subtitle: `Estádio - ${stadium.city || stadium.state || stadium.country || 'Local não informado'}`,
          type: 'stadium',
          icon: BuildingOfficeIcon,
          action: () => onNavigate('Estádios')
        })
      })

      // Converter competições
      data.competitions.forEach(competition => {
        searchResults.push({
          id: `competition-${competition.id}`,
          title: competition.name,
          subtitle: 'Competição',
          type: 'competition',
          icon: TrophyIcon,
          action: () => onNavigate('Competições')
        })
      })

      // Converter canais
      data.channels.forEach(channel => {
        searchResults.push({
          id: `channel-${channel.id}`,
          title: channel.name,
          subtitle: `Canal - ${channel.description || channel.type || 'WhatsApp'}`,
          type: 'channel',
          icon: BellIcon,
          action: () => onNavigate('Canais')
        })
      })

      return searchResults
    } catch (error) {
      console.error('Erro ao buscar:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

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

  // Buscar resultados baseado na query
  useEffect(() => {
    const performSearch = async () => {
      if (query.trim() === '') {
        setResults([])
      } else {
        const searchResults = await fetchSearchResults(query.trim())
        setResults(searchResults)
      }
      setSelectedIndex(0)
    }
    
    const timeoutId = setTimeout(performSearch, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
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
      player: 'bg-green-100 text-green-800',
      stadium: 'bg-orange-100 text-orange-800',
      competition: 'bg-purple-100 text-purple-800',
      channel: 'bg-yellow-100 text-yellow-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeName = (type: string) => {
    const names = {
      team: 'Time',
      player: 'Jogador',
      stadium: 'Estádio',
      competition: 'Competição',
      channel: 'Canal'
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
                  placeholder="Buscar times, jogadores, estádios, competições, canais..."
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
                {loading ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Buscando...</p>
                  </div>
                ) : results.length > 0 ? (
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
                      Tente buscar por times, jogadores, estádios, competições ou canais.
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