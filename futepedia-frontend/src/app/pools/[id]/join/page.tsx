'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function JoinPoolPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_joined'>('loading')
  const [message, setMessage] = useState('')
  const [poolName, setPoolName] = useState('')

  const poolId = params.id as string

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    
    if (!token) {
      router.push(`/login?redirect=/pools/${poolId}/join`)
      return
    }
    
    joinPool()
  }, [poolId])

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
      
      // Obter token uma vez
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      
      // Verificar se já participa
      if (token) {
        // Decodificar o token para obter o user ID
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const userId = payload.sub
          
          console.log('Verificando participação - User ID:', userId)
          console.log('Participantes do bolão:', poolData.participants)
          
          // Verificar se já participa (mais robusto)
          const isAlreadyParticipating = poolData.participants?.some((p: any) => {
            const participantUserId = p.user_id || p.user?.id || p.user_id
            console.log('Participante:', p, 'User ID:', participantUserId)
            return participantUserId === userId || participantUserId === parseInt(userId)
          })
          
          if (isAlreadyParticipating) {
            setStatus('already_joined')
            setMessage('Você já participa deste bolão!')
            return
          }
        } catch (error) {
          console.error('Erro ao decodificar token:', error)
        }
      }

      // Tentar participar
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
        console.log('Erro do backend:', error)
        
        // Se o erro for que já participa, mostrar como sucesso
        if (error.message?.includes('já participa') || error.error?.includes('já participa')) {
          setStatus('already_joined')
          setMessage('Você já participa deste bolão!')
        } else {
          setStatus('error')
          setMessage(error.message || error.error || 'Erro ao entrar no bolão')
        }
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