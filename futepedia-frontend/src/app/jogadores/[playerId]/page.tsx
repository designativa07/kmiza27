'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getApiUrl } from '@/lib/config';
import { getPlayerImageUrl, getTeamLogoUrl } from '@/lib/cdn-simple';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { 
  User, 
  Shirt, 
  Calendar, 
  MapPin, 
  Flag, 
  Trophy, 
  Target, 
  BarChart3,
  ArrowLeft,
  Youtube,
  Instagram
} from 'lucide-react';
import Link from 'next/link';

interface Player {
  id: number;
  name: string;
  position?: string;
  date_of_birth?: string;
  image_url?: string;
  state?: string;
  nationality?: string;
  youtube_url?: string;
  instagram_url?: string;
  current_team?: {
    id: number;
    name: string;
    logo_url?: string;
  };
  created_at?: string;
  updated_at?: string;
  goals?: Goal[];
  cards?: Card[];
  team_history?: PlayerTeamHistory[];
}



interface Goal {
  id: number;
  player_id: number;
  match_id: number;
  team_id: number;
  minute: number;
  type: string;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: number;
  player_id: number;
  match_id: number;
  type: 'yellow' | 'red';
  minute: number;
  reason?: string;
  created_at: string;
  updated_at: string;
}

interface PlayerTeamHistory {
  id: number;
  player_id: number;
  team_id: number;
  start_date: string;
  end_date?: string;
  jersey_number?: string;
  role?: string;
  team: {
    id: number;
    name: string;
    short_name?: string;
    logo_url?: string;
  };
}

