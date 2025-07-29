'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Calendar, Users, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Match {
  id: number;
  home_team: {
    id: number;
    name: string;
    logo_url: string | null;
  } | null;
  away_team: {
    id: number;
    name: string;
    logo_url: string | null;
  } | null;
  competition: {
    id: number;
    name: string;
  } | null;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stadium: {
    id: number;
    name: string;
  } | null;
}

export default function JogosPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/matches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos do backend:', data);
        console.log('Número de jogos:', data.length);
        
        data.forEach((match: any, index: number) => {
          console.log(`Jogo ${index + 1}:`, {
            id: match.id,
            home_team: match.home_team,
            away_team: match.away_team,
            competition: match.competition,
            home_score: match.home_score,
            away_score: match.away_score,
            status: match.status,
            match_date: match.match_date
          });
        });
        
        setMatches(data);
      } else {
        setError('Erro ao carregar jogos');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (matchId: number) => {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchMatches(); // Recarregar lista
      } else {
        setError('Erro ao excluir jogo');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'finished':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'in_progress':
        return 'Em Andamento';
      case 'finished':
        return 'Finalizado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Jogos Amadores</h1>
              <p className="text-gray-600 mt-2">
                Gerencie as partidas dos seus campeonatos amadores
              </p>
            </div>
            <Link
              href="/admin-amadores/jogos/novo"
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Jogo</span>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum jogo encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando seu primeiro jogo amador
              </p>
              <Link
                href="/admin-amadores/jogos/novo"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Primeiro Jogo</span>
              </Link>
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      {/* Home Team */}
                      <div className="flex items-center space-x-2">
                        {match.home_team && match.home_team.logo_url ? (
                          <img
                            src={match.home_team.logo_url}
                            alt={match.home_team.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {match.home_team ? match.home_team.name : 'Time Casa'}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {match.home_score !== null ? match.home_score : '-'}
                        </span>
                        <span className="text-gray-500">x</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {match.away_score !== null ? match.away_score : '-'}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {match.away_team ? match.away_team.name : 'Time Visitante'}
                        </span>
                        {match.away_team && match.away_team.logo_url ? (
                          <img
                            src={match.away_team.logo_url}
                            alt={match.away_team.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                      {getStatusText(match.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4" />
                    <span>{match.competition ? match.competition.name : 'Competição não definida'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(match.match_date)}</span>
                  </div>
                  {match.stadium && (
                    <div className="flex items-center space-x-2">
                      <span>🏟️</span>
                      <span>{match.stadium.name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/admin-amadores/jogos/${match.id}/editar`}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(match.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  );
} 