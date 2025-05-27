'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não está carregando e não está autenticado, redirecionar para login
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Verificando acesso..." />;
  }

  // Se não está autenticado, não renderizar nada (está redirecionando)
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  // Se está autenticado ou está na página de login, renderizar children
  return <>{children}</>;
} 