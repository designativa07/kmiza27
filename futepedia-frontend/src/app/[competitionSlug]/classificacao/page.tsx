import type { NextPage } from 'next';
import { ShieldCheck, ArrowDown, ArrowUp } from 'lucide-react';
import { RoundMatches } from '@/components/RoundMatches';
import { Match } from '@/types/match';
import Link from 'next/link';
import { StandingsTable } from '@/components/StandingsTable';
import { RoundNavigator } from '@/components/RoundNavigator';

// Tipos de dados
interface Competition {
  id: number;
  name: string;
  slug: string;
  goal_difference: number;
  form?: string;
  group_name?: string;
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
  group_name?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getClassificationPageData(slug: string) {
  // 1. Obter ID da competição
  const competitionResponse = await fetch(`${API_URL}/competitions/slug/${slug}`, { next: { revalidate: 60 } });
  if (!competitionResponse.ok) throw new Error('Competição não encontrada');
  const competition: { id: number; name: string } = await competitionResponse.json();
  const competitionId = competition.id;

  // 2. Fazer chamadas em paralelo
  const [standingsResponse, roundsResponse, currentRoundResponse] = await Promise.all([
    fetch(`${API_URL}/standings/competition/${competitionId}`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/standings/competition/${competitionId}/rounds`, { next: { revalidate: 60 } }),
    fetch(`${API_URL}/standings/competition/${competitionId}/current-round`, { next: { revalidate: 60 } })
  ]);

  if (!standingsResponse.ok) throw new Error('Tabela de classificação indisponível');
  const standings: Standing[] = await standingsResponse.json();
  
  const rounds: Round[] = roundsResponse.ok ? await roundsResponse.json() : [];
  const currentRound: Round | null = currentRoundResponse.ok ? await currentRoundResponse.json() : null;

  let initialMatches: Match[] = [];
  let initialRoundId: number | null = null;
  let initialRoundName: string = 'Rodada';

  if (currentRound) {
    initialRoundId = currentRound.id;
    initialRoundName = currentRound.name;
    const matchesResponse = await fetch(`${API_URL}/standings/competition/${competitionId}/round/${currentRound.id}/matches`, { next: { revalidate: 60 } });
    if (matchesResponse.ok) {
      initialMatches = await matchesResponse.json();
    }
  } else if (rounds && rounds.length > 0) {
    // Fallback: se não houver rodada atual, pega a última rodada da lista
    const latestRound = rounds[rounds.length - 1];
    initialRoundId = latestRound.id;
    initialRoundName = latestRound.name;
    const matchesResponse = await fetch(`${API_URL}/standings/competition/${competitionId}/round/${latestRound.id}/matches`, { next: { revalidate: 60 } });
    if (matchesResponse.ok) {
      initialMatches = await matchesResponse.json();
    }
  }

  return { standings, initialMatches, rounds, competitionId, initialRoundId, initialRoundName };
}

// O componente da página agora usa o tipo 'NextPage' com as nossas Props
const ClassificationPage: NextPage<Props> = async ({ params }) => {
  const { standings, initialMatches, rounds, competitionId, initialRoundId, initialRoundName } = await getClassificationPageData(params.competitionSlug);

  const groupedStandings = standings.reduce((acc, s) => {
    const groupName = s.group_name || 'Classificação Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(s);
    return acc;
  }, {} as Record<string, typeof standings>);

  const hasGroups = Object.keys(groupedStandings).length > 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna da Tabela de Classificação (2/3) */}
      <div className="lg:col-span-2 space-y-6">
        {standings.length > 0 ? (
          Object.entries(groupedStandings).map(([groupName, groupStandings]) => (
            <div key={groupName}>
              {hasGroups && (
                <h2 className="text-xl font-bold text-gray-800 mb-3">{groupName}</h2>
              )}
              <StandingsTable standings={groupStandings} />
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-lg text-center py-16">
            <h3 className="text-xl font-medium text-gray-900">Tabela Indisponível</h3>
            <p className="mt-2 text-md text-gray-500">
              Ainda não há dados de classificação para este campeonato.
            </p>
          </div>
        )}
      </div>

      {/* Coluna das Partidas da Rodada (1/3) */}
      <div className="lg:col-span-1">
        <RoundNavigator 
          initialRounds={rounds}
          competitionId={competitionId}
          initialMatches={initialMatches}
          initialRoundId={initialRoundId}
          initialRoundName={initialRoundName}
        />
      </div>
    </div>
  );
}

export default ClassificationPage; 