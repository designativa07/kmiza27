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

async function getStandings(slug: string): Promise<Standing[]> {
  // A busca da competição já é feita no layout, podemos otimizar isso no futuro
  // para não buscar duas vezes, mas por enquanto vamos manter simples.
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { cache: 'no-store' });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada para obter a classificação');
  const competition: { id: number } = await competitionResponse.json();

  const standingsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}`, { cache: 'no-store' });
  if (!standingsResponse.ok) throw new Error('Não foi possível carregar a tabela de classificação');
  
  return standingsResponse.json();
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  const standings = await getStandings(params.competitionSlug);

  const tableHeaders = [
    { label: '#', align: 'left' },
    { label: 'Time', align: 'left' },
    { label: 'P', align: 'center', tooltip: 'Pontos' },
    { label: 'J', align: 'center', tooltip: 'Jogos' },
    { label: 'V', align: 'center', tooltip: 'Vitórias' },
    { label: 'E', align: 'center', tooltip: 'Empates' },
    { label: 'D', align: 'center', tooltip: 'Derrotas' },
    { label: 'GP', align: 'center', tooltip: 'Gols Pró' },
    { label: 'GC', align: 'center', tooltip: 'Gols Contra' },
    { label: 'SG', align: 'center', tooltip: 'Saldo de Gols' },
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map(header => (
                  <th
                    key={header.label}
                    scope="col"
                    className={`px-4 py-3 text-${header.align} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                    title={header.tooltip}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((s, index) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{s.rank}</span>
                      {/* Adicionar lógica de classificação (e.g., Libertadores, Sul-Americana, Rebaixamento) */}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img className="h-8 w-8 rounded-full object-contain" src={s.team.logo_url} alt={`${s.team.name} logo`} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{s.team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-800">{s.points}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.games_played}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.wins}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.draws}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.losses}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.goals_for}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.goals_against}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.goal_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Tabela de Classificação Indisponível</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ainda não há dados de classificação para este campeonato. Por favor, volte mais tarde.
          </p>
        </div>
      )}
    </div>
  );
}

export default ClassificationPage; 