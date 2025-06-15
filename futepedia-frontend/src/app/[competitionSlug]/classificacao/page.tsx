import type { NextPage } from 'next';
import { ShieldCheck, ArrowDown, ArrowUp } from 'lucide-react';
import { RoundMatches } from '@/components/RoundMatches';
import { Match } from '@/types/match';
import Link from 'next/link';

// Tipos de dados
interface Competition {
  id: number;
  name: string;
  slug: string;
}

interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    logo_url: string;
  };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  form?: string;
}

interface Round {
  id: number;
  name: string;
  round_number: number;
}

// Definir um tipo para as props da página
type Props = {
  params: { competitionSlug: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getClassificationPageData(slug: string) {
  // 1. Obter ID da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 60 } });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: { id: number; name: string } = await competitionResponse.json();
  const competitionId = competition.id;

  // 2. Fazer chamadas em paralelo
  const [standingsResponse, roundsResponse] = await Promise.all([
    fetch(`${API_URL}/standings/competition/${competitionId}`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/rounds/competition/${competitionId}`, { next: { revalidate: 60 } })
  ]);

  if (!standingsResponse.ok) throw new Error('Tabela de classificação indisponível');
  const standings: Standing[] = await standingsResponse.json();
  
  const rounds: Round[] = await roundsResponse.json();
  let matches: Match[] = [];
  let currentRoundName = 'Rodada';

  if (rounds && rounds.length > 0) {
    // Assumindo que a última rodada na lista é a atual/mais recente
    const latestRound = rounds[rounds.length - 1];
    currentRoundName = latestRound.name;
    const matchesResponse = await fetch(`${API_URL}/rounds/${latestRound.id}/matches`, { next: { revalidate: 60 } });
    if (matchesResponse.ok) {
      matches = await matchesResponse.json();
    }
  }

  return { standings, matches, currentRoundName };
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  const { standings, matches, currentRoundName } = await getClassificationPageData(params.competitionSlug);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna da Tabela de Classificação (2/3) */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
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
                  <tr key={s.team.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                         <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankIndicator(s.position)}`}>
                           {s.position}
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
                          <Link href={`/time/${s.team.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                            {s.team.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-800">{s.points}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.played}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.won}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.drawn}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-500">{s.lost}</td>
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

      {/* Coluna das Partidas da Rodada (1/3) */}
      <div className="lg:col-span-1">
        <RoundMatches matches={matches} roundName={currentRoundName} />
      </div>
    </div>
  );
}

export default ClassificationPage; 