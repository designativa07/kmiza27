'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  salary: number;
  contract_until: string;
  is_injured: boolean;
  is_suspended: boolean;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

export default function PlayersManager() {
  const { selectedTeam } = useGameStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'squad' | 'transfers' | 'training'>('squad');

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers();
    }
  }, [selectedTeam]);

  const loadPlayers = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    try {
      // TODO: Implementar chamada para API de jogadores
      // Por enquanto, dados mockados
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'João Silva',
          position: 'ST',
          age: 24,
          overall: 78,
          potential: 82,
          salary: 15000,
          contract_until: '2026-06-30',
          is_injured: false,
          is_suspended: false,
          attributes: {
            pace: 80,
            shooting: 75,
            passing: 65,
            dribbling: 70,
            defending: 45,
            physical: 75
          }
        },
        {
          id: '2',
          name: 'Pedro Santos',
          position: 'CM',
          age: 26,
          overall: 76,
          potential: 79,
          salary: 12000,
          contract_until: '2025-06-30',
          is_injured: false,
          is_suspended: false,
          attributes: {
            pace: 70,
            shooting: 65,
            passing: 80,
            dribbling: 75,
            defending: 70,
            physical: 75
          }
        }
      ];
      
      setPlayers(mockPlayers);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">👥 Gerenciamento de Jogadores</h2>
        <p className="text-gray-700">Selecione um time para gerenciar os jogadores.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">👥 Jogadores - {selectedTeam.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('squad')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'squad' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Escalação
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'transfers' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Transferências
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'training' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Treinamento
          </button>
        </div>
      </div>

      {loading ? (
                  <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-700">Carregando jogadores...</p>
          </div>
      ) : (
        <div>
          {activeTab === 'squad' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Escalação Principal</h3>
                <span className="text-sm text-gray-700">{players.length} jogadores</span>
              </div>
              
              <div className="grid gap-4">
                {players.map((player) => (
                  <div key={player.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {player.position}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{player.name}</h4>
                          <p className="text-sm text-gray-700">
                            {player.position} • {player.age} anos • Overall: {player.overall}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {player.overall}
                        </div>
                        <div className="text-sm text-gray-600">
                          R$ {player.salary.toLocaleString()}/mês
                        </div>
                      </div>
                    </div>
                    
                    {/* Atributos */}
                    <div className="mt-3 grid grid-cols-6 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold">PAC</div>
                        <div>{player.attributes.pace}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">SHO</div>
                        <div>{player.attributes.shooting}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">PAS</div>
                        <div>{player.attributes.passing}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">DRI</div>
                        <div>{player.attributes.dribbling}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">DEF</div>
                        <div>{player.attributes.defending}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">PHY</div>
                        <div>{player.attributes.physical}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transfers' && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">🔄 Transferências</h3>
              <p className="text-gray-700">Sistema de transferências em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">⚽ Treinamento</h3>
              <p className="text-gray-700">Sistema de treinamento em desenvolvimento...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 