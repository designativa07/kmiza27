'use client';

import Link from 'next/link';
import type { NextPage } from 'next';
import { getTeamLogoUrl } from '@/lib/cdn';
import { useState, useEffect } from 'react';
import { Match } from '@/types/match';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';

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

// Componente para exibir uma partida
const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
  return (
    <div className="py-2.5 border-b border-gray-200 last:border-b-0">
      {/* Nome da competição */}
      <div className="text-center text-base font-bold text-blue-800 mb-1">
        {match.competition?.name}
      </div>
      <div className="text-center text-sm text-gray-600 mb-2.5">
        <span>{formatDate(match.match_date)}</span>
        {match.stadium && (
          <span className="ml-2">
            • {match.stadium.name}
            {match.stadium.city && ` (${match.stadium.city})`}
          </span>
        )}
        {match.round && (
          <span className="ml-2">
            • {match.round.name}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center mb-2.5">
        {/* Lado esquerdo: mandante + escudo */}
        <div className="flex items-center justify-end flex-1 pr-1">
          <span className="font-semibold text-gray-800 mr-1 text-sm">{match.home_team.name}</span>
          <img 
            src={getTeamLogoUrl(match.home_team.logo_url)} 
            alt={match.home_team.name} 
            className="h-8 w-8 object-contain"
          />
        </div>

        {/* Centro: placar fixo */}
        <div className="flex items-center justify-center min-w-[60px]">
          {(match.status === 'finished' || match.status === 'FINISHED' || (match.home_score !== null && match.away_score !== null)) ? (
            <>
              <span className="text-xl font-bold text-gray-800">{match.home_score}</span>
              <span className="text-xl font-bold text-gray-800 mx-0.5">×</span>
              <span className="text-xl font-bold text-gray-800">{match.away_score}</span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-400">×</span>
          )}
        </div>

        {/* Lado direito: escudo + visitante */}
        <div className="flex items-center justify-start flex-1 pl-1">
          <img 
            src={getTeamLogoUrl(match.away_team.logo_url)} 
            alt={match.away_team.name} 
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold text-gray-800 ml-1 text-sm">{match.away_team.name}</span>
        </div>
      </div>
      
      {/* Canais de Transmissão e Links */}
      {((match.broadcasts && match.broadcasts.length > 0) || (match.broadcast_channels)) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Canais de Transmissão (apenas nome clicável) */}
          {match.broadcasts && match.broadcasts.length > 0 && (
            match.broadcasts.map((broadcast: any) => (
              <div key={broadcast.channel.id} className="flex items-center gap-2">
                {broadcast.channel.channel_link ? (
                  <a 
                    href={broadcast.channel.channel_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors shadow-sm"
                  >
                    {broadcast.channel.name}
                  </a>
                ) : (
                  <span 
                    className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md shadow-sm"
                  >
                    {broadcast.channel.name}
                  </span>
                )}
              </div>
            ))
          )}
          {/* Botões 'ASSISTIR' da coluna broadcast_channels */}
          {typeof match.broadcast_channels === 'string' && match.broadcast_channels.trim() !== '' && (
            match.broadcast_channels.split(',').map((link: string, index: number) => {
              const url = link.startsWith('http') ? link : `https://${link}`;
              return (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                >
                  ASSISTIR
                </a>
              );
            })
          )}
          {Array.isArray(match.broadcast_channels) && match.broadcast_channels.length > 0 && (
            match.broadcast_channels.map((link: string, index: number) => {
              const url = link.startsWith('http') ? link : `https://${link}`;
              return (
                <a 
                  key={index} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors shadow-sm"
                >
                  ASSISTIR
                </a>
              );
            })
          )}
        </div>
      )}
      {/* Link para Detalhes */}
      <div className="text-center mt-2">
        <Link href={`/jogos/${match.id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
          VER DETALHES
        </Link>
      </div>
    </div>
  );
};

const JogosHojePage: NextPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/matches/today`);
        if (!response.ok) {
          throw new Error('Erro ao buscar jogos de hoje');
        }
        const data = await response.json();
        setMatches(data);
      } catch (err) {
        console.error('Erro ao buscar jogos de hoje:', err);
        setError('Erro ao carregar jogos de hoje');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900">Jogos de Hoje</h1>
            </div>
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-gray-200 pb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900">Jogos de Hoje</h1>
            </div>
            <div className="p-4 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Jogos de Hoje</h1>
          </div>
          <div className="p-4">
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-lg">Não há jogos agendados para hoje.</p>
                <Link href="/" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                  Voltar ao início
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default JogosHojePage; 