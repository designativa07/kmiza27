'use client';

import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { getFutepediaLogoUrl } from '@/lib/cdn';
import { useState, useEffect } from 'react';
import { Match } from '@/types/match';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Função para formatar a data
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

// Função para formatar apenas o horário
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

// Componente para exibir uma partida no formato grid compacto
const InstagramGridMatchCard: React.FC<{ match: Match }> = ({ match }) => {
  return (
    <div className="border-b border-gray-200 p-1 sm:p-4">
      {/* Nome da competição, horário e local */}
      <div className="text-center text-sm sm:text-lg font-bold text-blue-800 mb-2 sm:mb-3 mt-2">
        {match.competition?.name}
        <span className="ml-2 text-xs sm:text-sm font-normal text-gray-600">
          • {formatTime(match.match_date)}
        </span>
        {match.stadium && match.stadium.city && (
          <span className="ml-2 text-xs sm:text-sm font-normal text-gray-600">
            • {match.stadium.city}
          </span>
        )}
      </div>
      
      {/* Rodada */}
      {match.round && (
        <div className="text-center text-xs text-gray-500 mb-2 sm:mb-4">
          {match.round.name}
        </div>
      )}

      {/* Times e placar */}
      <div className="flex items-center justify-center mb-2 sm:mb-5">
        {/* Time mandante */}
        <div className="flex items-center justify-end flex-1 pr-1 sm:pr-4">
          <div className="text-right">
            <img 
              src={getTeamLogoUrl(match.home_team.logo_url)} 
              alt={match.home_team.name} 
              className="h-8 w-8 sm:h-16 sm:w-16 object-contain mx-auto mb-1"
            />
            <div className="text-sm sm:text-lg font-bold text-gray-900">{match.home_team.name}</div>
          </div>
        </div>

        {/* VS ou placar */}
        <div className="flex items-center justify-center min-w-[60px] sm:min-w-[100px]">
          {(match.status === 'finished' || match.status === 'FINISHED' || (match.home_score !== null && match.away_score !== null)) ? (
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-gray-900 mb-1">
                {match.home_score} × {match.away_score}
              </div>
              <div className="text-xs text-gray-500">FINAL</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg sm:text-3xl font-bold text-gray-400 mb-1">VS</div>
            </div>
          )}
        </div>

        {/* Time visitante */}
        <div className="flex items-center justify-start flex-1 pl-1 sm:pl-4">
          <div className="text-left">
            <img 
              src={getTeamLogoUrl(match.away_team.logo_url)} 
              alt={match.away_team.name} 
              className="h-8 w-8 sm:h-16 sm:w-16 object-contain mx-auto mb-1"
            />
            <div className="text-sm sm:text-lg font-bold text-gray-900">{match.away_team.name}</div>
          </div>
        </div>
      </div>
      
      {/* Canais de Transmissão - apenas se houver */}
      {((match.broadcasts && match.broadcasts.length > 0) || (match.broadcast_channels)) && (
        <div className="text-center mt-2 mb-2">
          <div className="flex flex-wrap gap-1 justify-center">
            {/* Canais de Transmissão */}
            {match.broadcasts && match.broadcasts.length > 0 && (
              match.broadcasts.map((broadcast: any, index: number) => (
                <div key={broadcast.channel.id} className="flex items-center gap-1">
                  {index > 0 && <span className="text-xs text-gray-400">•</span>}
                  <span className="text-xs text-gray-600">
                    {broadcast.channel.name}
                  </span>
                </div>
              ))
            )}
            {/* Canais de Transmissão */}
            {typeof match.broadcast_channels === 'string' && match.broadcast_channels.trim() !== '' && (
              <span className="text-xs text-gray-600">
                {(match.broadcasts && match.broadcasts.length > 0) && '• '}
                {match.broadcast_channels}
              </span>
            )}
            {Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0 && (
              <span className="text-xs text-gray-600">
                {(match.broadcasts && match.broadcasts.length > 0) && '• '}
                {match.broadcast_channels.join(' • ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InstagramGridCardPage: NextPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [futepediaLogoUrl, setFutepediaLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar jogos
        const matchesResponse = await fetch(`${API_URL}/matches/today`);
        if (!matchesResponse.ok) {
          throw new Error('Erro ao buscar jogos de hoje');
        }
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);

        // Buscar logo da Futepédia
        const logoResponse = await fetch(`${API_URL}/system-settings/futepedia-images`, { 
          cache: 'no-store' 
        });
        if (logoResponse.ok) {
          const logoData = await logoResponse.json();
          setFutepediaLogoUrl(logoData.headerLogoUrl);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-[900px] h-[800px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-xl font-bold text-gray-800">Carregando jogos...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-[900px] h-[800px] flex items-center justify-center text-center">
          <div className="text-red-600 text-xl font-bold">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[390px] sm:w-full sm:max-w-[1080px] min-h-[1350px] bg-white mx-auto overflow-hidden mt-2">
      {/* Container principal adaptável para Instagram (1080x1350) */}
      <div className="w-full flex flex-col">
        {/* Header com logo e branding */}
        <div className="pb-1 pt-2 px-2 sm:px-8">
          <div className="text-center">
            {/* Logo do Kmiza27 e HOJE */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {futepediaLogoUrl ? (
                <img 
                  src={getFutepediaLogoUrl(futepediaLogoUrl)}
                  alt="Kmiza27 Logo" 
                  className="h-4 sm:h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
                />
              ) : (
                <div className="h-4 sm:h-6 w-8 sm:w-12 bg-gray-200 rounded animate-pulse"></div>
              )}
              <div className="text-lg sm:text-3xl font-bold text-gray-900">HOJE</div>
            </div>
            
            <div className="text-xs sm:text-lg text-gray-600 mb-1">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'America/Sao_Paulo'
              })}
            </div>
          </div>
        </div>

        {/* Grid de jogos - se adapta ao conteúdo */}
        <div className="px-2 sm:px-8">
          {matches.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-6xl mb-4">😴</div>
                <div className="text-2xl font-bold text-gray-800 mb-2">Nenhum jogo hoje</div>
                <div className="text-lg text-gray-600">Não há jogos agendados para hoje</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {matches.slice(0, 8).map((match, index) => (
                <InstagramGridMatchCard key={match.id} match={match} />
              ))}
              {matches.length > 8 && (
                <div className="border-b border-gray-200 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-600 mb-1">
                      +{matches.length - 8}
                    </div>
                    <div className="text-sm text-gray-500">
                      mais jogos
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer simples */}
        <div className="px-8 py-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">
              Futepedia.Kmiza27.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramGridCardPage;
