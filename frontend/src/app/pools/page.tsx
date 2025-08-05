'use client';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PoolsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para a página principal com o parâmetro page=Bolões
    // Isso garante que o Dashboard seja carregado com a seção correta
    router.replace('/?page=boloes')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando página de bolões...</p>
      </div>
    </div>
  )
}