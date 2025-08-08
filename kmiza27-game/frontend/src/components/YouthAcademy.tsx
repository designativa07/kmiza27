'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';
import YouthAcademyLogs from './YouthAcademyLogs';

interface YouthPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  category: string;
  scouted_date: string;
  is_promoted: boolean;
  training_focus?: string;
  training_intensity?: 'low'|'normal'|'high';
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

interface AcademyInfo {
  level: number;
  facilities: {
    training_fields: number;
    gym_quality: number;
    medical_center: number;
    dormitory_capacity: number;
    coaching_staff: number;
  };
  investment: number;
  monthly_cost: number;
  efficiency_multiplier: number;
}

export default function YouthAcademy() {
  const { selectedTeam } = useGameStore();
  const [youthPlayers, setYouthPlayers] = useState<YouthPlayer[]>([]);
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'players' | 'tryouts' | 'facilities'>('players');
  const [processingWeek, setProcessingWeek] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (selectedTeam) {
      loadAcademyData();
    }
  }, [selectedTeam]);

  const loadAcademyData = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    try {
      // Carregar jogadores reais em academia e logs (quando disponíveis)
      try {
        const realPlayers = await gameApiReformed.getAcademyPlayers(selectedTeam.id);
        if (Array.isArray(realPlayers) && realPlayers.length > 0) {
          setYouthPlayers(realPlayers.map((p: any) => ({
            id: p.id,
            name: p.name,
            position: p.position,
            age: p.age,
            overall: Math.round(((p.speed ?? 0) + (p.stamina ?? 0) + (p.strength ?? 0) + (p.passing ?? 0) + (p.shooting ?? 0) + (p.dribbling ?? 0) + (p.defending ?? 0)) / 7),
            potential: p.potential ?? 75,
            category: p.age <= 17 ? 'Sub-17' : 'Sub-18',
            scouted_date: new Date().toISOString().slice(0,10),
            is_promoted: false,
            training_focus: p.training_focus || 'PAS',
            training_intensity: (p.training_intensity as any) || 'normal',
            attributes: {
              pace: Math.round(((p.speed ?? 0) + (p.stamina ?? 0)) / 2),
              shooting: p.shooting ?? 0,
              passing: p.passing ?? 0,
              dribbling: p.dribbling ?? 0,
              defending: p.defending ?? 0,
              physical: Math.round(((p.strength ?? 0) + (p.stamina ?? 0)) / 2),
            },
          })));
        }
      } catch {}

      try {
        const academyLogs = await gameApiReformed.getAcademyLogs(selectedTeam.id);
        setLogs(academyLogs);
      } catch {}
      const mockAcademyInfo: AcademyInfo = {
        level: 1,
        facilities: {
          training_fields: 1,
          gym_quality: 1,
          medical_center: 1,
          dormitory_capacity: 10,
          coaching_staff: 2
        },
        investment: 0,
        monthly_cost: 50000,
        efficiency_multiplier: 1.0
      };

      const mockYouthPlayers: YouthPlayer[] = [
        {
          id: '1',
          name: 'Carlos Junior',
          position: 'ST',
          age: 17,
          overall: 65,
          potential: 85,
          category: 'Sub-18',
          scouted_date: '2024-01-15',
          is_promoted: false,
          attributes: {
            pace: 75,
            shooting: 70,
            passing: 60,
            dribbling: 75,
            defending: 40,
            physical: 70
          }
        },
        {
          id: '2',
          name: 'Lucas Silva',
          position: 'CM',
          age: 16,
          overall: 62,
          potential: 82,
          category: 'Sub-17',
          scouted_date: '2024-02-20',
          is_promoted: false,
          attributes: {
            pace: 70,
            shooting: 60,
            passing: 75,
            dribbling: 70,
            defending: 65,
            physical: 65
          }
        }
      ];

      setAcademyInfo(mockAcademyInfo);
      setYouthPlayers(mockYouthPlayers);
    } catch (error) {
      console.error('Erro ao carregar dados da academia:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleTryout = async () => {
    // TODO: Implementar agendamento de peneira
    alert('Funcionalidade de peneira em desenvolvimento...');
  };

  const promotePlayer = async (playerId: string) => {
    // TODO: Implementar promoção de jogador
    alert('Funcionalidade de promoção em desenvolvimento...');
  };

  const setTraining = async (playerId: string, focus: string, intensity: 'low'|'normal'|'high' = 'normal') => {
    await gameApiReformed.setTraining({ playerId, focus, intensity, inAcademy: true });
    await loadAcademyData();
  };

  const applyWeek = async () => {
    if (!selectedTeam) return;
    setProcessingWeek(true);
    try {
      await gameApiReformed.applyTrainingWeek(selectedTeam.id);
      await loadAcademyData();
    } finally {
      setProcessingWeek(false);
    }
  };

  const upgradeFacility = async (facility: string) => {
    // TODO: Implementar upgrade de instalação
    alert(`Upgrade de ${facility} em desenvolvimento...`);
  };

  if (!selectedTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">🏫 Academia de Base</h2>
        <p className="text-gray-700">Selecione um time para gerenciar a academia de base.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">🏫 Academia de Base - {selectedTeam.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'players' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Jogadores
          </button>
          <button
            onClick={() => setActiveTab('tryouts')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'tryouts' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Peneiras
          </button>
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'facilities' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Instalações
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando academia...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Jogadores da Base</h3>
                <div className="flex items-center gap-2">
                  <button onClick={applyWeek} disabled={processingWeek} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    {processingWeek ? 'Processando...' : 'Aplicar Semana'}
                  </button>
                  <span className="text-sm text-gray-700">{youthPlayers.length} jogadores</span>
                </div>
              </div>
              
              <div className="grid gap-4">
                {youthPlayers.map((player) => (
                  <div key={player.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                          {player.position}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{player.name}</h4>
                          <p className="text-sm text-gray-700">
                            {player.position} • {player.age} anos • {player.category}
                          </p>
                          <p className="text-xs text-blue-600">
                            Overall: {player.overall} • Potencial: {player.potential}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {player.overall}
                        </div>
                        <div className="text-sm text-gray-600">
                          Potencial: {player.potential}
                        </div>
                        <div className="mt-2 flex gap-1 justify-end">
                          {['PAC','SHO','PAS','DRI','DEF','PHY'].map((f) => (
                            <button key={f} onClick={() => setTraining(player.id, f as any)} className="px-2 py-1 border rounded text-xs">
                              {f}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2">
                          <label className="text-[11px] text-gray-600 mr-2">Intensidade</label>
                          <select
                            value={player.training_intensity || 'normal'}
                            onChange={(e) => setTraining(player.id, player.training_focus || 'PAS', e.target.value as any)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="low">Baixa</option>
                            <option value="normal">Normal</option>
                            <option value="high">Alta</option>
                          </select>
                        </div>
                        {player.overall >= 70 && (
                          <button
                            onClick={() => promotePlayer(player.id)}
                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Promover
                          </button>
                        )}
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

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">📘 Logs Recentes (geral)</h4>
                  <YouthAcademyLogs logs={logs} limit={12} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">📗 Logs do Jogador Selecionado</h4>
                  <YouthAcademyLogs logs={logs.filter(l => l.player_id === (youthPlayers[0]?.id))} compact limit={8} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tryouts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Peneiras</h3>
                <button
                  onClick={scheduleTryout}
                  className="btn-primary"
                >
                  Agendar Peneira
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Próximas Peneiras</h4>
                <p className="text-yellow-700 text-sm">
                  Nenhuma peneira agendada. Agende uma peneira para descobrir novos talentos!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'facilities' && academyInfo && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Instalações da Academia</h3>
                <div className="text-sm text-gray-700">
                  Nível {academyInfo.level} • Eficiência: {(academyInfo.efficiency_multiplier * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏟️ Campos de Treino</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Nível {academyInfo.facilities.training_fields}</span>
                    <button
                      onClick={() => upgradeFacility('training_fields')}
                      className="btn-secondary"
                    >
                      Melhorar
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">💪 Academia</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Nível {academyInfo.facilities.gym_quality}</span>
                    <button
                      onClick={() => upgradeFacility('gym_quality')}
                      className="btn-secondary"
                    >
                      Melhorar
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏥 Centro Médico</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Nível {academyInfo.facilities.medical_center}</span>
                    <button
                      onClick={() => upgradeFacility('medical_center')}
                      className="btn-secondary"
                    >
                      Melhorar
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏠 Dormitório</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{academyInfo.facilities.dormitory_capacity} vagas</span>
                    <button
                      onClick={() => upgradeFacility('dormitory_capacity')}
                      className="btn-secondary"
                    >
                      Expandir
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 text-gray-900">💰 Custos Mensais</h4>
                <p className="text-gray-700">
                  Custo mensal: R$ {academyInfo.monthly_cost.toLocaleString()}
                </p>
                <p className="text-gray-700">
                  Investimento total: R$ {academyInfo.investment.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 