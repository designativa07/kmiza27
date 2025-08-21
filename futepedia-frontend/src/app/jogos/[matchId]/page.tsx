'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Trophy, Clock, Users, TrendingUp } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { getTeamLogoUrl, getStadiumImageUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';
import dynamic from 'next/dynamic';
import { MatchPrediction } from '@/components/MatchPrediction';
import MatchBroadcastSection from '@/components/MatchBroadcastSection';

// Importar componente de mapa dinamicamente
const SingleStadiumMap = dynamic(() => import('@/components/SingleStadiumMap'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center"><p className="text-gray-500">Carregando mapa...</p></div>
});

// Interfaces
interface Team {
  id: number;
  name: string;
  logo_url?: string;
  city?: string;
  state?: string;
}

interface Stadium {
  id: number;
  name: string;
  city?: string;
  state?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  image_url?: string;
}

interface Competition {
  id: number;
  name: string;
  slug?: string;
  season?: string;
}

interface Round {
  id: number;
  name: string;
  round_number?: number;
}

interface Match {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties: number | null;
  away_score_penalties: number | null;
  match_date: string;
  status: string;
  competition: Competition;
  round?: Round;
  stadium?: Stadium;
  broadcast_channels?: string | string[];
  leg?: 'first_leg' | 'second_leg' | null;
  tie_id?: string;
  is_knockout?: boolean;
}

interface MatchBroadcast {
  id: number;
  channel: {
    id: number;
    name: string;
    channel_link?: string;
    active: boolean;
  };
}

interface MatchData extends Match {
  broadcasts: MatchBroadcast[];
}

interface Props {
  params: { matchId: string };
}

// Função para buscar dados do jogo e da transmissão
async function getMatchData(matchId: string): Promise<MatchData | null> {
  try {
    const [matchResponse, broadcastResponse] = await Promise.all([
      fetch(`${getApiUrl()}/matches/${matchId}`, { cache: 'no-store' }),
      fetch(`${getApiUrl()}/matches/${matchId}/broadcasts`, { cache: 'no-store' })
    ]);
    
    if (!matchResponse.ok) return null;
    
    const match: Match = await matchResponse.json();
    const broadcasts: MatchBroadcast[] = broadcastResponse.ok ? await broadcastResponse.json() : [];
    
    return { ...match, broadcasts };
  } catch (error) {
    console.error('Erro ao carregar dados do jogo:', error);
    return null;
  }
}

// Função para formatar data
function formatMatchDate(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      timeZone: 'America/Sao_Paulo' 
    }),
    time: date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  };
}



