'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

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

interface Pool {
  id: number;
  title: string;
  status: string;
  prediction_deadline?: string;
  pool_matches: PoolMatch[];
}

interface Prediction {
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned?: number;
}

export default function PredictionsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [pool, setPool] = useState<Pool | null>(null)
  const [predictions, setPredictions] = useState<{ [key: number]: Prediction }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({})
  const [canMakePredictions, setCanMakePredictions] = useState(true)

  const poolId = params.id as string

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchPool()
    fetchMyPredictions()
  }, [poolId])

  useEffect(() => {
    if (pool) {
      // Verificar se ainda pode fazer palpites
      const now = new Date()
      const deadline = pool.prediction_deadline ? new Date(pool.prediction_deadline) : null
      setCanMakePredictions(
        pool.status === 'open' && 
        (!deadline || now < deadline)
      )
    }
  }, [pool])

  const fetchPool = async () => {
    try {
      const response = await fetch(`/api/pools/${poolId}/public`)
      if (response.ok) {
        const data = await response.json()
        setPool(data)
      } else {
        router.push('/pools')
      }
    } catch (error) {
      console.error('Erro ao buscar bolão:', error)
      router.push('/pools')
    }
  }

  const fetchMyPredictions = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      const response = await fetch(`/api/pools/${poolId}/my-predictions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const predictionsMap: { [key: number]: Prediction } = {}
        data.forEach((pred: any) => {
          predictionsMap[pred.match_id] = {
            match_id: pred.match_id,
            predicted_home_score: pred.predicted_home_score,
            predicted_away_score: pred.predicted_away_score,
            points_earned: pred.points_earned,
          }
        })
        setPredictions(predictionsMap)
      }
    } catch (error) {
      console.error('Erro ao buscar palpites:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionChange = (matchId: number, team: 'home' | 'away', value: string) => {
    const numValue = parseInt(value) || 0
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        match_id: matchId,
        [`predicted_${team}_score`]: numValue,
      } as Prediction
    }))
  }

  const savePrediction = async (matchId: number) => {
    const prediction = predictions[matchId]
    if (!prediction) return

    setSaving(prev => ({ ...prev, [matchId]: true }))

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      const response = await fetch(`/api/pools/${poolId}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          match_id: matchId,
          predicted_home_score: prediction.predicted_home_score,
          predicted_away_score: prediction.predicted_away_score,
        }),
      })

      if (response.ok) {
        // Sucesso - o palpite foi salvo
        console.log('Palpite salvo com sucesso')
      } else {
        const error = await response.json()
        alert('Erro ao salvar palpite: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao salvar palpite:', error)
      alert('Erro ao salvar palpite')
    } finally {
      setSaving(prev => ({ ...prev, [matchId]: false }))
    }
  }

  const getMatchTimeStatus = (match: Match) => {
    const now = new Date()
    const matchDate = new Date(match.match_date)
    
    if (match.status === 'finished') {
      return { text: 'Finalizado', color: 'text-green-600', canPredict: false }
    } else if (now >= matchDate) {
      return { text: 'Em andamento', color: 'text-yellow-600', canPredict: false }
    } else {
      const hoursUntil = Math.ceil((matchDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      return { 
        text: `${hoursUntil}h restantes`, 
        color: 'text-blue-600', 
        canPredict: true 
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando palpites...</p>
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
                  <Link href={`/pools/${poolId}`} className="ml-4 text-gray-400 hover:text-gray-500">
                    {pool.title}
                  </Link>
                </li>
                <li className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-500">Palpites</span>
                </li>
              </ol>
            </nav>
            
            <div className="mt-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fazer Palpites</h1>
                <p className="mt-2 text-gray-600">
                  Escolha os placares para todos os jogos do bolão
                </p>
              </div>
              
              <Link
                href={`/pools/${poolId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar ao Bolão
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Aviso sobre prazo */}
        {!canMakePredictions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Prazo para palpites expirado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    O prazo para fazer palpites neste bolão já expirou ou o bolão foi fechado.
                    Você pode visualizar seus palpites, mas não pode mais alterá-los.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informação sobre deadline */}
        {pool.prediction_deadline && canMakePredictions && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ClockIcon className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Prazo para palpites
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Você pode fazer palpites até: {new Date(pool.prediction_deadline).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Jogos para Palpites */}
        <div className="space-y-6">
          {pool.pool_matches
            .sort((a, b) => a.order_index - b.order_index)
            .map((poolMatch) => {
              const match = poolMatch.match
              const prediction = predictions[match.id]
              const timeStatus = getMatchTimeStatus(match)
              const canPredictThisMatch = canMakePredictions && timeStatus.canPredict
              const hasExistingPrediction = prediction && prediction.predicted_home_score !== undefined

              return (
                <div key={poolMatch.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {match.home_team.name} vs {match.away_team.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(match.match_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-sm font-medium ${timeStatus.color}`}>
                        {timeStatus.text}
                      </span>
                      {hasExistingPrediction && (
                        <div className="flex items-center mt-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">Palpite feito</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resultado real (se jogo finalizado) */}
                  {match.status === 'finished' && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Resultado Final</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {match.home_score} - {match.away_score}
                        </p>
                        {prediction?.points_earned !== undefined && (
                          <p className="text-sm text-blue-600 mt-2">
                            Você ganhou {prediction.points_earned} pontos
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formulário de Palpite */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="text-center">
                      <p className="font-medium text-gray-900 mb-2">
                        {match.home_team.name}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="w-20 text-center border border-gray-300 rounded-md py-2 text-lg font-semibold disabled:bg-gray-100 disabled:text-gray-500"
                        value={prediction?.predicted_home_score ?? ''}
                        onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                        disabled={!canPredictThisMatch}
                        placeholder="0"
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-gray-400 text-lg font-bold">X</p>
                    </div>

                    <div className="text-center">
                      <p className="font-medium text-gray-900 mb-2">
                        {match.away_team.name}
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        className="w-20 text-center border border-gray-300 rounded-md py-2 text-lg font-semibold disabled:bg-gray-100 disabled:text-gray-500"
                        value={prediction?.predicted_away_score ?? ''}
                        onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                        disabled={!canPredictThisMatch}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Botão de Salvar */}
                  {canPredictThisMatch && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => savePrediction(match.id)}
                        disabled={
                          saving[match.id] || 
                          !prediction ||
                          prediction.predicted_home_score === undefined ||
                          prediction.predicted_away_score === undefined
                        }
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving[match.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Salvar Palpite
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        {/* Resumo */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo dos Palpites</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(predictions).length}
              </p>
              <p className="text-sm text-gray-600">Palpites feitos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {pool.pool_matches?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Total de jogos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {Object.values(predictions).reduce((sum, pred) => sum + (pred.points_earned || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Pontos ganhos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}