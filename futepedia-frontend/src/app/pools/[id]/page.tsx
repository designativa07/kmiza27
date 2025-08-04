'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  TrophyIcon, 
  UsersIcon, 
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  ChartBarIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface User {
  id: number;
  name: string;
}

interface Match {
  id: number;
  home_team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  away_team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  match_date: string;
  status: string;
  home_score?: number;
  away_score?: number;
}

interface PoolMatch {
  id: number;
  match: Match;
  order_index: number;
}

interface PoolParticipant {
  id: number;
  user: User;
  total_points: number;
  ranking_position: number;
  predictions_count: number;
  exact_predictions: number;
  correct_results: number;
}

interface Pool {
  id: number;
  title: string;
  description?: string;
  type: 'round' | 'custom';
  status: 'draft' | 'open' | 'closed' | 'finished';
  creator: User;
  prediction_deadline?: string;
  scoring_rules: {
    exact_score?: number;
    correct_result?: number;
    goal_difference?: number;
  };
  settings: {
    public?: boolean;
    max_participants?: number;
  };
  pool_matches: PoolMatch[];
  participants: PoolParticipant[];
  created_at: string;
}

const statusLabels = {
  draft: 'Rascunho',
  open: 'Aberto',
  closed: 'Fechado',
  finished: 'Finalizado'
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  finished: 'bg-blue-100 text-blue-800'
};

export default function PoolDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [pool, setPool] = useState<Pool | null>(null)
  const [loading, setLoading] = useState(true)
  const [isParticipant, setIsParticipant] = useState(false)

  const poolId = params.id as string

  useEffect(() => {
    if (poolId) {
      fetchPool()
    }
  }, [poolId])

  useEffect(() => {
    if (pool && user) {
              setIsParticipant(pool.participants?.some(p => p.user.id === user.id) || false)
    }
  }, [pool, user])

  const fetchPool = async () => {
    try {
      const response = await fetch(`/api/pools/${poolId}/public`)
      if (response.ok) {
        const data = await response.json()
        setPool(data)
      } else if (response.status === 404) {
        router.push('/pools')
      }
    } catch (error) {
      console.error('Erro ao buscar bolão:', error)
      router.push('/pools')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinPool = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pools/${poolId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchPool() // Refresh pool data
        alert('Você entrou no bolão com sucesso!')
      } else {
        const error = await response.json()
        alert('Erro ao entrar no bolão: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao entrar no bolão:', error)
      alert('Erro ao entrar no bolão')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando bolão...</p>
        </div>
      </div>
    )
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon className="mx-auto h-24 w-24 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Bolão não encontrado</h3>
          <p className="mt-2 text-gray-500">O bolão que você está procurando não existe ou não está público.</p>
          <Link
            href="/pools"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ver Todos os Bolões
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link href="/pools" className="text-gray-400 hover:text-gray-500">
                    Bolões
                  </Link>
                </li>
                <li className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500 truncate">{pool.title}</span>
                </li>
              </ol>
            </nav>
            
            <div className="mt-4 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pool.title}</h1>
                {pool.description && (
                  <p className="mt-2 text-gray-600">{pool.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Criado por {pool.creator.name} em {new Date(pool.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[pool.status]}`}>
                {statusLabels[pool.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2">
            {/* Informações do Bolão */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pool.participants?.length || 0}</p>
                  <p className="text-sm text-gray-500">Participantes</p>
                  {pool.settings?.max_participants && (
                    <p className="text-xs text-gray-400">
                      Máximo: {pool.settings.max_participants}
                    </p>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                    <CalendarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pool.pool_matches?.length || 0}</p>
                  <p className="text-sm text-gray-500">Jogos</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <StarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pool.scoring_rules.exact_score}</p>
                  <p className="text-sm text-gray-500">Placar Exato</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{pool.scoring_rules.correct_result}</p>
                  <p className="text-sm text-gray-500">Resultado</p>
                </div>
              </div>

              {/* Regras de Pontuação */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Regras de Pontuação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Placar Exato:</span>
                    <span className="font-medium">{pool.scoring_rules.exact_score} pontos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resultado Correto:</span>
                    <span className="font-medium">{pool.scoring_rules.correct_result} pontos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diferença de Gols:</span>
                    <span className="font-medium">{pool.scoring_rules.goal_difference} pontos</span>
                  </div>
                </div>
              </div>

              {/* Prazo para Palpites */}
              {pool.prediction_deadline && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center text-amber-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      Palpites até: {new Date(pool.prediction_deadline).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Jogos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Jogos do Bolão ({pool.pool_matches?.length || 0})
              </h2>
              
              <div className="space-y-4">
                {pool.pool_matches
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((poolMatch) => (
                    <div key={poolMatch.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-center min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {poolMatch.match.home_team.name}
                            </p>
                          </div>
                          
                          <div className="text-center px-4">
                            {poolMatch.match.status === 'finished' ? (
                              <div className="text-lg font-bold text-gray-900">
                                {poolMatch.match.home_score} - {poolMatch.match.away_score}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                vs
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {poolMatch.match.away_team.name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(poolMatch.match.match_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(poolMatch.match.match_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Ações */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
              
              {!isAuthenticated ? (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Faça login para participar deste bolão
                  </p>
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Fazer Login
                  </Link>
                </div>
              ) : isParticipant ? (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800 font-medium">
                      Você já participa deste bolão!
                    </p>
                  </div>
                  
                  {pool.status === 'open' && (
                    <Link
                      href={`/pools/${pool.id}/predictions`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Fazer Palpites
                    </Link>
                  )}
                  
                  <Link
                    href={`/pools/${pool.id}/my-predictions`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ver Meus Palpites
                  </Link>
                </div>
              ) : pool.status === 'open' ? (
                <button
                  onClick={handleJoinPool}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Participar do Bolão
                </button>
              ) : (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Este bolão não está mais aberto para novas participações
                  </p>
                </div>
              )}
            </div>

            {/* Ranking */}
                          {(pool.participants?.length || 0) > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Ranking</h2>
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  {pool.participants
                    .sort((a, b) => (b.total_points - a.total_points) || (b.exact_predictions - a.exact_predictions))
                    .slice(0, 10) // Mostrar apenas top 10
                    .map((participant, index) => (
                      <div key={participant.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {participant.exact_predictions} exatos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {participant.total_points}
                          </p>
                          <p className="text-xs text-gray-500">pontos</p>
                        </div>
                      </div>
                    ))}
                </div>
                
                {(pool.participants?.length || 0) > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      E mais {(pool.participants?.length || 0) - 10} participantes...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}