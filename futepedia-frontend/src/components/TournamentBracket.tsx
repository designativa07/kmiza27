'use client';

import React from 'react';
import { Match } from '@/types/match';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { parseISO, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { phaseOrder, getOrderedPhases } from '@/lib/competition-utils';

interface TournamentBracketProps {
  matches: Match[];
  competitionName?: string;
}

// Função para formatar data
const formatMatchDate = (dateInput: any) => {
  try {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
      return format(dateInput, 'dd/MM', { locale: ptBR });
    }
    
    if (typeof dateInput === 'string') {
      try {
        const date = parseISO(dateInput);
        if (isValid(date)) {
          return format(date, 'dd/MM', { locale: ptBR });
        }
      } catch {
        const date = new Date(dateInput);
        if (isValid(date)) {
          return format(date, 'dd/MM', { locale: ptBR });
        }
      }
    }
    
    return '';
  } catch {
    return '';
  }
};

// Função para formatar hora
const formatMatchTime = (dateInput: any) => {
  try {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
      return format(dateInput, 'HH:mm', { locale: ptBR });
    }
    
    if (typeof dateInput === 'string') {
      try {
        const date = parseISO(dateInput);
        if (isValid(date)) {
          return format(date, 'HH:mm', { locale: ptBR });
        }
      } catch {
        const date = new Date(dateInput);
        if (isValid(date)) {
          return format(date, 'HH:mm', { locale: ptBR });
        }
      }
    }
    
    return '';
  } catch {
    return '';
  }
};

// Mapeamento das fases agora vem dos utilitários

// Função para determinar o vencedor baseado no placar
const getWinner = (match: Match) => {
  if (match.status !== 'FINISHED' && match.status !== 'finished') return null;
  
  const homeScore = (match.home_score || 0) + (match.home_score_penalties || 0);
  const awayScore = (match.away_score || 0) + (match.away_score_penalties || 0);
  
  if (homeScore > awayScore) return match.home_team;
  if (awayScore > homeScore) return match.away_team;
  return null;
};

// Componente para um confronto individual
const BracketMatch: React.FC<{ match: Match; phase: string }> = ({ match, phase }) => {
  const winner = getWinner(match);
  const isFinished = match.status === 'FINISHED' || match.status === 'finished';
  
  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-3 min-w-[200px]">
      {/* Cabeçalho da partida */}
      <div className="text-center mb-2">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {phase}
        </div>
        {match.match_date && (
          <div className="text-xs text-gray-500">
            {formatMatchDate(match.match_date)} • {formatMatchTime(match.match_date)}
          </div>
        )}
      </div>
      
      {/* Time da Casa */}
      <div className={`flex items-center justify-between p-2 rounded ${
        winner?.id === match.home_team.id ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
      }`}>
        <div className="flex items-center space-x-2 flex-1">
          <img 
            src={getTeamLogoUrl(match.home_team.logo_url)}
            alt={match.home_team.name}
            className="h-6 w-6 object-contain"
          />
          <span className={`text-sm font-medium truncate ${
            winner?.id === match.home_team.id ? 'text-green-800' : 'text-gray-700'
          }`}>
            {match.home_team.name}
          </span>
        </div>
        <div className={`text-lg font-bold min-w-[24px] text-center ${
          winner?.id === match.home_team.id ? 'text-green-800' : 'text-gray-600'
        }`}>
          {isFinished ? (match.home_score || 0) : ''}
        </div>
      </div>
      
      {/* Divisor */}
      <div className="border-t border-gray-200 my-1"></div>
      
      {/* Time Visitante */}
      <div className={`flex items-center justify-between p-2 rounded ${
        winner?.id === match.away_team.id ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'
      }`}>
        <div className="flex items-center space-x-2 flex-1">
          <img 
            src={getTeamLogoUrl(match.away_team.logo_url)}
            alt={match.away_team.name}
            className="h-6 w-6 object-contain"
          />
          <span className={`text-sm font-medium truncate ${
            winner?.id === match.away_team.id ? 'text-green-800' : 'text-gray-700'
          }`}>
            {match.away_team.name}
          </span>
        </div>
        <div className={`text-lg font-bold min-w-[24px] text-center ${
          winner?.id === match.away_team.id ? 'text-green-800' : 'text-gray-600'
        }`}>
          {isFinished ? (match.away_score || 0) : ''}
        </div>
      </div>
      
      {/* Informações de pênaltis se houver */}
      {isFinished && (match.home_score_penalties !== null && match.home_score_penalties !== undefined) && (
        <div className="text-center mt-2 text-xs text-gray-500">
          Pênaltis: {match.home_score_penalties} - {match.away_score_penalties}
        </div>
      )}
      
      {/* Status da partida */}
      {!isFinished && (
        <div className="text-center mt-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {match.status === 'IN_PROGRESS' || match.status === 'in_progress' ? 'AO VIVO' : 'AGENDADO'}
          </span>
        </div>
      )}
    </div>
  );
};

