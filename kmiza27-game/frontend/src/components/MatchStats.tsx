'use client';

import { useState } from 'react';

interface MatchStatsProps {
  stats: {
    possession: { home: number; away: number };
    shots: { home: number; away: number };
    shots_on_target: { home: number; away: number };
    corners: { home: number; away: number };
    fouls: { home: number; away: number };
    yellow_cards: { home: number; away: number };
    red_cards: { home: number; away: number };
  };
  homeTeamName: string;
  awayTeamName: string;
}

export default function MatchStats({ stats, homeTeamName, awayTeamName }: MatchStatsProps) {
  const [showStats, setShowStats] = useState(false);

  if (!stats) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t">
      <button
        onClick={() => setShowStats(!showStats)}
        className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center"
      >
        📊 {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
        <span className="ml-1">{showStats ? '▼' : '▶'}</span>
      </button>
      
      {showStats && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Posse de Bola */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Posse de Bola</span>
                <span className="text-xs text-gray-600">100%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{homeTeamName}</span>
                    <span>{stats.possession.home}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stats.possession.home}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{awayTeamName}</span>
                    <span>{stats.possession.away}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${stats.possession.away}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chutes */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Chutes</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.shots.home}</div>
                  <div className="text-xs text-gray-600">{homeTeamName}</div>
                </div>
                <div className="text-gray-400">vs</div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-red-600">{stats.shots.away}</div>
                  <div className="text-xs text-gray-600">{awayTeamName}</div>
                </div>
              </div>
            </div>

            {/* Chutes no Gol */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Chutes no Gol</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.shots_on_target.home}</div>
                  <div className="text-xs text-gray-600">{homeTeamName}</div>
                </div>
                <div className="text-gray-400">vs</div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-red-600">{stats.shots_on_target.away}</div>
                  <div className="text-xs text-gray-600">{awayTeamName}</div>
                </div>
              </div>
            </div>

            {/* Escanteios */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Escanteios</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.corners.home}</div>
                  <div className="text-xs text-gray-600">{homeTeamName}</div>
                </div>
                <div className="text-gray-400">vs</div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-red-600">{stats.corners.away}</div>
                  <div className="text-xs text-gray-600">{awayTeamName}</div>
                </div>
              </div>
            </div>

            {/* Faltas */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Faltas</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.fouls.home}</div>
                  <div className="text-xs text-gray-600">{homeTeamName}</div>
                </div>
                <div className="text-gray-400">vs</div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-red-600">{stats.fouls.away}</div>
                  <div className="text-xs text-gray-600">{awayTeamName}</div>
                </div>
              </div>
            </div>

            {/* Cartões */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Cartões Amarelos</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-yellow-600">{stats.yellow_cards.home}</div>
                    <div className="text-xs text-gray-600">{homeTeamName}</div>
                  </div>
                  <div className="text-gray-400">vs</div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-yellow-600">{stats.yellow_cards.away}</div>
                    <div className="text-xs text-gray-600">{awayTeamName}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Cartões Vermelhos</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-red-600">{stats.red_cards.home}</div>
                    <div className="text-xs text-gray-600">{homeTeamName}</div>
                  </div>
                  <div className="text-gray-400">vs</div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-red-600">{stats.red_cards.away}</div>
                    <div className="text-xs text-gray-600">{awayTeamName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 