import { notFound } from 'next/navigation';
import { Shield, User, Calendar, Shirt, MapPin, Users } from 'lucide-react';
import { getTeamLogoUrl, getPlayerImageUrl, getStadiumImageUrl } from '@/lib/cdn';
import { Header } from '@/components/Header';
import dynamic from 'next/dynamic';

// Importar o mapa dinamicamente para evitar problemas de SSR
const SingleStadiumMap = dynamic(() => import('@/components/SingleStadiumMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center"><p className="text-gray-500">Carregando mapa...</p></div>
});

// Importar o componente de jogos dinamicamente
const TeamMatches = dynamic(() => import('@/components/TeamMatches'), { 
  ssr: false,
  loading: () => <div className="bg-white p-6 rounded-lg shadow-lg"><h2 className="text-2xl font-bold text-gray-800 mb-4">Jogos</h2><div className="text-center py-8"><p className="text-gray-500">Carregando jogos...</p></div></div>
});

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

interface Stadium {
  id: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  opened_year?: number;
  image_url?: string;
  history?: string;
  latitude?: number;
  longitude?: number;
}

interface Team {
  id: number;
  name: string;
  logo_url: string;
  city?: string;
  state?: string;
  country?: string;
  history?: string;
  information?: string;
  stadium?: Stadium;
  social_media?: {
    instagram_url?: string;
    tiktok_url?: string;
    youtube_url?: string;
    official_site_url?: string;
  };
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
          <img 
            src={getPlayerImageUrl(player.image_url)} 
            alt={player.name} 
            className="h-full w-full object-cover"
          />
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

const SocialLinks = ({ team }: { team: Team }) => {
  if (!team.social_media || Object.values(team.social_media).every(url => !url)) {
    return null;
  }

  return (
    <div className="flex space-x-4 mt-2">
      {team.social_media.instagram_url && (
        <a href={team.social_media.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-gray-500 hover:text-pink-500">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>
        </a>
      )}
      {team.social_media.tiktok_url && (
        <a href={team.social_media.tiktok_url} target="_blank" rel="noopener noreferrer" title="TikTok" className="text-gray-500 hover:text-black">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.38 1.92-3.54 2.96-5.85 2.86-2.3-.1-4.44-1.14-5.82-2.95-1.2-1.57-1.85-3.45-1.8-5.36.05-1.8.61-3.51 1.62-4.94.94-1.32 2.26-2.29 3.78-2.76.03-.01 1.31-.42 1.31-.42v4.03c-1.11.41-2.12.92-2.98 1.62-1.15.94-1.85 2.36-1.85 3.85.03 1.73 1.12 3.19 2.65 3.73.9.31 1.84.45 2.77.4.73-.04 1.46-.21 2.12-.51.8-.37 1.45-.93 1.95-1.62.53-.72.86-1.59.96-2.52.03-2.56.03-5.12.01-7.68-.01-1.28-.48-2.51-1.25-3.48-1.07-1.35-2.66-2.13-4.32-2.2z"/></svg>
        </a>
      )}
      {team.social_media.youtube_url && (
        <a href={team.social_media.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-gray-500 hover:text-red-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      )}
      {team.social_media.official_site_url && (
        <a href={team.social_media.official_site_url} target="_blank" rel="noopener noreferrer" title="Site Oficial" className="text-gray-500 hover:text-blue-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 16.518l-3.536-3.536 1.414-1.414 2.122 2.121 4.242-4.242 1.414 1.414-5.656 5.657z"/></svg>
        </a>
      )}
    </div>
  );
};

const StadiumCard = ({ stadium }: { stadium: Stadium }) => {
  // Verificar se o estádio tem coordenadas válidas para mostrar o mapa
  const hasValidCoordinates = stadium.latitude && stadium.longitude &&
    !isNaN(Number(stadium.latitude)) && !isNaN(Number(stadium.longitude)) &&
    Number(stadium.latitude) >= -90 && Number(stadium.latitude) <= 90 &&
    Number(stadium.longitude) >= -180 && Number(stadium.longitude) <= 180;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <MapPin className="h-6 w-6 mr-2 text-indigo-600" />
        Estádio
      </h2>
      
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Imagem do estádio */}
        <div className="md:w-1/3 mb-4 md:mb-0">
          {stadium.image_url ? (
            <img 
              src={getStadiumImageUrl(stadium.image_url)} 
              alt={`${stadium.name}`} 
              className="w-full h-48 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Informações do estádio */}
        <div className="md:w-2/3">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{stadium.name}</h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            {(stadium.city || stadium.state) && (
              <p className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {stadium.city}{stadium.city && stadium.state ? ', ' : ''}{stadium.state}
                {stadium.country && stadium.country !== 'Brasil' && `, ${stadium.country}`}
              </p>
            )}
            
            {stadium.capacity && (
              <p className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Capacidade: {stadium.capacity.toLocaleString()} pessoas
              </p>
            )}
            
            {stadium.opened_year && (
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Inaugurado em: {stadium.opened_year}
              </p>
            )}
          </div>
          
          {stadium.history && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2">História</h4>
              <p className="text-sm text-gray-600 line-clamp-3">{stadium.history}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Mapa do estádio (se tiver coordenadas) */}
      {hasValidCoordinates && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Localização
          </h4>
          <SingleStadiumMap 
            stadium={{
              id: stadium.id,
              name: stadium.name,
              city: stadium.city,
              state: stadium.state,
              latitude: Number(stadium.latitude),
              longitude: Number(stadium.longitude),
              capacity: stadium.capacity
            }}
            height="h-64"
          />
        </div>
      )}
    </div>
  );
};

export default async function TeamPage({ params }: Props) {
  const { team, players } = await getTeamData(params.teamId);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header showBackToHome={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-white p-6 rounded-lg shadow-lg mb-8">
        {team.logo_url ? (
          <img 
            src={getTeamLogoUrl(team.logo_url)} 
            alt={`${team.name} logo`} 
            className="h-24 w-24 object-contain"
          />
        ) : (
          <Shield className="h-24 w-24 text-gray-300" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-md text-gray-500">{team.city}, {team.country}</p>
          <SocialLinks team={team} />
        </div>
      </div>

      {/* Seção de Jogos */}
      <div className="mb-8">
        <TeamMatches teamId={team.id} />
      </div>

      {team.history && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">História</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{team.history}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {team.information && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Informações</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{team.information}</p>
          </div>
        )}

        {team.stadium && (
          <StadiumCard stadium={team.stadium} />
        )}
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
      </main>
    </div>
  );
} 