import { User, Shirt } from 'lucide-react';
import { getPlayerImageUrl } from '@/lib/cdn';
import Link from 'next/link';

interface Player {
  id: number;
  name: string;
  position?: string;
  date_of_birth?: string;
  image_url?: string;
  state?: string;
}

interface PlayerCardProps {
  player: Player;
  jerseyNumber?: string | number;
  teamName?: string;
  showTeamName?: boolean;
}

export const PlayerCard = ({ player, jerseyNumber, teamName, showTeamName = false }: PlayerCardProps) => {
  const age = player.date_of_birth ? new Date().getFullYear() - new Date(player.date_of_birth).getFullYear() : null;
  const isActive = player.state?.toLowerCase() === 'active';

  return (
    <Link href={`/jogadores/${player.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center relative">
        {player.image_url ? (
          <img src={getPlayerImageUrl(player.image_url)} alt={player.name} className="h-full w-full object-cover" />
        ) : (
          <User className="h-12 w-12 text-gray-300" />
        )}
        
        {/* Bolinha verde para status ativo */}
        {isActive && (
          <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        )}
        
        {/* Número da camisa */}
        {jerseyNumber && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
            {jerseyNumber}
          </div>
        )}
      </div>
      
      <div className="p-2 md:p-3">
        <h3 className="font-bold text-xs md:text-sm truncate group-hover:text-indigo-600">{player.name}</h3>
        
        <div className="flex items-center text-xs text-gray-500 mt-0.5 md:mt-1">
          <Shirt className="h-3 w-3 mr-1" />
          <span>{player.position || 'Não especificada'}</span>
        </div>
        
        {age && (
          <div className="text-xs text-gray-500 mt-0.5">
            {age} anos
          </div>
        )}
        
        {/* Time atual (se fornecido e solicitado) */}
        {showTeamName && teamName && (
          <div className="text-xs text-gray-600 font-medium mt-1 truncate">
            {teamName}
          </div>
        )}
      </div>
    </div>
    </Link>
  );
}; 