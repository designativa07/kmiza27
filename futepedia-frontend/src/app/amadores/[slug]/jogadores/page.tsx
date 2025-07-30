'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Search, CalendarDays, ListOrdered, Target } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { getApiUrl } from '@/lib/config';
import { PlayerCard } from '@/components/PlayerCard';

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/amadores" className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Voltar</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
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
              {new Set(filteredPlayers.map(p => p.team.name)).size}
            </div>
            <div className="text-sm text-gray-600">Times Participantes</div>
          </div>
        </div>

        {/* Grid de jogadores */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-t-lg"></div>
                <div className="p-2 md:p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {filteredPlayers.map((player) => (
              <PlayerCard 
                key={player.id} 
                player={{
                  id: player.id,
                  name: player.name,
                  position: player.position,
                  image_url: player.image_url
                }}
                teamName={player.team.name}
                showTeamName={true}
              />
            ))}
          </div>
        ) : (
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