import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/config';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Search } from 'lucide-react';

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

async function getCompetition(slug: string): Promise<Competition | null> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/competitions/slug/${slug}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch competition:', error);
    return null;
  }
}

async function getCompetitionPlayers(competitionId: number): Promise<Player[]> {
  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/competitions/${competitionId}/players`, {
      next: { revalidate: 1800 } // Revalida a cada 30 minutos
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Failed to fetch competition players:', error);
    return [];
  }
}

export default async function CompetitionPlayersPage({
  params,
}: {
  params: { competitionSlug: string };
}) {
  const competition = await getCompetition(params.competitionSlug);

  if (!competition) {
    notFound();
  }

  const players = await getCompetitionPlayers(competition.id);

  // Agrupar jogadores por time
  const playersByTeam = players.reduce((acc, player) => {
    const teamName = player.team.name;
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <ImageWithFallback
              src={competition.logo_url}
              alt={competition.name}
              fallbackType="competition"
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
              <p className="text-gray-600">Jogadores da Competição</p>
            </div>
          </div>
        </div>

        {/* Estatísticas gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-sm text-gray-600">Total de Jogadores</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {players.reduce((sum, p) => sum + (p.goals || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Gols</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {players.reduce((sum, p) => sum + (p.assists || 0), 0)}
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
                      src={player.image_url}
                      alt={player.name}
                      fallbackType="player"
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

        {players.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum jogador encontrado</h3>
            <p className="text-gray-600">Não há jogadores cadastrados para esta competição.</p>
          </div>
        )}
      </div>
    </div>
  );
} 