import type { NextPage } from 'next';
import { ShieldCheck, ArrowDown, ArrowUp } from 'lucide-react';

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
  form?: string;
}

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getStandings(slug: string): Promise<Standing[]> {
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 3600 } });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: { id: number } = await competitionResponse.json();

  const standingsResponse = await fetch(`${API_URL}/standings/competition/${competition.id}`, { next: { revalidate: 3600 } });
  if (!standingsResponse.ok) throw new Error('Tabela de classificação indisponível');
  
  return standingsResponse.json();
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  const standings = await getStandings(params.competitionSlug);

  const tableHeaders = [
    { label: '#', align: 'left' },
    { label: 'Time', align: 'left', className: 'w-2/5' },
    { label: 'P', align: 'center', tooltip: 'Pontos' },
    { label: 'J', align: 'center', tooltip: 'Jogos' },
    { label: 'V', align: 'center', tooltip: 'Vitórias' },
    { label: 'E', align: 'center', tooltip: 'Empates' },
    { label: 'D', align: 'center', tooltip: 'Derrotas' },
    { label: 'GP', align: 'center', tooltip: 'Gols Pró' },
    { label: 'GC', align: 'center', tooltip: 'Gols Contra' },
    { label: 'SG', align: 'center', tooltip: 'Saldo de Gols' },
  ];

  // Exemplo de como as regras de classificação poderiam ser usadas
  const getRankIndicator = (rank: number) => {
    // A lógica viria do `competition.rules` que não estamos buscando aqui ainda
    if (rank <= 4) return 'bg-blue-100 text-blue-800'; // Libertadores
    if (rank <= 6) return 'bg-cyan-100 text-cyan-800'; // Pré-Libertadores
    if (rank <= 12) return 'bg-green-100 text-green-800'; // Sul-Americana
    if (rank >= 17) return 'bg-red-100 text-red-800'; // Rebaixamento
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map(header => (
                  <th
                    key={header.label}
                    scope="col"
                    className={`px-3 py-3 text-${header.align} text-xs font-semibold text-gray-600 uppercase tracking-wider ${header.className || ''}`}
                    title={header.tooltip}
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                       <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankIndicator(s.rank)}`}>
                         {s.rank}
                       </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {s.team.logo_url ? (
                           <img className="h-8 w-8 rounded-full object-contain" src={s.team.logo_url} alt={s.team.name} />
                        ) : (
                          <ShieldCheck className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{s.team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-800">{s.points}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.games_played}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.wins}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.draws}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.losses}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.goals_for}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.goals_against}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-700">{s.goal_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium text-gray-900">Tabela Indisponível</h3>
          <p className="mt-2 text-md text-gray-500">
            Ainda não há dados de classificação para este campeonato.
          </p>
        </div>
      )}
    </div>
  );
}

export default ClassificationPage; 