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
  Trophy,
  Calendar,
  Users,
  Target,
  Shield
} from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';
import ImageWithFallback from '@/components/ImageWithFallback';
import AmateurCompetitionTeamsForm from '@/components/AmateurCompetitionTeamsForm';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function CompeticoesPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTeamsForm, setShowTeamsForm] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const { user, requireAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!requireAuth()) return;
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/amateur/competitions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      } else {
        setError('Erro ao carregar competições');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta competição?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/competitions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCompetitions();
      } else {
        setError('Erro ao excluir competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleManageTeams = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowTeamsForm(true);
  };

  const handleSaveTeams = async (competitionTeams: any[]) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      // Enviar dados dos times para o backend
      const response = await fetch(`/api/amateur/competitions/${selectedCompetition?.id}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ competition_teams: competitionTeams }),
      });
      
      if (response.ok) {
        setShowTeamsForm(false);
        setSelectedCompetition(null);
        // Opcional: mostrar mensagem de sucesso
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao salvar times');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleCancelTeams = () => {
    setShowTeamsForm(false);
    setSelectedCompetition(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
                <h1 className="text-3xl font-bold text-gray-900">Minhas Competições</h1>
                <p className="text-gray-600 mt-2">
                  Gerencie suas competições amadoras
                </p>
              </div>
            </div>
            <Link
              href="/admin-amadores/competicoes/nova"
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Competição</span>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Competitions List */}
        <div className="space-y-4">
          {competitions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma competição encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua primeira competição amadora para começar
              </p>
              <Link
                href="/admin-amadores/competicoes/nova"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Competição</span>
              </Link>
            </div>
          ) : (
            competitions.map((competition) => (
              <div
                key={competition.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ImageWithFallback
                        src={competition.logo_url}
                        alt={competition.name}
                        fallbackType="competition"
                        size="md"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {competition.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {competition.country || 'Brasil'} • {competition.category}
                      </p>
                      <p className="text-xs text-gray-500">
                        Criada em {new Date(competition.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Quick Actions */}
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/amadores/${competition.slug}/jogos`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver Jogos"
                      >
                        <Calendar className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/amadores/${competition.slug}/classificacao`}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Ver Classificação"
                      >
                        <Users className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/amadores/${competition.slug}/artilharia`}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Ver Artilharia"
                      >
                        <Target className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleManageTeams(competition)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Gerenciar Times"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/admin-amadores/competicoes/${competition.id}/editar`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(competition.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    competition.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {competition.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Gerenciamento de Times */}
      {showTeamsForm && selectedCompetition && (
        <AmateurCompetitionTeamsForm
          competition={selectedCompetition}
          onSave={handleSaveTeams}
          onCancel={handleCancelTeams}
        />
      )}
    </div>
  );
} 