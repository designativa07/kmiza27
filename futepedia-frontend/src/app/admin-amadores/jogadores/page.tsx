'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Shield,
  Calendar,
  MapPin,
  Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PlayerImage from '@/components/PlayerImage';

interface Player {
  id: number;
  name: string;
  image_url: string | null;
  position: string | null;
  birth_date: string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  team: {
    id: number;
    name: string;
    logo_url: string | null;
  } | null;
  created_at: string;
}

export default function JogadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, requireAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth()) return;
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/players', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        setError('Erro ao carregar jogadores');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este jogador?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/players/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPlayers();
      } else {
        setError('Erro ao excluir jogador');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
            <h1 className="text-3xl font-bold text-gray-900">Meus Jogadores</h1>
            <p className="mt-2 text-gray-600">Gerencie jogadores dos seus times</p>
          </div>
          <Link
            href="/admin-amadores/jogadores/novo"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Jogador</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Players List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Jogadores ({players.length})</h2>
        </div>
        
        {players.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum jogador encontrado</h3>
            <p className="text-gray-600 mb-4">Crie seu primeiro jogador para começar</p>
            <Link
              href="/admin-amadores/jogadores/novo"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Jogador</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {players.map((player) => (
              <div key={player.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <PlayerImage
                        src={player.image_url}
                        alt={player.name}
                        size="md"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        {player.position && (
                          <span className="flex items-center">
                            <Target className="h-4 w-4 mr-1" />
                            {player.position}
                          </span>
                        )}
                        {player.birth_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {getAge(player.birth_date)} anos
                          </span>
                        )}
                        {player.team && (
                          <span className="flex items-center">
                            <Shield className="h-4 w-4 mr-1" />
                            {player.team.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin-amadores/jogadores/${player.id}/editar`}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>Criado em {new Date(player.created_at).toLocaleDateString('pt-BR')}</span>
                  {player.nationality && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {player.nationality}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 