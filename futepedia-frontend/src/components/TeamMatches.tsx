'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Home, Plane } from 'lucide-react';
import { getTeamLogoUrl } from '@/lib/cdn';
import { getApiUrl } from '@/lib/config';

interface Team {
  id: number;
  name: string;
  logo_url?: string;
}

interface Stadium {
  id: number;
  name: string;
  city?: string;
}

interface Competition {
  id: number;
  name: string;
}

interface Round {
  id: number;
  name: string;
}

interface Match {
  id: number;
  match_date: string;
  status: string;
  home_score?: number;
  away_score?: number;
  home_team: Team;
  away_team: Team;
  competition: Competition;
  round?: Round;
  stadium?: Stadium;
}

interface TeamMatchesProps {
  teamId: number;
}

const MatchCard = ({ match, teamId }: { match: Match; teamId: number }) => {
  const isHome = match.home_team.id === teamId;
  const isFinished = match.status === 'finished';
  
  const date = new Date(match.match_date);
  const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const formattedTime = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });

  // Determinar resultado para jogos finalizados
  let resultClass = '';
  if (isFinished) {
    const teamScore = isHome ? match.home_score : match.away_score;
    const opponentScore = isHome ? match.away_score : match.home_score;
    
    if (teamScore !== undefined && opponentScore !== undefined) {
      if (teamScore > opponentScore) {
        resultClass = 'border-l-4 border-green-500 bg-green-50';
      } else if (teamScore < opponentScore) {
        resultClass = 'border-l-4 border-red-500 bg-red-50';
      } else {
        resultClass = 'border-l-4 border-yellow-500 bg-yellow-50';
      }
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${resultClass}`}>
      {/* Cabeçalho com data e local */}
      <div className="flex items-center justify-center mb-3 space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
        {isHome ? (
          <div className="flex items-center space-x-1 text-xs">
            <Home className="h-4 w-4 text-blue-500" />
            <span className="text-blue-600 font-medium">Em Casa</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-xs">
            <Plane className="h-4 w-4 text-orange-500" />
            <span className="text-orange-600 font-medium">Visitante</span>
          </div>
        )}
      </div>

      {/* Confronto */}
      <div className="flex items-center justify-center mb-3 space-x-2 sm:space-x-3">
        {/* Time da Casa: Nome + Escudo */}
        <div className={`flex items-center space-x-2 ${match.home_team.id === teamId ? 'font-bold' : ''}`}>
          <span className={`text-sm ${match.home_team.id === teamId ? 'text-blue-600' : 'text-gray-700'} text-right`} title={match.home_team.name}>
            {match.home_team.name.length > 12 ? `${match.home_team.name.substring(0, 12)}...` : match.home_team.name}
          </span>
          {match.home_team.logo_url && (
            <img 
              src={getTeamLogoUrl(match.home_team.logo_url)} 
              alt={match.home_team.name}
              className="h-7 w-7 object-contain flex-shrink-0"
            />
          )}
        </div>

        {/* Placar ou VS */}
        <div className="text-center px-2 flex-shrink-0">
          {isFinished && match.home_score !== undefined && match.away_score !== undefined ? (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">{match.home_score}</span>
              <span className="text-gray-400 font-medium">×</span>
              <span className="text-lg font-bold text-gray-900">{match.away_score}</span>
            </div>
          ) : (
            <div className="text-gray-500 font-medium text-sm px-2">×</div>
          )}
        </div>

        {/* Time Visitante: Escudo + Nome */}
        <div className={`flex items-center space-x-2 ${match.away_team.id === teamId ? 'font-bold' : ''}`}>
          {match.away_team.logo_url && (
            <img 
              src={getTeamLogoUrl(match.away_team.logo_url)} 
              alt={match.away_team.name}
              className="h-7 w-7 object-contain flex-shrink-0"
            />
          )}
          <span className={`text-sm ${match.away_team.id === teamId ? 'text-blue-600' : 'text-gray-700'} text-left`} title={match.away_team.name}>
            {match.away_team.name.length > 12 ? `${match.away_team.name.substring(0, 12)}...` : match.away_team.name}
          </span>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="text-xs text-gray-500 space-y-1 text-center">
        <div className="font-medium">{match.competition.name}</div>
        {match.round && <div>{match.round.name}</div>}
        {match.stadium && (
          <div className="flex items-center justify-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>{match.stadium.name}{match.stadium.city && `, ${match.stadium.city}`}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TeamMatches({ teamId }: TeamMatchesProps) {
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = getApiUrl();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        
        const [recentResponse, upcomingResponse] = await Promise.all([
          fetch(`${API_URL}/teams/${teamId}/recent-matches`),
          fetch(`${API_URL}/teams/${teamId}/upcoming-matches`)
        ]);

        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          setRecentMatches(recentData);
        }

        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          setUpcomingMatches(upcomingData);
        }
      } catch (err) {
        console.error('Erro ao buscar jogos:', err);
        setError('Erro ao carregar jogos');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [teamId, API_URL]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Jogos</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Jogos</h2>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Jogos</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimos Jogos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Últimos Jogos</h3>
          {recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} teamId={teamId} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum jogo recente encontrado</p>
            </div>
          )}
        </div>

        {/* Próximos Jogos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Próximos Jogos</h3>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} teamId={teamId} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum jogo agendado encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 