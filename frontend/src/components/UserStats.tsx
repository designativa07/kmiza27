'use client'

import { useState, useEffect } from 'react'
import { UserIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'

interface UserStats {
  total: number
  active: number
  withFavoriteTeam: number
}

export default function UserStats() {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    withFavoriteTeam: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aguardar um pouco para garantir que o backend esteja pronto
    const timer = setTimeout(() => {
      fetchStats()
    }, 2000) // 2 segundos de delay
    
    return () => clearTimeout(timer)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users.stats(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('❌ UserStats: Erro ao carregar estatísticas:', error)
      // Definir dados padrão em caso de erro
      setStats({
        total: 0,
        active: 0,
        withFavoriteTeam: 0
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 animate-pulse">
            <div className="absolute rounded-md bg-indigo-200 p-3">
              <div className="h-6 w-6 bg-indigo-300 rounded"></div>
            </div>
            <div className="ml-16">
              <div className="h-4 bg-indigo-200 rounded mb-2"></div>
              <div className="h-6 bg-indigo-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total de Usuários',
      value: stats.total,
      icon: UserGroupIcon,
    },
    {
      name: 'Usuários Ativos',
      value: stats.active,
      icon: UserIcon,
    },
    {
      name: 'Com Time Favorito',
      value: stats.withFavoriteTeam,
      icon: HeartIcon,
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
        >
          <dt>
            <div className="absolute rounded-md bg-indigo-500 p-3">
              <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-900 dark:text-white">{stat.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
            <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                  Ver detalhes
                </span>
              </div>
            </div>
          </dd>
        </div>
      ))}
    </div>
  )
} 