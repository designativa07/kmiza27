'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Round {
  id: number;
  name: string;
  round_number: number;
  phase?: string; // Pode ser útil para mata-mata
}

interface RoundNavigatorProps {
  rounds: Round[];
  currentRoundId: number | null;
  currentRoundNumber: number | null;
  competitionType: string;
  onRoundChange: (roundId: number, roundNumber: number) => void;
}

export function RoundNavigator({
  rounds,
  currentRoundId,
  currentRoundNumber,
  competitionType,
  onRoundChange,
}: RoundNavigatorProps) {
  // Não há mais estado interno de isLoading ou matches aqui.
  // A lógica de busca de partidas será responsabilidade do componente pai.

  const currentIndex = rounds.findIndex(round => round.id === currentRoundId);
  const currentRound = rounds[currentIndex];

  const handlePrevRound = () => {
    if (currentIndex > 0) {
      const prevRound = rounds[currentIndex - 1];
      onRoundChange(prevRound.id, prevRound.round_number);
    }
  };

  const handleNextRound = () => {
    if (currentIndex < rounds.length - 1) {
      const nextRound = rounds[currentIndex + 1];
      onRoundChange(nextRound.id, nextRound.round_number);
    }
  };

  // Se não houver rodada atual, ou as rodadas ainda não foram carregadas, retorne nulo.
  if (!currentRound) {
    return null;
  }

  const isMataMata = competitionType === 'mata-mata';
  const displayName = isMataMata 
    ? currentRound.phase || currentRound.name 
    : `Rodada ${currentRound.round_number} de ${rounds.length}`;

  return (
    <div className="w-full">
      {/* Header compacto com título */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
        <h3 className="text-lg font-semibold text-white text-center">
          {displayName}
        </h3>
      </div>
      
      {/* Navegação compacta */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <button 
          onClick={handlePrevRound} 
          disabled={currentIndex <= 0}
          className={`
            flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
            ${currentIndex <= 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-md transform hover:scale-105'
            }
          `}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {/* Indicadores de rodada */}
        <div className="flex-1 flex items-center justify-center mx-4">
          <div className="flex items-center space-x-1.5">
            {rounds.map((round, index) => (
              <button
                key={round.id}
                onClick={() => onRoundChange(round.id, round.round_number)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-200 hover:scale-125
                  ${index === currentIndex 
                    ? 'bg-blue-600 shadow-sm ring-1 ring-blue-200' 
                    : index < currentIndex 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }
                `}
                title={isMataMata ? (round.phase || round.name) : `Rodada ${round.round_number}`}
              />
            ))}
          </div>
          
          {/* Contador de rodadas */}
          <div className="ml-4 text-xs text-gray-600 font-medium">
            {currentIndex + 1}/{rounds.length}
          </div>
        </div>
        
        <button 
          onClick={handleNextRound} 
          disabled={currentIndex >= rounds.length - 1}
          className={`
            flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
            ${currentIndex >= rounds.length - 1 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-md transform hover:scale-105'
            }
          `}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 