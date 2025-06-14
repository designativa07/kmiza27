import Link from 'next/link';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Função para buscar os dados no servidor
async function getMatchesData(slug: string): Promise<{ competition: Competition, matches: Match[] }> {
  // 1. Buscar detalhes da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 3600 } });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: Competition = await competitionResponse.json();

  // 2. Buscar os jogos
  const matchesResponse = await fetch(`${API_URL}/competitions/${competition.id}/matches`, { next: { revalidate: 3600 } });
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

// Componente de página assíncrono
export default async function MatchesPage({ params }: { params: { competitionSlug: string } }) {
  const { competitionSlug } = params;
  const { competition, matches } = await getMatchesData(competitionSlug);

  return (
    <main className="container mx-auto p-4">
      <header className="my-6">
        <Link href="/" className="text-indigo-600 hover:underline">&larr; Voltar para todos os campeonatos</Link>
        <h1 className="text-3xl font-bold mt-4">Jogos - {competition.name}</h1>
      </header>

      {matches.length > 0 ? (
        <div className="space-y-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-white p-4 rounded-lg shadow-md border hover:border-indigo-500 transition-all">
              <div className="text-center text-sm text-gray-600 mb-2">
                <span>{match.round}</span> - <span>{formatDate(match.match_date)}</span>
              </div>
              <div className="grid grid-cols-3 items-center text-center">
                {/* Time da Casa */}
                <div className="flex items-center justify-end gap-4">
                  <span className="hidden md:inline font-semibold">{match.home_team.name}</span>
                  <img src={match.home_team.logo_url} alt={match.home_team.name} className="h-10 w-10 object-contain" />
                </div>
                {/* Placar */}
                <div className="text-2xl font-bold">
                  {match.status === 'COMPLETED' ? (
                    <span>{match.home_team_score} x {match.away_team_score}</span>
                  ) : (
                    <span className="text-gray-400">vs</span>
                  )}
                </div>
                {/* Time Visitante */}
                <div className="flex items-center justify-start gap-4">
                  <img src={match.away_team.logo_url} alt={match.away_team.name} className="h-10 w-10 object-contain" />
                  <span className="hidden md:inline font-semibold">{match.away_team.name}</span>
                </div>
              </div>
              {match.stadium && <div className="text-center text-xs text-gray-500 mt-2">{match.stadium.name}</div>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">Ainda não há jogos agendados para este campeonato.</p>
      )}
    </main>
  );
} 