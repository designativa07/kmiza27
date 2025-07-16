'use client';

import { notFound } from 'next/navigation';
import { Shield, User, Calendar, Shirt, MapPin, Users, Trophy, BookOpen, UserCheck, PlayCircle, Info, Building, ExternalLink } from 'lucide-react';
import { getTeamLogoUrl, getStadiumImageUrl } from '@/lib/cdn';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { PlayerCard } from '@/components/PlayerCard';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Importar o mapa dinamicamente para evitar problemas de SSR
const SingleStadiumMap = dynamic(() => import('@/components/SingleStadiumMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><p className="text-gray-500">Carregando mapa...</p></div>
});

// Importar o componente de jogos dinamicamente
const TeamMatches = dynamic(() => import('@/components/TeamMatches'), { 
  ssr: false,
  loading: () => <div className="bg-white px-6 py-4 border-t border-gray-300"><div className="text-center py-6"><p className="text-gray-500">Carregando jogos...</p></div></div>
});

// Tipos (poderiam ser movidos para @/types)
interface Player {
  id: number;
  name: string;
  position?: string;
  date_of_birth?: string;
  image_url?: string;
  state?: string;
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
  url?: string;
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
    fetch(`${API_URL}/teams/${teamId}`),
    fetch(`${API_URL}/teams/${teamId}/players`),
  ]);

  if (!teamRes.ok) {
    throw new Error('Time não encontrado');
  }

  const team: Team = await teamRes.json();
  const players: PlayerHistory[] = playersRes.ok ? await playersRes.json() : [];
  
  return { team, players };
}

