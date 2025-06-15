'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Match } from '@/types/match';
import { RoundMatches } from './RoundMatches'; // Reutilizaremos o componente existente

interface Round {
  id: number;
  name: string;
  round_number: number;
}

interface RoundNavigatorProps {
  initialRounds: Round[];
  competitionId: number;
  initialMatches: Match[];
  initialRoundId: number | null;
  initialRoundName: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function RoundNavigator({ initialRounds, competitionId, initialMatches, initialRoundId, initialRoundName }: RoundNavigatorProps) {
  const [rounds, setRounds] = useState(initialRounds);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(() => {
    if (!initialRounds || initialRounds.length === 0) {
      return 0;
    }
    if (initialRoundId) {
      const index = initialRounds.findIndex(round => round.id === initialRoundId);
      return index !== -1 ? index : initialRounds.length - 1; // Fallback para a última se não encontrar
    }
    return initialRounds.length - 1; // Padrão para a última rodada se não houver ID inicial
  });
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [isLoading, setIsLoading] = useState(false);

  // Verificação de segurança
  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-500">Nenhuma rodada encontrada para esta competição.</p>
      </div>
    );
  }

  useEffect(() => {
    // Se o índice mudar, buscar novas partidas
    if (currentRoundIndex < 0 || currentRoundIndex >= rounds.length) {
      return;
    }
    
    const fetchMatches = async () => {
      setIsLoading(true);
      const roundId = rounds[currentRoundIndex].id;
      try {
        const res = await fetch(`${API_URL}/standings/competition/${competitionId}/round/${roundId}/matches`);
        if (res.ok) {
          const data = await res.json();
          setMatches(data);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error("Failed to fetch matches for round:", error);
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Buscar partidas sempre que o índice da rodada mudar
    fetchMatches();
  }, [currentRoundIndex, rounds, competitionId]);

  const handlePrevRound = () => {
    if (currentRoundIndex > 0) {
      setCurrentRoundIndex(currentRoundIndex - 1);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex < rounds.length - 1) {
      setCurrentRoundIndex(currentRoundIndex + 1);
    }
  };

  const currentRoundName = rounds[currentRoundIndex]?.name || 'Rodada';

  return (
    <div className="bg-white rounded-lg shadow-lg">
       <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={handlePrevRound} 
            disabled={currentRoundIndex <= 0 || isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-bold text-gray-800 text-center">
            {currentRoundName}
          </h3>
          <button 
            onClick={handleNextRound} 
            disabled={currentRoundIndex >= rounds.length - 1 || isLoading}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
       </div>
        {isLoading ? (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        ) : (
            <RoundMatches matches={matches} roundName={currentRoundName} hideTitle={true} />
        )}
    </div>
  );
} 