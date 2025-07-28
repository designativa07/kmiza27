'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Users, Trophy } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';

interface Team {
  id: number;
  name: string;
  logo_url: string | null;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
}

interface Stadium {
  id: number;
  name: string;
  city: string;
}

export default function NovoJogoPage() {
  const [formData, setFormData] = useState({
    home_team_id: '',
    away_team_id: '',
    competition_id: '',
    stadium_id: '',
    match_date: '',
    match_time: '',
    status: 'scheduled',
    home_score: '',
    away_score: '',
    notes: '',
  });
  const [teams, setTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Buscar times
      const teamsResponse = await fetch('/api/amateur/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log('Times carregados:', teamsData);
        setTeams(teamsData);
      }

      // Buscar competições
      const competitionsResponse = await fetch('/api/amateur/competitions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (competitionsResponse.ok) {
        const competitionsData = await competitionsResponse.json();
        console.log('Competições carregadas:', competitionsData);
        setCompetitions(competitionsData);
      }

      // Buscar estádios amadores
      const stadiumsResponse = await fetch('/api/amateur/stadiums', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (stadiumsResponse.ok) {
        const stadiumsData = await stadiumsResponse.json();
        console.log('Estádios carregados:', stadiumsData);
        setStadiums(stadiumsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validações
    if (!formData.home_team_id || !formData.away_team_id) {
      setError('Selecione os dois times');
      setLoading(false);
      return;
    }

    if (formData.home_team_id === formData.away_team_id) {
      setError('Os times não podem ser iguais');
      setLoading(false);
      return;
    }

    if (!formData.match_date || !formData.match_time) {
      setError('Data e horário são obrigatórios');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const matchDateTime = `${formData.match_date}T${formData.match_time}`;
      
      // Preparar dados para envio
      const requestData: any = {
        home_team_id: parseInt(formData.home_team_id),
        away_team_id: parseInt(formData.away_team_id),
        match_date: matchDateTime,
        status: formData.status
      };

      // Processar competição
      if (formData.competition_id && formData.competition_id !== '') {
        requestData.competition_id = parseInt(formData.competition_id);
      }

      // Processar estádio
      if (formData.stadium_id && formData.stadium_id !== '' && formData.stadium_id !== 'null') {
        const stadiumId = parseInt(formData.stadium_id);
        if (!isNaN(stadiumId) && stadiumId > 0) {
          requestData.stadium_id = stadiumId;
        }
      }

      // Processar scores
      if (formData.home_score && formData.home_score !== '') {
        const homeScore = parseInt(formData.home_score);
        if (!isNaN(homeScore)) {
          requestData.home_score = homeScore;
        }
      }

      if (formData.away_score && formData.away_score !== '') {
        const awayScore = parseInt(formData.away_score);
        if (!isNaN(awayScore)) {
          requestData.away_score = awayScore;
        }
      }

      // Processar observações
      if (formData.notes && formData.notes.trim() !== '') {
        requestData.notes = formData.notes;
      }

      console.log('Dados do formulário:', formData);
      console.log('Dados sendo enviados:', requestData);
      
      const response = await fetch('/api/amateur/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      console.log('Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta de sucesso:', data);
        setSuccess('Jogo criado com sucesso!');
        setTimeout(() => {
          router.push('/admin-amadores/jogos');
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        setError(errorData.message || 'Erro ao criar jogo');
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Agendado' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

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
              <h1 className="text-3xl font-bold text-gray-900">Novo Jogo</h1>
              <p className="text-gray-600 mt-2">
                Agende uma nova partida amadora
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
            {/* Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home_team_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Time da Casa *
                </label>
                <select
                  id="home_team_id"
                  name="home_team_id"
                  value={formData.home_team_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione...</option>
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
                  <option value="">Selecione...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Competição e Estádio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="competition_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Competição
                </label>
                <select
                  id="competition_id"
                  name="competition_id"
                  value={formData.competition_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {competitions.map(competition => (
                    <option key={competition.id} value={competition.id}>{competition.name}</option>
                  ))}
                </select>
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
                  <option value="">Selecione...</option>
                  {stadiums.map(stadium => (
                    <option key={stadium.id} value={stadium.id}>{stadium.name} - {stadium.city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="match_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  id="match_date"
                  name="match_date"
                  value={formData.match_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="match_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Horário *
                </label>
                <input
                  type="time"
                  id="match_time"
                  name="match_time"
                  value={formData.match_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Status e Placar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Observações */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Informações adicionais sobre o jogo..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin-amadores/jogos"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Criando...' : 'Criar Jogo'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 