// Componente de status do jogo
const MatchStatus = ({ status, homeScore, awayScore }: { 
  status: string; 
  homeScore: number | null; 
  awayScore: number | null; 
}) => {
  const getStatusInfo = () => {
    switch (status?.toLowerCase()) {
      case 'finished':
      case 'fim':
        return { text: 'Encerrado', color: 'text-gray-600 bg-gray-100' };
      case 'live':
      case 'ao vivo':
        return { text: 'Ao Vivo', color: 'text-red-600 bg-red-100' };
      case 'scheduled':
      case 'agendado':
        return { text: 'Agendado', color: 'text-blue-600 bg-blue-100' };
      case 'to_confirm':
      case 'a confirmar':
        return { text: 'A Confirmar', color: 'text-orange-600 bg-orange-100' };
      default:
        return { text: status || 'A definir', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const statusInfo = getStatusInfo();
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
      {statusInfo.text}
    </span>
  );
};

// Componente principal da página
export default function MatchPage({ params }: Props) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getMatchData(params.matchId);
      setMatch(data);
      setLoading(false);
    };

    fetchData();
  }, [params.matchId]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo showBackToHome={true} />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">Carregando detalhes do jogo...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    notFound();
  }

  const { date, time } = formatMatchDate(match.match_date);
  const hasScore = match.home_score !== null && match.away_score !== null;
  const hasPenalties = match.home_score_penalties !== null && match.away_score_penalties !== null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo showBackToHome={true} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho do Jogo */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            {/* Status e Competição */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="text-lg font-semibold text-gray-900">
                  {match.competition.name}
                </span>
                {match.competition.season && (
                  <span className="text-sm text-gray-500">
                    {match.competition.season}
                  </span>
                )}
              </div>
              <MatchStatus 
                status={match.status} 
                homeScore={match.home_score} 
                awayScore={match.away_score} 
              />
            </div>

            {/* Rodada */}
            {match.round && (
              <div className="mb-6">
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {match.round.name}
                </span>
              </div>
            )}

            {/* Confronto Principal */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-4">
                                 {/* Time da Casa */}
                 <div className="flex flex-col items-center space-y-2">
                   <img
                     src={getTeamLogoUrl(match.home_team.logo_url)}
                     alt={`${match.home_team.name} logo`}
                     className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                   />
                   <h2 className="text-base sm:text-xl font-bold text-gray-900 text-center">
                     {match.home_team.name}
                   </h2>
                   {match.home_team.city && (
                     <p className="text-xs sm:text-sm text-gray-500">{match.home_team.city}</p>
                   )}
                 </div>

                 {/* Placar */}
                 <div className="text-center">
                   {hasScore ? (
                     <div className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                       {match.home_score} × {match.away_score}
                     </div>
                   ) : (
                     <div className="text-2xl sm:text-4xl font-bold text-gray-400 mb-2">
                       × 
                     </div>
                   )}
                   
                   {/* Pênaltis */}
                   {hasPenalties && (
                     <div className="text-sm sm:text-lg text-gray-600">
                       Pênaltis: {match.home_score_penalties} × {match.away_score_penalties}
                     </div>
                   )}
                 </div>

                 {/* Time Visitante */}
                 <div className="flex flex-col items-center space-y-2">
                   <img
                     src={getTeamLogoUrl(match.away_team.logo_url)}
                     alt={`${match.away_team.name} logo`}
                     className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                   />
                   <h2 className="text-base sm:text-xl font-bold text-gray-900 text-center">
                     {match.away_team.name}
                   </h2>
                   {match.away_team.city && (
                     <p className="text-xs sm:text-sm text-gray-500">{match.away_team.city}</p>
                   )}
                 </div>
              </div>
              
              {/* Data e Hora - Movido para o card principal */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-center space-x-6 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="capitalize">{date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-lg font-semibold">{time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Predição da Partida */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <MatchPrediction matchId={match.id} />
        </div>

                {/* Transmissão - Agora ocupa toda a largura */}
        <div className="mb-6">
          <MatchBroadcastSection match={match} />
        </div>

        {/* Estádio */}
        {match.stadium && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                Estádio
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {match.stadium.name}
                  </h4>
                  
                  <div className="space-y-2 text-gray-600">
                    {match.stadium.city && (
                      <p className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {match.stadium.city}
                        {match.stadium.state && `, ${match.stadium.state}`}
                      </p>
                    )}
                    
                    {match.stadium.capacity && (
                      <p className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Capacidade: {match.stadium.capacity.toLocaleString('pt-BR')} pessoas
                      </p>
                    )}
                  </div>
                </div>

                {/* Imagem do Estádio */}
                {match.stadium.image_url && (
                  <div>
                    <img
                      src={getStadiumImageUrl(match.stadium.image_url)}
                      alt={`${match.stadium.name} - Estádio`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mapa do Estádio */}
            {match.stadium.latitude && 
             match.stadium.longitude && 
             !isNaN(Number(match.stadium.latitude)) && 
             !isNaN(Number(match.stadium.longitude)) && (
              <div className="border-t border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Localização
                </h4>
                <SingleStadiumMap 
                  stadium={{
                    id: match.stadium.id,
                    name: match.stadium.name,
                    city: match.stadium.city || '',
                    state: match.stadium.state,
                    latitude: Number(match.stadium.latitude),
                    longitude: Number(match.stadium.longitude),
                    capacity: match.stadium.capacity
                  }}
                  height="h-48"
                />
              </div>
            )}
          </div>
        )}


      </main>
    </div>
  );
} 