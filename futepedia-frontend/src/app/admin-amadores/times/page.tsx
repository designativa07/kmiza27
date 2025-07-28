'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';
import ImageWithFallback from '@/components/ImageWithFallback';
import AmateurTeamPlayersForm from '@/components/AmateurTeamPlayersForm';

interface Team {
  id: number;
  name: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  category: string;
  founded_year: number | null;
  created_at: string;
}

export default function TimesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPlayersForm, setShowPlayersForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { user, requireAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth()) return;
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      } else {
        setError('Erro ao carregar times');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este time?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/teams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTeams();
      } else {
        setError('Erro ao excluir time');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleManagePlayers = (team: Team) => {
    setSelectedTeam(team);
    setShowPlayersForm(true);
  };

  const handleSavePlayers = async (teamPlayers: any[]) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      // Enviar dados dos jogadores para o backend
      const response = await fetch(`/api/amateur/teams/${selectedTeam?.id}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ team_players: teamPlayers }),
      });
      
      if (response.ok) {
        setShowPlayersForm(false);
        setSelectedTeam(null);
        // Opcional: mostrar mensagem de sucesso
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar jogadores');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleCancelPlayers = () => {
    setShowPlayersForm(false);
    setSelectedTeam(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin-amadores"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span>Voltar</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meus Times</h1>
                <p className="text-gray-600 mt-2">
                  Gerencie seus times amadores
                </p>
              </div>
            </div>
            <Link
              href="/admin-amadores/times/novo"
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Time</span>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum time encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie seu primeiro time amador para começar
                </p>
                <Link
                  href="/admin-amadores/times/novo"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Criar Time</span>
                </Link>
              </div>
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={team.logo_url}
                        alt={team.name}
                        fallbackType="team"
                        size="md"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {team.city && team.state ? `${team.city}, ${team.state}` : team.city || team.state || 'Localização não informada'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleManagePlayers(team)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Gerenciar Jogadores"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/admin-amadores/times/${team.id}/editar`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{team.country || 'Brasil'}</span>
                  </div>
                  
                  {team.founded_year && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Fundado em {team.founded_year}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>{team.category}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <Link
                      href={`/admin-amadores/times/${team.id}/jogadores`}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Ver Jogadores
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Gerenciamento de Jogadores */}
      {showPlayersForm && selectedTeam && (
        <AmateurTeamPlayersForm
          team={selectedTeam}
          onSave={handleSavePlayers}
          onCancel={handleCancelPlayers}
        />
      )}
    </div>
  );
} 