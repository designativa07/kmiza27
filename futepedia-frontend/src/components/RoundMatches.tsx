import { Calendar, Clock, MapPin, Shield, Tv } from 'lucide-react';
import { Match } from '@/types/match'; // We'll need to define this type

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const RoundMatches = ({ matches, roundName, hideTitle = false }: { matches: Match[], roundName: string, hideTitle?: boolean }) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{roundName}</h3>
        <p className="text-gray-500">Nenhuma partida encontrada para esta rodada.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {!hideTitle && (
        <h3 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200">{roundName}</h3>
      )}
      <div className="divide-y divide-gray-200">
        {matches.map((match) => (
          <div key={match.id} className="p-4 grid grid-cols-3 items-center gap-4">
            {/* Time da Casa */}
            <div className="flex items-center justify-end space-x-3">
              <span className="text-sm font-semibold text-gray-700 text-right">{match.home_team.name}</span>
              <img src={match.home_team.logo_url} alt={match.home_team.name} className="h-8 w-8 object-contain" />
            </div>

            {/* Placar e Detalhes */}
            <div className="text-center">
              {match.status === 'FINISHED' ? (
                <div className="text-2xl font-bold text-gray-900">
                  <span>{match.home_score}</span>
                  <span className="mx-2">x</span>
                  <span>{match.away_score}</span>
                </div>
              ) : (
                <div className="text-sm font-bold text-gray-500">
                  <span>{formatDate(match.match_date)}</span>
                  <span className="mx-2">-</span>
                  <span>{formatTime(match.match_date)}</span>
                </div>
              )}
               {match.stadium && (
                <div className="flex items-center justify-center text-xs text-gray-400 mt-1">
                  <MapPin size={12} className="mr-1" />
                  <span>{match.stadium.name}</span>
                </div>
              )}
            </div>

            {/* Time Visitante */}
            <div className="flex items-center space-x-3">
              <img src={match.away_team.logo_url} alt={match.away_team.name} className="h-8 w-8 object-contain" />
              <span className="text-sm font-semibold text-gray-700">{match.away_team.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 