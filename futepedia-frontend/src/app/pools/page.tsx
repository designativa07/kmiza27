'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { HeaderWithLogo } from '@/components/HeaderWithLogo'
import { 
  TrophyIcon, 
  UsersIcon, 
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon
} from '@heroicons/react/24/outline'

interface Pool {
  id: number;
  title: string;
  description?: string;
  type: 'round' | 'custom';
  status: 'draft' | 'open' | 'closed' | 'finished';
  participants: { id: number; user: { name: string } }[];
  pool_matches: { id: number; match: any }[];
  created_at: string;
  prediction_deadline?: string;
  settings: {
    public?: boolean;
    max_participants?: number;
  };
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

export default function PoolsPage() {
  const { isAuthenticated, requireAuth } = useAuth()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicPools()
  }, [])

  const fetchPublicPools = async () => {
    try {
      const response = await fetch('/api/pools/public?status=open')
      if (response.ok) {
        const data = await response.json()
        setPools(data)
      }
    } catch (error) {
      console.error('Erro ao buscar bolões:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando bolões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header padrão do Futepédia */}
      <HeaderWithLogo />
      
      {/* Conteúdo da página */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bolões</h1>
          <p className="mt-2 text-gray-600">
            Participe dos nossos bolões e teste seus conhecimentos de futebol!
          </p>
          
          {!isAuthenticated && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Faça login para participar dos bolões
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Fazer Login
              </Link>
            </div>
          )}
        </div>

        {/* Lista de Bolões */}
        {pools.length === 0 ? (
          <div className="text-center py-12">
            <TrophyIcon className="mx-auto h-24 w-24 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum bolão disponível</h3>
            <p className="mt-2 text-gray-500">
              Não há bolões abertos no momento. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {pool.title}
                      </h3>
                      {pool.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {pool.description}
                        </p>
                      )}
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[pool.status]}`}>
                      {statusLabels[pool.status]}
                    </span>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      <span>
                        {pool.participants?.length || 0}
                        {pool.settings?.max_participants && ` / ${pool.settings.max_participants}`}
                        {(pool.participants?.length || 0) === 1 ? ' participante' : ' participantes'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {pool.pool_matches?.length || 0} 
                        {(pool.pool_matches?.length || 0) === 1 ? ' jogo' : ' jogos'}
                      </span>
                    </div>
                  </div>

                  {/* Prazo para palpites */}
                  {pool.prediction_deadline && (
                    <div className="flex items-center text-sm text-amber-600 mb-4">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>
                        Palpites até: {new Date(pool.prediction_deadline).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/pools/${pool.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Link>
                    
                    {isAuthenticated && pool.status === 'open' && (
                      <Link
                        href={`/pools/${pool.id}/join`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Participar
                      </Link>
                    )}
                  </div>

                  {/* Informação adicional para não logados */}
                  {!isAuthenticated && (
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      <Link href="/login" className="text-blue-600 hover:text-blue-700">
                        Faça login
                      </Link>
                      {' '}para participar deste bolão
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}