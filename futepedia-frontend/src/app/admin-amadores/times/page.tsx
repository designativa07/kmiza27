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
      
      const response = await fetch(`/api/amateur/teams/${selectedTeam?.id}/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_players: teamPlayers })
      });

      if (response.ok) {
        setShowPlayersForm(false);
        setSelectedTeam(null);
      } else {
        setError('Erro ao salvar jogadores do time');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Times</h1>
            <p className="mt-2 text-gray-600">Gerencie seus times amadores</p>
          </div>
          <Link
            href="/admin-amadores/times/novo"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Time</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Teams List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Times ({teams.length})</h2>
        </div>
        
        {teams.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum time encontrado</h3>
            <p className="text-gray-600 mb-4">Crie seu primeiro time amador para começar</p>
            <Link
              href="/admin-amadores/times/novo"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Time</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {teams.map((team) => (
              <div key={team.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={team.logo_url}
                        alt={team.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        fallbackSrc="/placeholder-team.png"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {team.city}, {team.state}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Fundado em {team.founded_year || 'N/A'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {team.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleManagePlayers(team)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>Jogadores</span>
                    </button>
                    <Link
                      href={`/admin-amadores/times/${team.id}/editar`}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>Criado em {new Date(team.created_at).toLocaleDateString('pt-BR')}</span>
                  <Link
                    href={`/admin-amadores/times/${team.id}/jogadores`}
                    className="text-green-600 hover:text-green-700"
                  >
                    Ver Jogadores
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Players Form Modal */}
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