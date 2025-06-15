import { notFound } from 'next/navigation';
import { Shield, User, Calendar, Shirt } from 'lucide-react';

// Tipos (poderiam ser movidos para @/types)
interface Player {
  id: number;
  name: string;
  position?: string;
  date_of_birth?: string;
  image_url?: string;
}

interface PlayerHistory {
  player: Player;
  jersey_number?: string;
}

interface Team {
  id:number;
  name: string;
  logo_url: string;
  city?: string;
  country?: string;
}

type Props = {
  params: { teamId: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getTeamData(teamId: string) {
  const [teamRes, playersRes] = await Promise.all([
    fetch(`${API_URL}/teams/${teamId}`, { next: { revalidate: 3600 } }),
    fetch(`${API_URL}/teams/${teamId}/players`, { next: { revalidate: 3600 } }),
  ]);

  if (!teamRes.ok) {
    notFound();
  }

  const team: Team = await teamRes.json();
  const players: PlayerHistory[] = playersRes.ok ? await playersRes.json() : [];
  
  return { team, players };
}

const PlayerCard = ({ item }: { item: PlayerHistory }) => {
  const player = item.player;
  const age = player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : null;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
      <div className="bg-gray-100 h-32 flex items-center justify-center relative">
        {player.image_url ? (
          <img src={player.image_url} alt={player.name} className="h-full w-full object-cover" />
        ) : (
          <User className="h-16 w-16 text-gray-400" />
        )}
        {item.jersey_number && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">
            {item.jersey_number}
          </div>
        )}
      </div>
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-bold text-gray-900">{player.name}</h3>
        <p className="text-sm text-gray-600">{player.position || 'Não especificada'}</p>
        {age && (
           <p className="text-xs text-gray-500 mt-1">{age} anos</p>
        )}
      </div>
    </div>
  );
};


export default async function TeamPage({ params }: Props) {
  const { team, players } = await getTeamData(params.teamId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-white p-6 rounded-lg shadow-lg mb-8">
        {team.logo_url ? (
          <img src={team.logo_url} alt={`${team.name} logo`} className="h-24 w-24 object-contain" />
        ) : (
          <Shield className="h-24 w-24 text-gray-300" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-md text-gray-500">{team.city}, {team.country}</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Elenco Principal</h2>

      {players.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {players.map((item) => (
            <PlayerCard key={item.player.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-xl font-medium text-gray-900">Elenco Indisponível</h3>
          <p className="mt-2 text-md text-gray-500">
            Não foi possível carregar o elenco deste time no momento.
          </p>
        </div>
      )}
    </div>
  );
} 