// Componente principal do chaveamento
export const TournamentBracket: React.FC<TournamentBracketProps> = ({ matches, competitionName }) => {
  // Agrupar partidas por fase
  const matchesByPhase = matches.reduce((acc, match) => {
    const phase = match.phase || 'Outras';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(match);
    return acc;
  }, {} as Record<string, Match[]>);
  
  // Ordenar fases pela ordem lógica usando utilitários
  const orderedPhases = getOrderedPhases(Object.keys(matchesByPhase));
  
  if (orderedPhases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Chaveamento</h3>
        <p className="text-gray-500">Nenhuma partida de mata-mata encontrada.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-xl shadow-2xl p-8 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-white rounded-full"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-4 left-8 w-8 h-8 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-4 right-8 w-20 h-20 border-2 border-white rounded-full"></div>
      </div>
      
      {/* Cabeçalho estilo Copa do Mundo */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-full shadow-lg mb-4">
          <h2 className="text-3xl font-bold uppercase tracking-wider">
            🏆 CHAVEAMENTO DEFINIDO
          </h2>
        </div>
        {competitionName && (
          <p className="text-xl text-white font-semibold uppercase tracking-wide mt-2">
            {competitionName}
          </p>
        )}
        <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mt-4 rounded-full"></div>
      </div>
      
      {/* Container do chaveamento com scroll horizontal */}
      <div className="relative z-10">
        <div className="overflow-x-auto">
          <div className="flex items-center justify-center min-w-fit space-x-8 pb-4">
            {orderedPhases.map((phase, phaseIndex) => (
              <div key={phase} className="flex flex-col items-center space-y-6 min-w-[240px]">
                {/* Título da fase estilo torneio */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-white to-gray-100 text-gray-800 px-6 py-3 rounded-lg shadow-lg border-2 border-gray-300 relative">
                    <h3 className="text-lg font-bold uppercase tracking-wide">
                      {phase}
                    </h3>
                    {/* Pequenos elementos decorativos */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Container das partidas com conexões */}
                <div className="relative">
                  <div className="space-y-8">
                    {matchesByPhase[phase].map((match, matchIndex) => (
                      <div key={match.id} className="relative">
                        <BracketMatch match={match} phase={phase} />
                        
                        {/* Linha conectora para próxima fase */}
                        {phaseIndex < orderedPhases.length - 1 && (
                          <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
                            <div className="w-8 h-0.5 bg-yellow-400"></div>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Conexão vertical entre partidas da mesma fase (quando múltiplas) */}
                {matchesByPhase[phase].length > 1 && (
                  <svg 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ zIndex: -1 }}
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none"
                  >
                    {matchesByPhase[phase].map((_, index) => {
                      if (index < matchesByPhase[phase].length - 1) {
                        const spacing = 100 / matchesByPhase[phase].length;
                        return (
                          <line
                            key={index}
                            x1="50%"
                            y1={`${(index + 1) * spacing}%`}
                            x2="50%"
                            y2={`${(index + 2) * spacing}%`}
                            stroke="#fbbf24"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                          />
                        );
                      }
                      return null;
                    })}
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Seção da final com destaque especial */}
      {orderedPhases.includes('Final') && (
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-black px-12 py-6 rounded-xl shadow-2xl border-4 border-yellow-300">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🥇</div>
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-wider">FINAL</h3>
                <p className="text-sm font-medium opacity-90">Decisão do Título</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Legenda melhorada */}
      <div className="mt-12 flex justify-center relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">Legenda</h4>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded shadow-sm border border-green-600"></div>
              <span className="text-sm font-medium text-gray-700">Classificado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded shadow-sm border border-blue-600"></div>
              <span className="text-sm font-medium text-gray-700">Ao Vivo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-300 rounded shadow-sm border border-gray-400"></div>
              <span className="text-sm font-medium text-gray-700">Agendado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-1 bg-yellow-400 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Conexão</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 