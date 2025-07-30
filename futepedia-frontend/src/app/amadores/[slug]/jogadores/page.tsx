'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, CalendarDays, ListOrdered, Target } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { getApiUrl } from '@/lib/config';
import ImageWithFallback from '@/components/ImageWithFallback';

interface Player {
  id: number;
  name: string;
  position: string;
  image_url?: string;
  team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
}

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

async function getAmateurCompetition(slug: string): Promise<Competition | null> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/amateur/competitions/slug/${slug}`);
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch amateur competition:', error);
    return null;
  }
}

async function getAmateurCompetitionPlayers(competitionId: number): Promise<Player[]> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/amateur/competitions/${competitionId}/players`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch amateur competition players:', error);
    return [];
  }
}

export default function AmateurCompetitionPlayersPage({ params }: { params: { slug: string } }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const competitionData = await getAmateurCompetition(params.slug);
        if (competitionData) {
          setCompetition(competitionData);
          const playersData = await getAmateurCompetitionPlayers(competitionData.id);
          setPlayers(playersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug]);

  // Filtrar jogadores por termo de busca
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar jogadores por time
  const playersByTeam = filteredPlayers.reduce((acc, player) => {
    const teamName = player.team.name;
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
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

  if (!competition) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Competição não encontrada</h1>
            <Link href="/amadores" className="text-indigo-600 hover:text-indigo-800">
              Voltar para Amadores
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/amadores" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <ImageWithFallback
              src={competition?.logo_url || null}
              alt={competition?.name || 'Competição'}
              fallbackType="competition"
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {competition?.name || 'Carregando...'}
              </h1>
              <p className="text-gray-600">Jogadores da Competição</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <Link href={`/amadores/${competition.slug}/jogos`} className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
              <CalendarDays className="h-4 w-4 mr-1" />
              Jogos
            </Link>
            <Link href={`/amadores/${competition.slug}/classificacao`} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <ListOrdered className="h-4 w-4 mr-1" />
              Classificação
            </Link>
            <Link href={`/amadores/${competition.slug}/artilharia`} className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
              <Target className="h-4 w-4 mr-1" />
              Artilharia
            </Link>
          </div>
        </div>

        {/* Barra de busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, posição ou time..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{filteredPlayers.length}</div>
            <div className="text-sm text-gray-600">Total de Jogadores</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {filteredPlayers.reduce((sum, p) => sum + (p.goals || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Gols</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {filteredPlayers.reduce((sum, p) => sum + (p.assists || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Assistências</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.keys(playersByTeam).length}
            </div>
            <div className="text-sm text-gray-600">Times Participantes</div>
          </div>
        </div>

        {/* Lista de jogadores por time */}
        <div className="space-y-6">
          {Object.entries(playersByTeam).map(([teamName, teamPlayers]) => (
            <div key={teamName} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">{teamName}</h2>
                <p className="text-sm text-gray-600">{teamPlayers.length} jogadores</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {teamPlayers.map((player) => (
                  <div key={player.id} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <ImageWithFallback
                      src={player.image_url || null}
                      alt={player.name}
                      fallbackType="team"
                      size="sm"
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {player.name}
                      </h3>
                      <p className="text-xs text-gray-500">{player.position}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        {player.goals !== undefined && (
                          <span className="text-xs text-green-600">
                            {player.goals} gol{player.goals !== 1 ? 's' : ''}
                          </span>
                        )}
                        {player.assists !== undefined && (
                          <span className="text-xs text-purple-600">
                            {player.assists} assist{player.assists !== 1 ? 's' : ''}
                          </span>
                        )}
                        {player.yellow_cards !== undefined && player.yellow_cards > 0 && (
                          <span className="text-xs text-yellow-600">
                            {player.yellow_cards} cartão{player.yellow_cards !== 1 ? 's' : ''} amarelo{player.yellow_cards !== 1 ? 's' : ''}
                          </span>
                        )}
                        {player.red_cards !== undefined && player.red_cards > 0 && (
                          <span className="text-xs text-red-600">
                            {player.red_cards} cartão{player.red_cards !== 1 ? 's' : ''} vermelho{player.red_cards !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.'
                : 'Não há jogadores cadastrados para esta competição.'
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
} 