const SocialLinks = ({ team }: { team: Team }) => {
  if (!team.social_media || Object.values(team.social_media).every(url => !url)) {
    return null;
  }

  return (
    <div className="flex space-x-3">
      {team.social_media.instagram_url && (
        <a href={team.social_media.instagram_url} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-gray-500 hover:text-pink-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.07-1.645-.07-4.85s.012-3.584.07-4.85c.148-3.225 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.441 1.441 1.441 1.441-.645 1.441-1.441-.645-1.44-1.441-1.44z"/></svg>
        </a>
      )}
      {team.social_media.tiktok_url && (
        <a href={team.social_media.tiktok_url} target="_blank" rel="noopener noreferrer" title="TikTok" className="text-gray-500 hover:text-black">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.38 1.92-3.54 2.96-5.85 2.86-2.3-.1-4.44-1.14-5.82-2.95-1.2-1.57-1.85-3.45-1.8-5.36.05-1.8.61-3.51 1.62-4.94.94-1.32 2.26-2.29 3.78-2.76.03-.01 1.31-.42 1.31-.42v4.03c-1.11.41-2.12.92-2.98 1.62-1.15.94-1.85 2.36-1.85 3.85.03 1.73 1.12 3.19 2.65 3.73.9.31 1.84.45 2.77.4.73-.04 1.46-.21 2.12-.51.8-.37 1.45-.93 1.95-1.62.53-.72.86-1.59.96-2.52.03-2.56.03-5.12.01-7.68-.01-1.28-.48-2.51-1.25-3.48-1.07-1.35-2.66-2.13-4.32-2.2z"/></svg>
        </a>
      )}
      {team.social_media.youtube_url && (
        <a href={team.social_media.youtube_url} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-gray-500 hover:text-red-600">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        </a>
      )}
      {team.social_media.official_site_url && (
        <a href={team.social_media.official_site_url} target="_blank" rel="noopener noreferrer" title="Site Oficial" className="text-gray-500 hover:text-blue-600">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 16.518l-3.536-3.536 1.414-1.414 2.122 2.121 4.242-4.242 1.414 1.414-5.656 5.657z"/></svg>
        </a>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, children, icon: Icon }: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active 
        ? 'border-indigo-500 text-indigo-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    <Icon className="h-3 w-3 md:h-4 md:w-4" />
    <span>{children}</span>
  </button>
);

const TeamTabs = ({ team, players }: { team: Team; players: PlayerHistory[] }) => {
  const [activeTab, setActiveTab] = useState<'jogos' | 'elenco' | 'info' | 'titulos' | 'estadio'>('jogos');

  const tabs = [
    { id: 'jogos' as const, label: 'Jogos', icon: PlayCircle },
    { id: 'elenco' as const, label: 'Elenco', icon: UserCheck },
    { id: 'info' as const, label: 'Info', icon: Info },
    { id: 'titulos' as const, label: 'Títulos', icon: Trophy },
    { id: 'estadio' as const, label: 'Estádio', icon: Building },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'jogos':
        return (
          <div>
            <TeamMatches teamId={team.id} />
          </div>
        );
      
      case 'elenco':
        return (
          <div className="bg-white p-3 md:p-6 border-t border-gray-300">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-2 md:mb-4">Elenco Principal</h2>
            {players.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {players.map((item) => (
                  <PlayerCard 
                    key={item.player.id} 
                    player={{
                      ...item.player,
                      state: 'active' // Assumindo que jogadores no elenco estão ativos
                    }}
                    jerseyNumber={item.jersey_number}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <h3 className="text-lg md:text-xl font-medium text-gray-900">Elenco Indisponível</h3>
                <p className="mt-2 text-sm md:text-md text-gray-500">
                  Não foi possível carregar o elenco deste time no momento.
                </p>
              </div>
            )}
          </div>
        );
      
      case 'info':
        return (
          <div className="bg-white p-3 md:p-6 border-t border-gray-300">
            {/* História */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">História</h2>
              {team.history ? (
                <p className="text-gray-600 whitespace-pre-wrap text-sm md:text-base">{team.history}</p>
              ) : (
                <p className="text-gray-500 text-center text-sm md:text-base">Informações sobre a história do time não estão disponíveis no momento.</p>
              )}
            </div>
            
            {/* Informações */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">Informações</h2>
              {team.information ? (
                <p className="text-gray-600 whitespace-pre-wrap text-sm md:text-base">{team.information}</p>
              ) : (
                <p className="text-gray-500 text-center text-sm md:text-base">Informações adicionais sobre o time não estão disponíveis no momento.</p>
              )}
            </div>
          </div>
        );
      
      case 'titulos':
        return (
          <div className="bg-white p-3 md:p-6 border-t border-gray-300">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4">Títulos</h2>
            <p className="text-gray-500 text-center text-sm md:text-base">Informações sobre títulos serão adicionadas em breve.</p>
          </div>
        );
      
      case 'estadio':
        return team.stadium ? (
          <div className="bg-white p-3 md:p-6 border-t border-gray-300">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 mr-2 text-indigo-600" />
              Estádio
            </h2>
            
            <div className="flex flex-col md:flex-row md:space-x-6">
              {/* Imagem do estádio */}
              <div className="md:w-1/3 mb-4 md:mb-0">
                {team.stadium.image_url ? (
                  <img 
                    src={getStadiumImageUrl(team.stadium.image_url)} 
                    alt={`${team.stadium.name}`} 
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-200 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Informações do estádio */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{team.stadium.name}</h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {(team.stadium.city || team.stadium.state) && (
                    <p className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {team.stadium.city}{team.stadium.city && team.stadium.state ? ', ' : ''}{team.stadium.state}
                      {team.stadium.country && team.stadium.country !== 'Brasil' && `, ${team.stadium.country}`}
                    </p>
                  )}
                  
                  {team.stadium.capacity && (
                    <p className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Capacidade: {team.stadium.capacity.toLocaleString()} pessoas
                    </p>
                  )}
                  
                  {team.stadium.opened_year && (
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Inaugurado em: {team.stadium.opened_year}
                    </p>
                  )}
                </div>
                
                {team.stadium.history && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">História</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{team.stadium.history}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mapa do estádio (se tiver coordenadas) */}
            {team.stadium.latitude && team.stadium.longitude &&
              !isNaN(Number(team.stadium.latitude)) && !isNaN(Number(team.stadium.longitude)) &&
              Number(team.stadium.latitude) >= -90 && Number(team.stadium.latitude) <= 90 &&
              Number(team.stadium.longitude) >= -180 && Number(team.stadium.longitude) <= 180 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Localização
                </h4>
                <SingleStadiumMap 
                  stadium={{
                    id: team.stadium.id,
                    name: team.stadium.name,
                    city: team.stadium.city,
                    state: team.stadium.state,
                    latitude: Number(team.stadium.latitude),
                    longitude: Number(team.stadium.longitude),
                    capacity: team.stadium.capacity
                  }}
                  height="h-48"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-3 md:p-6 border-t border-gray-300">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 mr-2 text-indigo-600" />
              Estádio
            </h2>
            <p className="text-gray-500 text-center text-sm md:text-base">Informações sobre o estádio não estão disponíveis no momento.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex space-x-0 md:space-x-1 border-b border-gray-200 bg-white px-2 md:px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default function TeamPage({ params }: { params: { teamId: string } }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<PlayerHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTeamData(params.teamId);
        setTeam(data.team);
        setPlayers(data.players);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.teamId]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <HeaderWithLogo showBackToHome={true} />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      <HeaderWithLogo showBackToHome={true} />
      
      <main className="max-w-7xl mx-auto px-2 md:px-4 lg:px-8 py-1 md:py-2">
        <div className="flex items-center justify-between bg-white p-3 md:p-6">
          <div className="flex items-center space-x-3 md:space-x-4">
            {team.logo_url ? (
              <img 
                src={getTeamLogoUrl(team.logo_url)} 
                alt={`${team.name} logo`} 
                className="h-12 w-12 md:h-16 md:w-16 object-contain"
              />
            ) : (
              <Shield className="h-12 w-12 md:h-16 md:w-16 text-gray-300" />
            )}
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-sm md:text-md text-gray-500">{team.city}, {team.country}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <SocialLinks team={team} />
          </div>
        </div>

        {/* Sistema de Abas */}
        <TeamTabs team={team} players={players} />
      </main>
    </div>
  );
} 