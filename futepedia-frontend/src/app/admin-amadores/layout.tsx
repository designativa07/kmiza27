'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import AmateurNavigation from '@/components/AmateurNavigation';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  competitions: number;
  teams: number;
  players: number;
  matches: number;
}

export default function AmateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    competitions: 0,
    teams: 0,
    players: 0,
    matches: 0
  });
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está logado
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUser(user);
      
      // Carregar estatísticas
      loadDashboardStats();
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar competições
      const competitionsResponse = await fetch('/api/amateur/competitions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const competitions = competitionsResponse.ok ? await competitionsResponse.json() : [];

      // Buscar times
      const teamsResponse = await fetch('/api/amateur/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const teams = teamsResponse.ok ? await teamsResponse.json() : [];

      // Buscar jogadores
      const playersResponse = await fetch('/api/amateur/players', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const players = playersResponse.ok ? await playersResponse.json() : [];

      // Buscar jogos
      const matchesResponse = await fetch('/api/amateur/matches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const matches = matchesResponse.ok ? await matchesResponse.json() : [];

      setStats({
        competitions: competitions.length,
        teams: teams.length,
        players: players.length,
        matches: matches.length
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWithLogo />
      <AmateurNavigation user={user} stats={stats} />
      <main>
        {children}
      </main>
    </div>
  );
} 