export default function PlayerDetailsPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const playerRes = await fetch(`${getApiUrl()}/players/${playerId}`);

        if (!playerRes.ok) {
          throw new Error('Jogador não encontrado');
        }

        const playerData = await playerRes.json();
        setPlayer(playerData);

      } catch (err) {
        console.error('Erro ao buscar detalhes do jogador:', err);
        setError('Erro ao carregar dados do jogador');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchPlayerDetails();
    }
  }, [playerId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusColor = (state?: string) => {
    if (!state) return 'gray';
    switch (state.toLowerCase()) {
      case 'active':
      case 'ativo':
        return 'green';
      case 'inactive':
      case 'inativo':
        return 'red';
      case 'suspended':
      case 'suspenso':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusText = (state?: string) => {
    if (!state) return 'Não informado';
    switch (state.toLowerCase()) {
      case 'active':
      case 'ativo':
        return 'Ativo';
      case 'inactive':
      case 'inativo':
        return 'Inativo';
      case 'suspended':
      case 'suspenso':
        return 'Suspenso';
      default:
        return state;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-16">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Jogador não encontrado</h3>
            <p className="text-sm text-gray-500 mb-6">{error || 'O jogador solicitado não foi encontrado.'}</p>
            <Link 
              href="/jogadores"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Jogadores
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const age = calculateAge(player.date_of_birth);
  const statusColor = getStatusColor(player.state);
  const statusText = getStatusText(player.state);

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Link 
            href="/jogadores"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Jogadores
          </Link>
        </div>

        {/* Cabeçalho do Jogador */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-6">
            {/* Foto do Jogador */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-40 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {player.image_url ? (
                  <img 
                    src={getPlayerImageUrl(player.image_url)} 
                    alt={player.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="h-16 w-16 text-gray-300" />
                )}
              </div>
              
              {/* Status */}
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm bg-${statusColor}-500`}></div>
            </div>

            {/* Informações Principais */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{player.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                {player.position && (
                  <div className="flex items-center">
                    <Shirt className="h-4 w-4 mr-1" />
                    <span>{player.position}</span>
                  </div>
                )}
                {age && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{age} anos</span>
                  </div>
                )}
                {player.nationality && (
                  <div className="flex items-center">
                    <Flag className="h-4 w-4 mr-1" />
                    <span>{player.nationality}</span>
                  </div>
                )}
              </div>

              {/* Redes Sociais */}
              {(player.youtube_url || player.instagram_url) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Redes Sociais</h4>
                  <div className="flex space-x-3">
                    {player.youtube_url && (
                      <a
                        href={player.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Youtube className="h-4 w-4" />
                        <span className="text-sm">YouTube</span>
                      </a>
                    )}
                    {player.instagram_url && (
                      <a
                        href={player.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <span className="text-sm">Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Time Atual */}
              {player.current_team && (
                <div className="flex items-center">
                  {player.current_team.logo_url ? (
                    <img 
                      src={getTeamLogoUrl(player.current_team.logo_url)} 
                      alt={player.current_team.name}
                      className="w-6 h-6 rounded mr-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded mr-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        {player.current_team.name.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{player.current_team.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
            Estatísticas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumo de Estatísticas */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Resumo de Estatísticas</h4>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-700">Gols Marcados: <span className="font-bold">{player.goals?.length || 0}</span></p>
                <p className="text-gray-700">Cartões Amarelos: <span className="font-bold">{player.cards?.filter(card => card.type === 'yellow').length || 0}</span></p>
                <p className="text-gray-700">Cartões Vermelhos: <span className="font-bold">{player.cards?.filter(card => card.type === 'red').length || 0}</span></p>
              </div>
            </div>

            {/* Histórico de Times */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Times</h4>
              {player.team_history && player.team_history.length > 0 ? (
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {player.team_history
                    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                    .map((history) => (
                      <li key={history.id} className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                        {history.team.logo_url ? (
                          <img
                            src={getTeamLogoUrl(history.team.logo_url)}
                            alt={`${history.team.name} logo`}
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-6 w-6 flex items-center justify-center bg-gray-200 rounded text-xs font-semibold text-gray-600">
                            {history.team.short_name?.substring(0, 3) || history.team.name.substring(0, 2)}
                          </div>
                        )}
                        <p className="text-sm text-gray-700 flex-grow">
                          <span className="font-medium">{history.team.name}</span> ({history.jersey_number || 'N/A'})
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatDate(history.start_date)} - {history.end_date ? formatDate(history.end_date) : 'Presente'}
                            {history.role && ` (${history.role})`}
                          </span>
                        </p>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-600">Nenhum histórico de time encontrado.</p>
              )}
            </div>
          </div>

          {/* Gols Marcados Detalhados */}
          {(player.goals && player.goals.length > 0) && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Gols Marcados</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {player.goals
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(goal => (
                    <li key={goal.id} className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                      <span className="font-bold text-green-700">GOL!</span>
                      <p className="text-sm text-gray-700">
                        Minuto {goal.minute} ({goal.type === 'normal' ? 'Normal' : goal.type})
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Cartões Recebidos */}
          {(player.cards && player.cards.length > 0) && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Cartões Recebidos</h4>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {player.cards
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(card => (
                    <li key={card.id} className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                      <span className={`font-bold ${card.type === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {card.type === 'yellow' ? 'AMARELO' : 'VERMELHO'}
                      </span>
                      <p className="text-sm text-gray-700">
                        Minuto {card.minute} {card.reason && `(${card.reason})`}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Informações Detalhadas */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Detalhadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <p className="text-sm text-gray-900">{player.name}</p>
              </div>
              
              {player.position && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
                  <p className="text-sm text-gray-900">{player.position}</p>
                </div>
              )}
              
              {player.date_of_birth && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <p className="text-sm text-gray-900">{formatDate(player.date_of_birth)}</p>
                </div>
              )}
              
              {player.nationality && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade</label>
                  <p className="text-sm text-gray-900">{player.nationality}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                  {statusText}
                </span>
              </div>
              
              {player.current_team && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Atual</label>
                  <p className="text-sm text-gray-900">{player.current_team.name}</p>
                </div>
              )}
              
              {player.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cadastrado em</label>
                  <p className="text-sm text-gray-900">{formatDate(player.created_at)}</p>
                </div>
              )}
              
              {player.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Última atualização</label>
                  <p className="text-sm text-gray-900">{formatDate(player.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 