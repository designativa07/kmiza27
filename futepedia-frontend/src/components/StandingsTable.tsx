import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
                           <img className="h-8 w-8 object-contain" src={s.team.logo_url} alt={s.team.name} />
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
    </div>
  );
} 