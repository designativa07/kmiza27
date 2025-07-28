'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Calendar, 
  Trophy, 
  Settings, 
  LogOut, 
  Plus,
  ArrowRight,
  User
} from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';

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

export default function AdminAmadoresPage() {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleRefreshStats = () => {
    loadDashboardStats();
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      title: 'Minhas Competições',
      description: 'Gerencie suas competições amadoras',
      icon: Trophy,
      href: '/admin-amadores/competicoes',
      color: 'bg-blue-500',
    },
    {
      title: 'Meus Times',
      description: 'Administre seus times amadores',
      icon: Shield,
      href: '/admin-amadores/times',
      color: 'bg-green-500',
    },
    {
      title: 'Meus Jogadores',
      description: 'Gerencie jogadores dos seus times',
      icon: Users,
      href: '/admin-amadores/jogadores',
      color: 'bg-purple-500',
    },
    {
      title: 'Meus Jogos',
      description: 'Administre partidas e resultados',
      icon: Calendar,
      href: '/admin-amadores/jogos',
      color: 'bg-orange-500',
    },
    {
      title: 'Meus Estádios',
      description: 'Gerencie locais de jogo',
      icon: Settings,
      href: '/admin-amadores/estadios',
      color: 'bg-red-500',
    },
    {
      title: 'Minha Conta',
      description: 'Configurações do perfil',
      icon: User,
      href: '/admin-amadores/conta',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel do Amador</h1>
              <p className="text-gray-600 mt-2">
                Bem-vindo, {user.name}! Gerencie suas competições amadoras.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Logado como</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <button
                onClick={handleRefreshStats}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>Atualizar</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ações Rápidas</h2>
                <p className="text-gray-600 text-sm">Crie e gerencie rapidamente</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin-amadores/competicoes/nova"
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Competição</span>
                </Link>
                <Link
                  href="/admin-amadores/times/novo"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Time</span>
                </Link>
                <Link
                  href="/admin-amadores/jogos/novo"
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Jogo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${item.color} text-white`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Competições</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.competitions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Times</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.teams}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Jogadores</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.players}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Jogos</p>
                  <p className="text-lg font-semibold text-gray-900">{stats.matches}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 