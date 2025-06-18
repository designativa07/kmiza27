import { Calendar, Clock, MapPin, Shield, Tv, ExternalLink } from 'lucide-react';
import { Match } from '@/types/match';
import { getCdnImageUrl } from '@/lib/cdn-simple';

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
                      src={getCdnImageUrl(match.home_team.logo_url, 'team')} 
                      alt={match.home_team.name} 
                      className="h-8 w-8 object-contain"
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
                      src={getCdnImageUrl(match.away_team.logo_url, 'team')} 
                      alt={match.away_team.name} 
                      className="h-8 w-8 object-contain"
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
                    <div className="flex items-center text-center">
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

                {/* Links para assistir */}
                {match.streaming_links && (
                  <div className="flex justify-center flex-wrap gap-2 mt-3">
                    {(() => {
                      const links: { url: string; name: string }[] = [];
                      const processPart = (part: string) => {
                        // Trata "Nome: URL"
                        const namedLinkMatch = part.match(/^(.*?):\s*(https?:\/\/[^\s]+)$/);
                        if (namedLinkMatch) {
                          links.push({ name: namedLinkMatch[1].trim(), url: namedLinkMatch[2] });
                          return;
                        }
                        // Trata apenas URL
                        const urlMatch = part.match(/^(https?:\/\/[^\s]+)$/);
                        if (urlMatch) {
                          links.push({ name: 'ASSISTIR', url: urlMatch[0] });
                        }
                      };

                      if (typeof match.streaming_links === 'string') {
                        match.streaming_links.split(',').forEach(p => processPart(p.trim()));
                      } else if (typeof match.streaming_links === 'object' && match.streaming_links !== null) {
                        for (const [name, url] of Object.entries(match.streaming_links)) {
                          if (typeof url === 'string') {
                            links.push({ name, url });
                          }
                        }
                      }

                      if (links.length > 0) {
                        return links.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full hover:bg-blue-600 transition-colors cursor-pointer"
                          >
                            <ExternalLink size={12} className="mr-1" />
                            {link.name}
                          </a>
                        ));
                      }
                      
                      // Fallback para exibir o conteúdo como texto se não for possível extrair links
                      if (typeof match.streaming_links === 'string') {
                        return <p className="text-xs text-gray-600">{match.streaming_links}</p>;
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