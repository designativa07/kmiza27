import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { getCdnImageUrl, getTeamLogoUrl } from '@/lib/cdn-simple';

// Reutilizando a interface 'Standing' que já existe na página de classificação
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
}

interface StandingsTableProps {
  standings: Standing[];
}

const getRankIndicator = (rank: number) => {
    // A lógica pode ser expandida no futuro com base em regras da competição
    if (rank <= 4) return 'bg-blue-100 text-blue-800'; // Ex: Vaga direta
    if (rank >= 17) return 'bg-red-100 text-red-800'; // Ex: Rebaixamento
    return 'bg-gray-100 text-gray-800';
};

const getGoalDifferenceColor = (goalDifference: number) => {
    if (goalDifference > 0) return 'text-green-600 font-medium';
    if (goalDifference < 0) return 'text-red-600 font-medium';
    return 'text-gray-700 font-medium';
};

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

export const StandingsTable = ({ standings }: StandingsTableProps) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm -mx-2 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders.map(header => (
                  <th
                    key={header.label}
                    scope="col"
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 text-${header.align} text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider ${header.className || ''}`}
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
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                       <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${getRankIndicator(s.position)}`}>
                         {s.position}
                       </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6">
                        {s.team.logo_url ? (
                           <img 
                             src={getTeamLogoUrl(s.team.logo_url)}
                             alt={s.team.name} 
                             className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                           />
                        ) : (
                          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="ml-2 sm:ml-4">
                        <Link href={`/time/${s.team.id}`} className="text-xs sm:text-sm font-medium text-gray-900 hover:text-indigo-600 leading-tight">
                          {s.team.name}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm font-bold text-gray-800">{s.points}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.played}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.won}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.drawn}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.lost}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.goals_for}</td>
                  <td className="px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">{s.goals_against}</td>
                  <td className={`px-2 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm ${getGoalDifferenceColor(s.goal_difference)}`}>{s.goal_difference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
} 