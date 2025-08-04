'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function JoinPoolPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_joined'>('loading')
  const [message, setMessage] = useState('')
  const [poolName, setPoolName] = useState('')

  const poolId = params.id as string

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/pools/${poolId}/join`)
      return
    }
    
    joinPool()
  }, [poolId, isAuthenticated])

  const joinPool = async () => {
    try {
      setStatus('loading')
      
      // Primeiro, verificar se já participa
      const poolResponse = await fetch(`/api/pools/${poolId}/public`)
      if (!poolResponse.ok) {
        setStatus('error')
        setMessage('Bolão não encontrado')
        return
      }
      
      const poolData = await poolResponse.json()
      setPoolName(poolData.name)
      
      // Verificar se já participa
      if (poolData.participants?.some((p: any) => p.user.id === user?.id)) {
        setStatus('already_joined')
        setMessage('Você já participa deste bolão!')
        return
      }

      // Tentar participar
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/pools/${poolId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Você entrou no bolão com sucesso!')
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push(`/pools/${poolId}`)
        }, 2000)
      } else {
        const error = await response.json()
        setStatus('error')
        setMessage(error.message || 'Erro ao entrar no bolão')
      }
    } catch (error) {
      console.error('Erro ao entrar no bolão:', error)
      setStatus('error')
      setMessage('Erro de conexão. Tente novamente.')
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <ArrowPathIcon className="h-16 w-16 text-blue-600 animate-spin" />
      case 'success':
      case 'already_joined':
        return <CheckCircleIcon className="h-16 w-16 text-green-600" />
      case 'error':
        return <XCircleIcon className="h-16 w-16 text-red-600" />
    }
  }

  const getColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
      case 'already_joined':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Entrando no bolão...'
      case 'success':
        return 'Sucesso!'
      case 'already_joined':
        return 'Você já participa!'
      case 'error':
        return 'Erro'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {getIcon()}
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${getColor()}`}>
          {getTitle()}
        </h1>
        
        {poolName && (
          <h2 className="text-lg text-gray-700 mb-4">
            {poolName}
          </h2>
        )}
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          {status === 'success' && (
            <p className="text-sm text-gray-500">
              Redirecionando automaticamente...
            </p>
          )}
          
          <Link
            href={`/pools/${poolId}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Ver Bolão
          </Link>
          
          <Link
            href="/pools"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Ver Todos os Bolões
          </Link>
          
          {status === 'error' && (
            <button
              onClick={joinPool}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      </div>
    </div>
  )
}