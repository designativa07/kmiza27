'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, TrendingUp, Users, Trophy, Target } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';

interface StatComparison {
  category: string;
  total_players: number;
  total_matches: number;
  total_goals: number;
  avg_goals_per_match: number;
  top_scorer: {
    name: string;
    goals: number;
  };
}

export default function EstatisticasPage() {
  const [stats, setStats] = useState<StatComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Erro ao carregar estatísticas');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comparações Estatísticas</h1>
              <p className="text-gray-600 mt-2">
                Compare estatísticas entre profissionais e amadores
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma estatística disponível
                </h3>
                <p className="text-gray-600 mb-6">
                  As estatísticas aparecerão conforme você adicionar dados
                </p>
              </div>
            </div>
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {stat.category === 'professional' ? 'Profissionais' : 'Amadores'}
                  </h3>
                  <div className={`p-2 rounded-full ${
                    stat.category === 'professional' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {stat.category === 'professional' ? <Trophy className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.total_players.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Jogadores</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.total_matches.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Jogos</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.total_goals.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Gols</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.avg_goals_per_match.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Média/Gol</div>
                    </div>
                  </div>

                  {stat.top_scorer && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Artilheiro
                          </div>
                          <div className="text-sm text-gray-600">
                            {stat.top_scorer.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-yellow-600">
                            {stat.top_scorer.goals}
                          </div>
                          <div className="text-xs text-gray-600">gols</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Insights */}
        {stats.length >= 2 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Produtividade</span>
                </div>
                <p className="text-sm text-blue-700">
                  Compare a média de gols por jogo entre as categorias
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Participação</span>
                </div>
                <p className="text-sm text-green-700">
                  Veja a distribuição de jogadores e jogos
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Performance</span>
                </div>
                <p className="text-sm text-purple-700">
                  Analise os artilheiros de cada categoria
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 