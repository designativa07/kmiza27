import { ShieldCheck } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position: string;
}

interface Team {
  id: number;
  name: string;
  logo_url: string;
}

export interface TopScorer {
  player: Player;
  team: Team;
  goals: number;
}

interface TopScorersTableProps {
  topScorers: TopScorer[];
}

export const TopScorersTable = ({ topScorers }: TopScorersTableProps) => {
  if (!topScorers || topScorers.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-900">Artilharia Indisponível</h3>
        <p className="mt-2 text-md text-gray-500">
          Ainda não há dados de artilharia para este campeonato.
        </p>
      </div>
    );
  }

  const tableHeaders = ['#', 'Jogador', 'Time', 'Gols'];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {tableHeaders.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                  index === 0 ? 'text-left' : index < 3 ? 'text-left' : 'text-center'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {topScorers.map((scorer, index) => (
            <tr key={scorer.player.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">{index + 1}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm font-bold text-gray-900">{scorer.player.name}</div>
                <div className="text-xs text-gray-500">{scorer.player.position}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center">
                  {scorer.team.logo_url ? (
                    <img className="h-6 w-6 rounded-full object-contain mr-3" src={scorer.team.logo_url} alt={scorer.team.name} />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-gray-300 mr-3" />
                  )}
                  <span className="text-sm text-gray-800">{scorer.team.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-center text-lg font-bold text-gray-800">
                {scorer.goals}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 