import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn';

// Interfaces
interface Competition {
  id: number;
  name: string;
  slug: string;
}

interface Match {
  id: number;
  match_date: string;
  round: string;
  status: string;
  home_team_score: number | null;
  away_team_score: number | null;
  home_team: {
    id: number;
    name: string;
    logo_url: string;
  };
  away_team: {
    id: number;
    name: string;
    logo_url: string;
  };
  stadium: {
    id: number;
    name: string;
  } | null;
}

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função para buscar os dados no servidor
async function getMatchesData(slug: string): Promise<{ competition: Competition, matches: Match[] }> {
  // 1. Buscar detalhes da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { cache: 'no-store' });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: Competition = await competitionResponse.json();

  // 2. Buscar os jogos
  const matchesResponse = await fetch(`${API_URL}/standings/competition/${competition.id}/matches`, { cache: 'no-store' });
  if (!matchesResponse.ok) throw new Error('Não foi possível carregar os jogos');
  const matches: Match[] = await matchesResponse.json();

  return { competition, matches };
}

// Função para formatar a data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

// Componente de página agora usa o tipo 'NextPage' com as nossas Props
const MatchesPage: NextPage<Props> = async ({ params }) => {
  const { competitionSlug } = params;
  const { competition, matches } = await getMatchesData(competitionSlug);

  // Agrupar jogos por rodada
  const matchesByRound = matches.reduce((acc, match) => {
    const roundName = match.round || 'Sem rodada';
    if (!acc[roundName]) {
      acc[roundName] = [];
    }
    acc[roundName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Ordenar as rodadas (assumindo que o nome da rodada contém um número)
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
    // Tentar extrair números das rodadas para ordenação
    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });

  return (
    <main className="container mx-auto pt-0 p-4">
      <header className="mb-4">
        <Link href="/" className="text-indigo-600 hover:underline">&larr; Voltar para todos os campeonatos</Link>
        <h1 className="text-3xl font-bold mt-2">Jogos - {competition.name}</h1>
      </header>

      {matches.length > 0 ? (
        <div className="space-y-8">
          {sortedRounds.map((roundName) => (
            <div key={roundName} className="bg-white rounded-lg p-6">
              {/* Cabeçalho da Rodada */}
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{roundName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {matchesByRound[roundName].length} partida{matchesByRound[roundName].length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Lista de Jogos da Rodada */}
              <div className="space-y-4">
                {matchesByRound[roundName].map((match) => (
                  <div key={match.id} className="bg-gray-50 p-4 rounded-lg border hover:border-indigo-500 transition-all">
                    <div className="text-center text-sm text-gray-600 mb-3">
                      <span>{formatDate(match.match_date)}</span>
                      {match.stadium && <span className="ml-2">• {match.stadium.name}</span>}
                    </div>
                    <div className="grid grid-cols-3 items-center text-center">
                      {/* Time da Casa */}
                      <div className="flex items-center justify-end gap-4">
                        <span className="hidden md:inline font-semibold text-gray-800">{match.home_team.name}</span>
                        <img 
                          src={getTeamLogoUrl(match.home_team.logo_url)} 
                          alt={match.home_team.name} 
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                      {/* Placar */}
                      <div className="text-2xl font-bold">
                        {match.status === 'COMPLETED' ? (
                          <span className="text-gray-800">{match.home_team_score} × {match.away_team_score}</span>
                        ) : (
                          <span className="text-gray-400">×</span>
                        )}
                      </div>
                      {/* Time Visitante */}
                      <div className="flex items-center justify-start gap-4">
                        <img 
                          src={getTeamLogoUrl(match.away_team.logo_url)} 
                          alt={match.away_team.name} 
                          className="h-10 w-10 object-contain"
                        />
                        <span className="hidden md:inline font-semibold text-gray-800">{match.away_team.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">Ainda não há jogos agendados para este campeonato.</p>
      )}
    </main>
  );
};

export default MatchesPage; 