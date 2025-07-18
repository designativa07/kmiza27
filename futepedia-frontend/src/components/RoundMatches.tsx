import React from 'react';
import { Calendar, Clock, MapPin, Shield, Tv, ExternalLink } from 'lucide-react';
import { Match } from '@/types/match';
import { getCdnImageUrl, getTeamLogoUrl } from '@/lib/cdn-simple';
import Link from 'next/link';
import { parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDate = (dateInput: any) => {
  try {
    if (!dateInput) {
      return 'Data não informada';
    }
    
    let dateString: string;
    
    // Se é um objeto Date JavaScript, usar diretamente
    if (dateInput instanceof Date) {
      const result = format(dateInput, 'dd/MM', { locale: ptBR });
      return result;
    }
    
    // Se é um objeto, tentar extrair a data
    if (typeof dateInput === 'object' && dateInput !== null) {
      // Verificar se tem propriedades de data comuns
      if (dateInput.date) {
        dateString = dateInput.date;
      } else if (dateInput.datetime) {
        dateString = dateInput.datetime;
      } else if (dateInput.timestamp) {
        dateString = dateInput.timestamp;
      } else if (dateInput.value) {
        dateString = dateInput.value;
      } else {
        console.error('formatDate: Objeto sem propriedades de data conhecidas:', Object.keys(dateInput));
        return 'Data não informada';
      }
    } else if (typeof dateInput === 'string') {
      dateString = dateInput;
    } else {
      console.error('formatDate: Tipo de input não suportado:', typeof dateInput, dateInput);
      return 'Data não informada';
    }
    
    if (!dateString || typeof dateString !== 'string') {
      return 'Data não informada';
    }
    
    // Tentar diferentes formatos de data
    let date;
    
    try {
      date = parseISO(dateString);
      if (!isValid(date)) {
        throw new Error('Data inválida com parseISO');
      }
    } catch (parseISOError) {
      try {
        date = new Date(dateString);
        if (!isValid(date)) {
          throw new Error('Data inválida com new Date');
        }
      } catch (newDateError) {
        throw newDateError;
      }
    }
    
    return format(date, 'dd/MM', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateInput);
    return 'Data não informada';
  }
};

const formatTime = (dateInput: any) => {
  try {
    if (!dateInput) {
      return 'Hora não informada';
    }
    
    let dateString: string;
    
    // Se é um objeto Date JavaScript, usar diretamente
    if (dateInput instanceof Date) {
      const result = format(dateInput, 'HH:mm', { locale: ptBR });
      return result;
    }
    
    // Se é um objeto, tentar extrair a data
    if (typeof dateInput === 'object' && dateInput !== null) {
      // Verificar se tem propriedades de data comuns
      if (dateInput.date) {
        dateString = dateInput.date;
      } else if (dateInput.datetime) {
        dateString = dateInput.datetime;
      } else if (dateInput.timestamp) {
        dateString = dateInput.timestamp;
      } else if (dateInput.value) {
        dateString = dateInput.value;
      } else {
        console.error('formatTime: Objeto sem propriedades de data conhecidas:', Object.keys(dateInput));
        return 'Hora não informada';
      }
    } else if (typeof dateInput === 'string') {
      dateString = dateInput;
    } else {
      console.error('formatTime: Tipo de input não suportado:', typeof dateInput, dateInput);
      return 'Hora não informada';
    }
    
    if (!dateString || typeof dateString !== 'string') {
      return 'Hora não informada';
    }
    
    // Tentar diferentes formatos de data
    let date;
    
    try {
      date = parseISO(dateString);
      if (!isValid(date)) {
        throw new Error('Data inválida com parseISO');
      }
    } catch (parseISOError) {
      try {
        date = new Date(dateString);
        if (!isValid(date)) {
          throw new Error('Data inválida com new Date');
        }
      } catch (newDateError) {
        throw newDateError;
      }
    }
    
    return format(date, 'HH:mm', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar hora:', error, 'Input:', dateInput);
    return 'Hora não informada';
  }
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
                      src={getTeamLogoUrl(match.home_team.logo_url)}
                      alt={match.home_team.name} 
                      className="h-8 w-8 object-contain"
                    />
                  </div>

                  {/* Placar/Horário e X */}
                  <div className="text-center">
                    {(match.status === 'FINISHED' || match.status === 'finished') ? (
                      <div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          <span>{match.home_score}</span>
                          <span className="mx-2 text-gray-400">×</span>
                          <span>{match.away_score}</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          <div>{formatDate(match.match_date)}</div>
                          <div>{formatTime(match.match_date)}</div>
                        </div>
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
                      src={getTeamLogoUrl(match.away_team.logo_url)}
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


              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}; 