'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Edit } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';
import AmateurMatchEditForm from '@/components/AmateurMatchEditForm';

interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  stadium_id: number | null;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  competition: {
    id: number;
    name: string;
  };
  home_team: {
    id: number;
    name: string;
  };
  away_team: {
    id: number;
    name: string;
  };
  stadium: {
    id: number;
    name: string;
  } | null;
}

interface Competition {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

interface Stadium {
  id: number;
  name: string;
}

const matchStatuses = [
  'scheduled', 'in_progress', 'finished', 'cancelled', 'postponed'
];

const statusLabels = {
  scheduled: 'Agendado',
  in_progress: 'Em Andamento',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  postponed: 'Adiado'
};

export default function EditarJogoPage() {
  const [formData, setFormData] = useState({
    competition_id: '',
    home_team_id: '',
    away_team_id: '',
    stadium_id: '',
    match_date: '',
    home_score: '',
    away_score: '',
    status: 'scheduled'
  });
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGoalEditForm, setShowGoalEditForm] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const { requireAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchId = params.id;

  // Verificar autenticação
  if (!requireAuth()) {
    return null;
  }

  useEffect(() => {
    if (matchId) {
      fetchMatch();
      fetchData();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      console.log('=== FETCH MATCH INICIADO ===');
      console.log('ID do jogo:', matchId);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/amateur/matches/${matchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const match: Match = await response.json();
        console.log('Jogo carregado:', match);
        
        const newFormData = {
          competition_id: match.competition?.id?.toString() || match.competition_id?.toString() || '',
          home_team_id: match.home_team?.id?.toString() || match.home_team_id?.toString() || '',
          away_team_id: match.away_team?.id?.toString() || match.away_team_id?.toString() || '',
          stadium_id: match.stadium?.id?.toString() || match.stadium_id?.toString() || '',
          match_date: match.match_date ? match.match_date.substring(0, 16) : '',
          home_score: match.home_score?.toString() || '',
          away_score: match.away_score?.toString() || '',
          status: match.status || 'scheduled'
        };
        
        console.log('Dados do formulário preparados:', newFormData);
        setFormData(newFormData);
        setCurrentMatch(match);
      } else {
        const errorData = await response.json();
        console.error('Erro ao carregar jogo:', errorData);
        setError('Erro ao carregar jogo');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
      console.log('=== FETCH MATCH FINALIZADO ===');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar competições
      const competitionsResponse = await fetch('/api/amateur/competitions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (competitionsResponse.ok) {
        const competitionsData = await competitionsResponse.json();
        setCompetitions(competitionsData);
      }

      // Buscar times
      const teamsResponse = await fetch('/api/amateur/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
      }

      // Buscar estádios
      const stadiumsResponse = await fetch('/api/amateur/stadiums', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (stadiumsResponse.ok) {
        const stadiumsData = await stadiumsResponse.json();
        setStadiums(stadiumsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    console.log('Campo alterado:', name, 'Valor:', value, 'Tipo:', type);
    
    let processedValue = value;
    
    // Para campos numéricos, processar adequadamente
    if (type === 'number') {
      if (value === '' || value === null || value === undefined) {
        processedValue = '';
      } else {
        const numValue = parseInt(value);
        processedValue = isNaN(numValue) ? '' : numValue.toString();
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Preparar dados para envio
      const submitData: any = {
        status: formData.status
      };

      // Processar competição
      if (formData.competition_id && formData.competition_id !== '') {
        submitData.competition_id = parseInt(formData.competition_id);
      }

      // Processar times
      if (formData.home_team_id && formData.home_team_id !== '') {
        submitData.home_team_id = parseInt(formData.home_team_id);
      }

      if (formData.away_team_id && formData.away_team_id !== '') {
        submitData.away_team_id = parseInt(formData.away_team_id);
      }

      // Processar estádio
      if (formData.stadium_id && formData.stadium_id !== '' && formData.stadium_id !== 'null') {
        const stadiumId = parseInt(formData.stadium_id);
        if (!isNaN(stadiumId) && stadiumId > 0) {
          submitData.stadium_id = stadiumId;
        } else {
          submitData.stadium_id = null;
        }
      } else {
        submitData.stadium_id = null;
      }

      // Processar data
      if (formData.match_date) {
        submitData.match_date = formData.match_date;
      }

      // Processar scores
      if (formData.home_score && formData.home_score !== '') {
        const homeScore = parseInt(formData.home_score);
        if (!isNaN(homeScore)) {
          submitData.home_score = homeScore;
        }
      } else {
        submitData.home_score = null;
      }

      if (formData.away_score && formData.away_score !== '') {
        const awayScore = parseInt(formData.away_score);
        if (!isNaN(awayScore)) {
          submitData.away_score = awayScore;
        }
      } else {
        submitData.away_score = null;
      }

      console.log('Dados do formulário:', formData);
      console.log('Dados sendo enviados:', submitData);
      
      const response = await fetch(`/api/amateur/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      });

      console.log('Status da resposta:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Resposta de sucesso:', data);
        setSuccess('Jogo atualizado com sucesso!');
        setTimeout(() => {
          router.push('/admin-amadores/jogos');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        setError(errorData.message || 'Erro ao atualizar jogo');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  const handleEditGoals = () => {
    if (currentMatch) {
      setShowGoalEditForm(true);
    }
  };

  const handleSaveGoals = async (matchData: any) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`/api/amateur/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          home_team_player_stats: matchData.home_team_player_stats,
          away_team_player_stats: matchData.away_team_player_stats
        }),
      });
      
      if (response.ok) {
        setSuccess('Gols atualizados com sucesso!');
        setShowGoalEditForm(false);
        fetchMatch(); // Recarregar dados do jogo
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atualizar gols');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleCancelGoals = () => {
    setShowGoalEditForm(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando jogo...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/admin-amadores/jogos"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>Voltar</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Jogo</h1>
              <p className="text-gray-600 mt-2">
                Atualize os dados do jogo amador
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="competition_id" className="block text-sm font-medium text-gray-700 mb-2">
                Competição *
              </label>
              <select
                id="competition_id"
                name="competition_id"
                value={formData.competition_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Selecione uma competição...</option>
                {competitions.map(competition => (
                  <option key={competition.id} value={competition.id}>{competition.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home_team_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Time Casa *
                </label>
                <select
                  id="home_team_id"
                  name="home_team_id"
                  value={formData.home_team_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione o time casa...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="away_team_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Time Visitante *
                </label>
                <select
                  id="away_team_id"
                  name="away_team_id"
                  value={formData.away_team_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione o time visitante...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="match_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Jogo *
                </label>
                <input
                  type="datetime-local"
                  id="match_date"
                  name="match_date"
                  value={formData.match_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="stadium_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Estádio
                </label>
                <select
                  id="stadium_id"
                  name="stadium_id"
                  value={formData.stadium_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione um estádio...</option>
                  {stadiums.map(stadium => (
                    <option key={stadium.id} value={stadium.id}>{stadium.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="home_score" className="block text-sm font-medium text-gray-700 mb-2">
                  Gols Casa
                </label>
                <input
                  type="number"
                  id="home_score"
                  name="home_score"
                  value={formData.home_score}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="away_score" className="block text-sm font-medium text-gray-700 mb-2">
                  Gols Visitante
                </label>
                <input
                  type="number"
                  id="away_score"
                  name="away_score"
                  value={formData.away_score}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {matchStatuses.map(status => (
                    <option key={status} value={status}>{statusLabels[status as keyof typeof statusLabels]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin-amadores/jogos"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              {currentMatch && (
                <button
                  type="button"
                  onClick={handleEditGoals}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar Gols</span>
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de Edição de Gols */}
      {showGoalEditForm && currentMatch && (
        <AmateurMatchEditForm
          match={currentMatch}
          onSave={handleSaveGoals}
          onCancel={handleCancelGoals}
        />
      )}
    </div>
  );
} 