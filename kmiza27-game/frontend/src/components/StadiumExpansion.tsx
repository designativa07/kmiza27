'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';

interface StadiumExpansionProps {
  team: GameTeam;
}

export default function StadiumExpansion({ team }: StadiumExpansionProps) {
  const { expandStadium, isLoading, error } = useGameStore();
  const [showExpansion, setShowExpansion] = useState(false);

  const expansionOptions = [
    { capacity: 500, cost: 50000, description: 'Pequena expansão (+500 lugares)' },
    { capacity: 1000, cost: 100000, description: 'Média expansão (+1.000 lugares)' },
    { capacity: 2000, cost: 200000, description: 'Grande expansão (+2.000 lugares)' },
    { capacity: 5000, cost: 500000, description: 'Expansão massiva (+5.000 lugares)' }
  ];

  const handleExpansion = async (capacity: number, cost: number) => {
    try {
      // Verificar se o time tem orçamento suficiente
      if (team.budget < cost) {
        alert('Orçamento insuficiente para esta expansão!');
        return;
      }

      // Expandir o estádio (isso já atualiza orçamento e capacidade)
      await expandStadium(team.id, capacity, cost);
      
      alert(`Expansão realizada! Capacidade aumentada em ${capacity} lugares.`);
      setShowExpansion(false);
    } catch (error) {
      console.error('Error expanding stadium:', error);
      alert('Erro ao expandir estádio: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🏟️ Expansão do Estádio
        </h3>
        <button
          onClick={() => setShowExpansion(!showExpansion)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showExpansion ? 'Ocultar' : 'Expandir'}
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Capacidade atual:</span>
          <span className="font-medium">{team.stadium_capacity?.toLocaleString()} lugares</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Orçamento disponível:</span>
          <span className="font-medium">R$ {team.budget?.toLocaleString()}</span>
        </div>
      </div>

      {showExpansion && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">Opções de Expansão:</h4>
          
          {expansionOptions.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${
                team.budget >= option.cost
                  ? 'border-gray-200 hover:border-blue-300 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => team.budget >= option.cost && handleExpansion(option.capacity, option.cost)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{option.description}</p>
                  <p className="text-sm text-gray-700">
                    Nova capacidade: {(team.stadium_capacity + option.capacity).toLocaleString()} lugares
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">R$ {option.cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">
                    {team.budget >= option.cost ? 'Disponível' : 'Orçamento insuficiente'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 