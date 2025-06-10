'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página principal com usuários
    router.push('/?page=usuarios');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecionando para usuários...</p>
      </div>
    </div>
  );
} 