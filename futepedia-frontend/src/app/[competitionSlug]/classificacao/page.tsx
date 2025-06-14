import Link from 'next/link';
import type { NextPage } from 'next';

// Tipos de dados
interface Competition {
  id: number;
  name: string;
  slug: string;
}

interface Standing {
  id: number;
  rank: number;
  team: {
    id: number;
    name: string;
    logo_url: string;
  };
  points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Função de busca de dados no servidor
async function getCompetitionData(slug: string): Promise<{ competition: Competition, standings: Standing[] }> {
  // 1. Buscar detalhes da competição pelo slug
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 3600 } });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: Competition = await competitionResponse.json();

  // 2. Buscar a tabela de classificação usando o ID
  const standingsResponse = await fetch(`${API_URL}/competitions/${competition.id}/standings`, { next: { revalidate: 3600 } });
  if (!standingsResponse.ok) throw new Error('Não foi possível carregar a tabela de classificação');
  const standings: Standing[] = await standingsResponse.json();
  
  return { competition, standings };
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  const { competitionSlug } = params;
  const { competition, standings } = await getCompetitionData(competitionSlug);

  return (
    <main className="container mx-auto p-4">
      <header className="my-6">
        <Link href="/" className="text-indigo-600 hover:underline">&larr; Voltar para todos os campeonatos</Link>
        <h1 className="text-3xl font-bold mt-4">Tabela de Classificação - {competition.name}</h1>
      </header>

      {standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">#</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Time</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">P</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">J</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">V</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">E</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">D</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">GP</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">GC</th>
                <th className="text-center py-3 px-4 uppercase font-semibold text-sm">SG</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {standings.map((standing) => (
                <tr key={standing.id} className="border-b hover:bg-gray-100">
                  <td className="text-left py-3 px-4">{standing.rank}</td>
                  <td className="text-left py-3 px-4 flex items-center">
                    {standing.team.logo_url && <img src={standing.team.logo_url} alt={standing.team.name} className="h-6 w-6 mr-3 object-contain" />}
                    {standing.team.name}
                  </td>
                  <td className="text-center py-3 px-4 font-bold">{standing.points}</td>
                  <td className="text-center py-3 px-4">{standing.games_played}</td>
                  <td className="text-center py-3 px-4">{standing.wins}</td>
                  <td className="text-center py-3 px-4">{standing.draws}</td>
                  <td className="text-center py-3 px-4">{standing.losses}</td>
                  <td className="text-center py-3 px-4">{standing.goals_for}</td>
                  <td className="text-center py-3 px-4">{standing.goals_against}</td>
                  <td className="text-center py-3 px-4">{standing.goal_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">Ainda não há dados de classificação para este campeonato.</p>
      )}
    </main>
  );
}

export default ClassificationPage; 