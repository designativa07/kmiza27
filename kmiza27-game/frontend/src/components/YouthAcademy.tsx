'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';
import YouthAcademyLogs from './YouthAcademyLogs';
import PlayerCardCompact from './PlayerCardCompact';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface AcademyPlayer {
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
  // Para jogadores profissionais
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
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
  const [academyPlayers, setAcademyPlayers] = useState<AcademyPlayer[]>([]);
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
      // Carregar jogadores reais em academia e logs
      try {
        const realPlayers = await gameApiReformed.getAcademyPlayers(selectedTeam.id);
        if (Array.isArray(realPlayers) && realPlayers.length > 0) {
          const mappedPlayers = realPlayers.map((p: any) => {
            // Determinar se é jogador da base ou profissional
            const isYouthPlayer = p.team_id && p.attributes;
            const isProfessionalPlayer = p.pace !== undefined;
            
            let overall, category, attributes;
            
            if (isYouthPlayer) {
              // Jogador da base
              overall = Math.round(((p.attributes?.pace ?? 0) + (p.attributes?.shooting ?? 0) + (p.attributes?.passing ?? 0) + 
                                   (p.attributes?.dribbling ?? 0) + (p.attributes?.defending ?? 0) + (p.attributes?.physical ?? 0)) / 6);
              category = p.age <= 17 ? 'Sub-17' : 'Sub-18';
              attributes = {
                pace: p.attributes?.pace ?? 50,
                shooting: p.attributes?.shooting ?? 50,
                passing: p.attributes?.passing ?? 50,
                dribbling: p.attributes?.dribbling ?? 50,
                defending: p.attributes?.defending ?? 50,
                physical: p.attributes?.physical ?? 50
              };
            } else if (isProfessionalPlayer) {
              // Jogador profissional
              overall = Math.round(((p.pace ?? 50) + (p.shooting ?? 50) + (p.passing ?? 50) + 
                                   (p.dribbling ?? 50) + (p.defending ?? 50) + (p.physical ?? 50)) / 6);
              category = p.age <= 23 ? 'Jovem' : 'Sênior';
              attributes = {
                pace: p.pace ?? 50,
                shooting: p.shooting ?? 50,
                passing: p.passing ?? 50,
                dribbling: p.dribbling ?? 50,
                defending: p.defending ?? 50,
                physical: p.physical ?? 50
              };
            } else {
              // Fallback
              overall = 50;
              category = 'Indefinido';
              attributes = { pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 };
            }
            
            return {
              id: p.id,
              name: p.name,
              position: p.position,
              age: p.age,
              overall,
              potential: p.potential ?? 75,
              category,
              scouted_date: new Date().toISOString().slice(0,10),
              is_promoted: false,
              training_focus: p.training_focus || 'PAS',
              training_intensity: (p.training_intensity as any) || 'normal',
              attributes,
              // Para jogadores profissionais, incluir atributos diretos
              ...(isProfessionalPlayer && {
                pace: p.pace,
                shooting: p.shooting,
                passing: p.passing,
                dribbling: p.dribbling,
                defending: p.defending,
                physical: p.physical
              })
            };
          });
          
          setAcademyPlayers(mappedPlayers);
        }
      } catch (error) {
        console.error('Erro ao carregar jogadores da academia:', error);
      }

      try {
        const academyLogs = await gameApiReformed.getAcademyLogs(selectedTeam.id);
        setLogs(academyLogs);
      } catch (error) {
        console.error('Erro ao carregar logs da academia:', error);
      }

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

      setAcademyInfo(mockAcademyInfo);
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
    if (!selectedTeam) {
      alert('Erro: Time não selecionado');
      return;
    }

    if (confirm('Tem certeza que deseja promover este jogador para o time profissional? Esta ação não pode ser desfeita.')) {
      try {
        console.log('Promovendo jogador:', playerId);
        
        // Usar a API real de promoção
        const result = await gameApiReformed.promotePlayer(playerId, selectedTeam.id);
        
        console.log('Jogador promovido com sucesso!', result);
        alert(`Jogador promovido com sucesso para o elenco profissional! Valor de mercado: ${formatCurrency(result?.player?.market_value)}`);
        
        // Recarregar dados da academia
        await loadAcademyData();
        
      } catch (error) {
        console.error('Erro ao promover jogador:', error);
        alert('Erro ao promover jogador. Verifique se o jogador ainda está na base e tente novamente.');
      }
    }
  };

  const setTraining = async (playerId: string, focus: string, intensity: 'low'|'normal'|'high' = 'normal') => {
    try {
      await gameApiReformed.setTraining({ playerId, focus, intensity, inAcademy: true });
      await loadAcademyData();
    } catch (error) {
      console.error('Erro ao configurar treinamento:', error);
    }
  };

  const applyWeek = async () => {
    if (!selectedTeam) return;
    setProcessingWeek(true);
    try {
      await gameApiReformed.applyTrainingWeek(selectedTeam.id);
      await loadAcademyData();
    } catch (error) {
      console.error('Erro ao aplicar semana de treinamento:', error);
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
                <h3 className="text-lg font-semibold text-gray-900">Jogadores na Academia</h3>
                <div className="flex items-center gap-2">
                  <button onClick={applyWeek} disabled={processingWeek} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    {processingWeek ? 'Processando...' : 'Aplicar Semana'}
                  </button>
                  <span className="text-sm text-gray-700">{academyPlayers.length} jogadores</span>
                </div>
              </div>
              
              {/* Grid de jogadores usando PlayerCardCompact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {academyPlayers.map((player) => (
                  <div key={player.id} className="relative">
                    <PlayerCardCompact
                      player={{
                        id: player.id,
                        name: player.name,
                        position: player.position,
                        age: player.age,
                        overall: player.overall,
                        potential: player.potential,
                        attributes: {
                          PAC: player.pace || player.attributes.pace,
                          FIN: player.shooting || player.attributes.shooting,
                          PAS: player.passing || player.attributes.passing,
                          DRI: player.dribbling || player.attributes.dribbling,
                          DEF: player.defending || player.attributes.defending,
                          FIS: player.physical || player.attributes.physical,
                          GOL: player.position === 'GK' ? (player.pace || player.attributes.pace) : undefined
                        }
                      }}
                      size="small"
                    />
                    
                    {/* Controles de treinamento */}
                    <div className="mt-2 space-y-2">
                      {/* Foco de treinamento */}
                      <div className="flex gap-1 justify-center">
                        {['PAC','SHO','PAS','DRI','DEF','PHY'].map((focus) => (
                          <button 
                            key={focus} 
                            onClick={() => setTraining(player.id, focus as any)} 
                            className={`px-2 py-1 text-xs rounded border ${
                              player.training_focus === focus 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {focus}
                          </button>
                        ))}
                      </div>
                      
                      {/* Intensidade */}
                      <div className="flex items-center justify-center gap-2">
                        <label className="text-xs text-gray-600">Intensidade:</label>
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
                      
                      {/* Botão de promoção para jogadores da base */}
                      {player.category.includes('Sub-') && player.overall >= 70 && (
                        <div className="text-center">
                          <button
                            onClick={() => promotePlayer(player.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Promover
                          </button>
                        </div>
                      )}
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
                  <YouthAcademyLogs logs={logs.filter(l => l.player_id === (academyPlayers[0]?.id))} compact limit={8} />
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
                  Custo mensal: {formatCurrency(academyInfo.monthly_cost)}
                </p>
                <p className="text-gray-700">
                  Investimento total: {formatCurrency(academyInfo.investment)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 