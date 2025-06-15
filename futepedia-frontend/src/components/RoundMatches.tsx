import { Calendar, Clock, MapPin, Shield, Tv, ExternalLink } from 'lucide-react';
import { Match } from '@/types/match';

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
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
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{roundName}</h3>
        <p className="text-gray-500">Nenhuma partida encontrada para esta rodada.</p>
      </div>
    );
  }

  // Agrupar partidas por grupo
  const groupedMatches = matches.reduce((acc, match) => {
    const groupName = match.group_name || 'Geral';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const hasGroups = Object.keys(groupedMatches).length > 1;

  return (
    <div className="bg-white rounded-lg">
      {!hideTitle && (
        <h3 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200">{roundName}</h3>
      )}
      
      {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
        <div key={groupName}>
          {hasGroups && (
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700">
                {groupName === 'Geral' ? 'Partidas' : `Grupo ${groupName}`}
              </h4>
            </div>
          )}
          
          <div className="divide-y divide-gray-200">
            {groupMatches.map((match) => (
              <div key={match.id} className="p-4">
                {/* Linha principal: Times e Placar/Horário */}
                <div className="grid grid-cols-3 items-center gap-2 mb-2">
                  {/* Time da Casa */}
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-sm font-semibold text-gray-700 text-right">{match.home_team.name}</span>
                    <img 
                      src={match.home_team.logo_url || '/default-team-logo.png'} 
                      alt={match.home_team.name} 
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-team-logo.png';
                      }}
                    />
                  </div>

                  {/* Placar/Horário e X */}
                  <div className="text-center">
                    {(match.status === 'FINISHED' || match.status === 'finished') ? (
                      <div className="text-2xl font-bold text-gray-900">
                        <span>{match.home_score}</span>
                        <span className="mx-2 text-gray-400">×</span>
                        <span>{match.away_score}</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-2xl font-bold text-gray-400 mb-1">×</div>
                        <div className="text-xs font-bold text-gray-500">
                          <div>{formatDate(match.match_date)}</div>
                          <div>{formatTime(match.match_date)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Visitante */}
                  <div className="flex items-center space-x-2">
                    <img 
                      src={match.away_team.logo_url || '/default-team-logo.png'} 
                      alt={match.away_team.name} 
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-team-logo.png';
                      }}
                    />
                    <span className="text-sm font-semibold text-gray-700">{match.away_team.name}</span>
                  </div>
                </div>

                {/* Linha de informações adicionais */}
                <div className="flex flex-col items-center space-y-1 text-xs text-gray-500">
                  {/* Estádio */}
                  {match.stadium && (
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      <span>{match.stadium.name}</span>
                      {match.stadium.city && <span className="ml-1">({match.stadium.city})</span>}
                    </div>
                  )}

                  {/* Canais de TV */}
                  {match.broadcast_channels && (
                    <div className="flex items-center">
                      <Tv size={12} className="mr-1" />
                      <span>
                        {Array.isArray(match.broadcast_channels) 
                          ? match.broadcast_channels.join(', ')
                          : match.broadcast_channels
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Link para assistir - SEPARADO para evitar conflitos */}
                {match.streaming_links && (
                  <div className="flex justify-center mt-3">
                    {(() => {
                      console.log('🔍 match.streaming_links original:', match.streaming_links);
                      let url = '';
                      if (typeof match.streaming_links === 'string') {
                        // Tenta extrair a URL da string, procurando por http ou https
                        const urlMatch = match.streaming_links.match(/(https?:\/\/[^\s]+)/);
                        console.log('🔍 urlMatch (string):', urlMatch);
                        if (urlMatch && urlMatch[0]) {
                          url = urlMatch[0];
                        }
                      } else if (typeof match.streaming_links === 'object' && match.streaming_links !== null) {
                        const values = Object.values(match.streaming_links);
                        console.log('🔍 values (object):', values);
                        if (values.length > 0) {
                          url = values[0] as string;
                        }
                      }
                      
                      console.log('🔍 URL extraída para o link:', url);
                      if (url) {
                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={12} className="mr-1" />
                            ASSISTIR
                          </a>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 