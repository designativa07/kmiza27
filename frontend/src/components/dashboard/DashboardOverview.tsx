'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { UserStats, User } from '@/types/auth';
import StatsCard from './StatsCard';
import { 
  UsersIcon, 
  UserGroupIcon, 
  HeartIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../LoadingSpinner';

export default function DashboardOverview() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar estatísticas e usuários em paralelo
      const [statsData, usersData] = await Promise.all([
        authService.getUserStats(),
        authService.getAllUsers()
      ]);

      setStats(statsData);
      
      // Pegar os últimos 5 usuários criados
      const sortedUsers = usersData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setRecentUsers(sortedUsers);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema Kmiza27</p>
        </div>
        <LoadingSpinner text="Carregando estatísticas..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema Kmiza27</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema Kmiza27</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Usuários"
            value={stats.total}
            icon={<UsersIcon className="h-6 w-6" />}
            color="blue"
          />
          <StatsCard
            title="Usuários Ativos"
            value={stats.active}
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
            color="green"
          />
          <StatsCard
            title="Com Time Favorito"
            value={stats.withFavoriteTeam}
            icon={<HeartIcon className="h-6 w-6" />}
            color="purple"
          />
          <StatsCard
            title="Administradores"
            value={stats.admins}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="orange"
          />
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Usuários Recentes</h3>
            <p className="text-sm text-gray-600">Últimos usuários cadastrados</p>
          </div>
          <div className="p-6">
            {recentUsers.length > 0 ? (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">
                          {formatDate(user.created_at)}
                        </p>
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Admin
                          </span>
                        )}
                        {user.favorite_team && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {user.favorite_team.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${
                      user.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`} title={user.is_active ? 'Ativo' : 'Inativo'} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum usuário encontrado</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
            <p className="text-sm text-gray-600">Funcionalidades frequentes</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <a
                href="/users"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <UsersIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Gerenciar Usuários</p>
                  <p className="text-xs text-gray-500">Visualizar e gerenciar todos os usuários</p>
                </div>
              </a>
              
              <a
                href="/admins"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <UserGroupIcon className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Administradores</p>
                  <p className="text-xs text-gray-500">Criar e gerenciar administradores</p>
                </div>
              </a>
              
              <button
                onClick={loadDashboardData}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full text-left"
              >
                <ClockIcon className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Atualizar Dados</p>
                  <p className="text-xs text-gray-500">Recarregar estatísticas em tempo real</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 