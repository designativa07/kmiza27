'use client';

import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';

interface AcademyPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  type: 'youth' | 'professional';
  overall: number;
  potential: number;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  is_in_academy: boolean;
  training_focus: string;
  training_intensity: 'baixa' | 'normal' | 'alta';
  training_type: string;
  morale: number;
  fitness: number;
  form: number;
  created_at: string;
  attributeChanges?: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
  lastTraining?: string;
  trainingCount?: number;
}

interface AcademyStats {
  totalPlayers: number;
  youthPlayers: number;
  professionalPlayers: number;
  averageAge: number;
  averageOverall: number;
  averagePotential: number;
  playersInAcademy: number;
  trainingFocusDistribution: Record<string, number>;
  intensityDistribution: Record<string, number>;
}

interface AcademyPanelProps {
  teamId: string;
  onPlayerPromoted?: () => void;
}

export default function AcademyPanel({ teamId, onPlayerPromoted }: AcademyPanelProps) {
  const [players, setPlayers] = useState<AcademyPlayer[]>([]);
  const [stats, setStats] = useState<AcademyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'juniors' | 'stats'>('juniors');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<string | null>(null);
  const [showQuickTraining, setShowQuickTraining] = useState(false);

  useEffect(() => {
    loadAcademyData();
  }, [teamId]);

  const loadAcademyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar jogadores da academia
      const [playersResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:3004/api/v2/api/v2/academy/players?teamId=${teamId}`),
        fetch(`http://localhost:3004/api/v2/api/v2/academy/stats?teamId=${teamId}`)
      ]);

      if (!playersResponse.ok) throw new Error('Erro ao carregar jogadores da academia');
      if (!statsResponse.ok) throw new Error('Erro ao carregar estatísticas da academia');

      const playersData = await playersResponse.json();
      const statsData = await statsResponse.json();

      if (playersData.success) {
        setPlayers(playersData.data);
      }
      if (statsData.success) {
        setStats(statsData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para as ações do PlayerCard
  const handleConfigureTraining = (playerId: string) => {
    setSelectedPlayer(playerId);
  };

  const handleViewDetails = (playerId: string) => {
    setSelectedPlayerForDetails(playerId);
  };

  const handlePromotePlayer = async (playerId: string) => {
    if (confirm('Tem certeza que deseja promover este jogador para o time profissional? Esta ação não pode ser desfeita.')) {
      try {
        // TODO: Implementar API para promover jogador
        console.log('Promover jogador:', playerId);
        alert('Funcionalidade de promoção será implementada em breve!');
        
        // Notificar o componente pai para atualizar os números
        if (onPlayerPromoted) {
          onPlayerPromoted();
        }
      } catch (error) {
        console.error('Erro ao promover jogador:', error);
        alert('Erro ao promover jogador. Tente novamente.');
      }
    }
  };

  const handleSendToAcademy = async (playerId: string) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const response = await fetch('http://localhost:3004/api/v2/api/v2/academy/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          teamId,
          focus: player.training_focus,
          intensity: player.training_intensity,
          inAcademy: true,
          playerType: player.type
        })
      });

      if (response.ok) {
        await loadAcademyData();
        alert('Jogador enviado para a academia com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao enviar jogador para academia:', err);
      alert('Erro ao enviar jogador para academia. Tente novamente.');
    }
  };

  const handleRemoveFromAcademy = async (playerId: string) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const response = await fetch('http://localhost:3004/api/v2/api/v2/academy/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          teamId,
          focus: player.training_focus,
          intensity: player.training_intensity,
          inAcademy: false,
          playerType: player.type
        })
      });

      if (response.ok) {
        await loadAcademyData();
        alert('Jogador removido da academia com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao remover jogador da academia:', err);
      alert('Erro ao remover jogador da academia. Tente novamente.');
    }
  };

  const handlePlayerAction = async (playerId: string, action: string) => {
    if (action === 'training') {
      // Abrir modal de configuração de treinamento
      setSelectedPlayer(playerId);
    } else if (action === 'details') {
      // Abrir modal de detalhes do jogador
      setSelectedPlayerForDetails(playerId);
    }
  };

  const handleTrainingConfig = async (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const response = await fetch('http://localhost:3004/api/v2/api/v2/academy/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          teamId,
          focus,
          intensity,
          inAcademy,
          playerType: player.type
        })
      });

      if (response.ok) {
        // Recarregar dados
        await loadAcademyData();
        setSelectedPlayer(null);
      }
    } catch (err) {
      console.error('Erro ao configurar treinamento:', err);
    }
  };

  const handleQuickTrainingConfig = async (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const response = await fetch('http://localhost:3004/api/v2/api/v2/academy/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          teamId,
          focus,
          intensity,
          inAcademy,
          playerType: player.type
        })
      });

      if (!response.ok) {
        console.error(`Erro ao configurar treinamento para ${player.name}`);
      }
    } catch (err) {
      const player = players.find(p => p.id === playerId);
      console.error(`Erro ao configurar treinamento para ${player?.name || playerId}:`, err);
    }
  };

  const applyTrainingWeek = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/v2/api/v2/academy/apply-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        await loadAcademyData();
        alert('Semana de treinamento aplicada com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao aplicar semana de treinamento:', err);
    }
  };

  const getFilteredPlayers = () => {
    if (activeTab === 'juniors') {
      return players.filter(p => p.type === 'youth');
    }
    return players;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'baixa': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-red-600 bg-red-100';
      case 'normal': 
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getFocusColor = (focus: string) => {
    const colors: Record<string, string> = {
      'PAC': 'text-purple-600 bg-purple-100',
      'SHO': 'text-red-600 bg-red-100',
      'PAS': 'text-blue-600 bg-blue-100',
      'DRI': 'text-yellow-600 bg-yellow-100',
      'DEF': 'text-green-600 bg-green-100',
      'PHY': 'text-orange-600 bg-orange-100'
    };
    return colors[focus] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Carregando academia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-lg text-red-600 mb-4 font-medium">{error}</p>
          <button 
            onClick={loadAcademyData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const filteredPlayers = getFilteredPlayers();

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎓 Academia de Base</h2>
            <p className="text-gray-600">Gerencie o desenvolvimento dos seus jovens talentos</p>
          </div>
          <button 
            onClick={applyTrainingWeek}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🏋️</span>
            Aplicar Semana de Treino
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalPlayers}</div>
              <div className="text-sm font-medium text-gray-700">Total de Jogadores</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.youthPlayers}</div>
              <div className="text-sm font-medium text-gray-700">Jovens Talentos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.professionalPlayers}</div>
              <div className="text-sm font-medium text-gray-700">Profissionais</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.playersInAcademy}</div>
              <div className="text-sm font-medium text-gray-700">Em Treinamento</div>
            </div>
          </div>
        )}
      </div>

      {/* Menu de Treino Rápido */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Treino Rápido - Todos os Juniores
          </h3>
          <button
            onClick={() => setShowQuickTraining(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">⚙️</span>
            Configurar Treino Rápido
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          Configure o treinamento para todos os jogadores juniores de uma vez só. 
          Ideal para treinos em massa e desenvolvimento uniforme do elenco.
        </p>
      </div>

      {/* Navegação por abas */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('juniors')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'juniors'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">👶</span>
          <span>Juniores ({players.filter(p => p.type === 'youth').length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'stats'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">📊</span>
          <span>Estatísticas</span>
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="p-6">
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">📈</span>
                      Médias Gerais
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700">Idade:</span>
                        <span className="font-bold text-blue-600">{stats.averageAge} anos</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700">Overall:</span>
                        <span className="font-bold text-green-600">{stats.averageOverall}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-gray-700">Potencial:</span>
                        <span className="font-bold text-purple-600">{stats.averagePotential}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      Distribuição de Foco
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(stats.trainingFocusDistribution).map(([focus, count]) => (
                        <div key={focus} className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-700 font-medium">{focus}</span>
                          <span className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Distribuição de Intensidade
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    {Object.entries(stats.intensityDistribution).map(([intensity, count]) => (
                      <div key={intensity} className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-2 capitalize">{intensity}</div>
                        <div className="text-3xl font-bold text-orange-600 bg-white p-4 rounded-xl shadow-sm">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-lg">🔍</span>
                Filtros
              </h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" title="Filtrar por posição">
                    <option value="">Todas as posições</option>
                    <option value="GK">Goleiro</option>
                    <option value="CB">Zagueiro</option>
                    <option value="LB">Lateral Esquerdo</option>
                    <option value="RB">Lateral Direito</option>
                    <option value="CDM">Volante</option>
                    <option value="CM">Meio Campo</option>
                    <option value="CAM">Meia Ofensivo</option>
                    <option value="LW">Ponta Esquerda</option>
                    <option value="RW">Ponta Direita</option>
                    <option value="CF">Segundo Atacante</option>
                    <option value="ST">Atacante</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Idade</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" title="Filtrar por idade">
                    <option value="">Todas as idades</option>
                    <option value="16-18">16-18 anos</option>
                    <option value="19-21">19-21 anos</option>
                    <option value="22-25">22-25 anos</option>
                    <option value="26+">26+ anos</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" title="Filtrar por status">
                    <option value="">Todos os status</option>
                    <option value="academy">Na academia</option>
                    <option value="not-academy">Fora da academia</option>
                  </select>
                </div>
              </div>
            </div>

                         {/* Lista de jogadores com PlayerCard unificado */}
             {filteredPlayers.length === 0 ? (
               <div className="text-center py-16">
                 <div className="text-gray-400 text-6xl mb-4">👥</div>
                 <p className="text-lg text-gray-500 font-medium">Nenhum jogador encontrado nesta categoria.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredPlayers.map(player => (
                   <PlayerCard 
                     key={player.id} 
                     player={{
                       id: player.id,
                       name: player.name,
                       position: player.position,
                       age: player.age,
                       overall: player.overall,
                       potential: player.potential,
                       attributes: {
                         pace: player.attributes.pace,
                         shooting: player.attributes.shooting,
                         passing: player.attributes.passing,
                         dribbling: player.attributes.dribbling,
                         defending: player.attributes.defending,
                         physical: player.attributes.physical,
                       },
                       training_focus: player.training_focus,
                       training_intensity: player.training_intensity,
                       type: player.type,
                       is_in_academy: player.is_in_academy,
                       attributeChanges: player.attributeChanges,
                       lastTraining: player.lastTraining,
                       trainingCount: player.trainingCount,
                       morale: player.morale,
                       fitness: player.fitness,
                       form: player.form,
                     }}
                     context="academy"
                     showTrainingStatus={true}
                     showAttributes={true}
                     showPhysicalStats={true}
                     showTrainingHistory={true}
                     onConfigureTraining={handleConfigureTraining}
                     onViewDetails={handleViewDetails}
                     onPromotePlayer={handlePromotePlayer}
                     onSendToAcademy={handleSendToAcademy}
                     onRemoveFromAcademy={handleRemoveFromAcademy}
                     className="h-full"
                   />
                 ))}
               </div>
             )}
          </div>
        )}
      </div>

      {/* Modal de configuração de treinamento */}
      {selectedPlayer && (
        <TrainingConfigModal
          player={players.find(p => p.id === selectedPlayer)!}
          onClose={() => setSelectedPlayer(null)}
          onSave={handleTrainingConfig}
          teamId={teamId}
        />
      )}

      {/* Modal de configuração de treino rápido */}
      {showQuickTraining && (
        <QuickTrainingConfigModal
          players={players.filter(p => p.type === 'youth')}
          onClose={() => setShowQuickTraining(false)}
          onSave={handleQuickTrainingConfig}
          teamId={teamId}
        />
      )}

      {/* Modal de detalhes do jogador */}
      {selectedPlayerForDetails && (
        <PlayerDetailsModal
          player={players.find(p => p.id === selectedPlayerForDetails)!}
          onClose={() => setSelectedPlayerForDetails(null)}
          teamId={teamId}
        />
      )}
    </div>
  );
}

// Modal de configuração de treinamento
interface TrainingConfigModalProps {
  player: AcademyPlayer;
  onClose: () => void;
  onSave: (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => void;
  teamId: string;
}

function TrainingConfigModal({ player, onClose, onSave, teamId }: TrainingConfigModalProps) {
  const [focus, setFocus] = useState(player.training_focus || 'PAS');
  const [intensity, setIntensity] = useState<'normal'>(player.training_intensity === 'normal' ? 'normal' : 'normal');
  const [inAcademy, setInAcademy] = useState(player.is_in_academy || false);

  // Funções auxiliares para cores
  const getFocusColor = (focus: string) => {
    const colors: Record<string, string> = {
      'PAC': 'text-purple-600 bg-purple-100',
      'SHO': 'text-red-600 bg-red-100',
      'PAS': 'text-blue-600 bg-blue-100',
      'DRI': 'text-yellow-600 bg-yellow-100',
      'DEF': 'text-green-600 bg-green-100',
      'PHY': 'text-orange-600 bg-orange-100'
    };
    return colors[focus] || 'text-gray-600 bg-gray-100';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'baixa': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-red-600 bg-red-100';
      case 'normal': 
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const handleSave = () => {
    onSave(player.id, focus, intensity, inAcademy);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Configurar Treinamento
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Jogador
            </label>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="font-bold text-gray-900 text-lg">{player.name}</div>
              <div className="text-sm text-gray-600">{player.position} • {player.age} anos</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foco do Treinamento
            </label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="PAC">PAC - Ritmo</option>
              <option value="SHO">SHO - Finalização</option>
              <option value="PAS">PAS - Passe</option>
              <option value="DRI">DRI - Drible</option>
              <option value="DEF">DEF - Defesa</option>
              <option value="PHY">PHY - Físico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Intensidade
            </label>
            {player.type === 'youth' && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">ℹ️ Jogador Júnior:</span> Apenas intensidade "normal" é permitida para garantir desenvolvimento seguro.
                </p>
              </div>
            )}
            <select
              value={intensity}
              disabled={player.type === 'youth'}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors ${
                player.type === 'youth' 
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                  : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              {player.type === 'youth' ? (
                <option value="normal">Normal (equilibrado e seguro)</option>
              ) : (
                <>
                  <option value="baixa">Baixa (menos risco, menos ganho)</option>
                  <option value="normal">Normal (equilibrado)</option>
                  <option value="alta">Alta (mais risco, mais ganho)</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="inAcademy"
              checked={inAcademy}
              onChange={(e) => setInAcademy(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="inAcademy" className="ml-3 text-sm font-medium text-gray-700">
              Colocar na academia para treinamento
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de configuração de treino rápido
interface QuickTrainingConfigModalProps {
  players: AcademyPlayer[];
  onClose: () => void;
  onSave: (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => void;
  teamId: string;
}

function QuickTrainingConfigModal({ players, onClose, onSave, teamId }: QuickTrainingConfigModalProps) {
  const [focus, setFocus] = useState('PAS');
  const [intensity, setIntensity] = useState<'normal'>('normal');
  const [inAcademy, setInAcademy] = useState(false);

  // Funções auxiliares para cores
  const getFocusColor = (focus: string) => {
    const colors: Record<string, string> = {
      'PAC': 'text-purple-600 bg-purple-100',
      'SHO': 'text-red-600 bg-red-100',
      'PAS': 'text-blue-600 bg-blue-100',
      'DRI': 'text-yellow-600 bg-yellow-100',
      'DEF': 'text-green-600 bg-green-100',
      'PHY': 'text-orange-600 bg-orange-100'
    };
    return colors[focus] || 'text-gray-600 bg-gray-100';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'baixa': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-red-600 bg-red-100';
      case 'normal': 
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const handleSave = () => {
    players.forEach(player => {
      onSave(player.id, focus, intensity, inAcademy);
    });
    onClose();
    alert('Treinamento rápido aplicado com sucesso!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          Configurar Treinamento Rápido
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foco do Treinamento
            </label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="PAC">PAC - Ritmo</option>
              <option value="SHO">SHO - Finalização</option>
              <option value="PAS">PAS - Passe</option>
              <option value="DRI">DRI - Drible</option>
              <option value="DEF">DEF - Defesa</option>
              <option value="PHY">PHY - Físico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Intensidade
            </label>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">ℹ️ Para jogadores juniores:</span> Apenas intensidade "normal" é permitida para garantir desenvolvimento seguro e evitar lesões.
              </p>
            </div>
            <select
              value={intensity}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            >
              <option value="normal">Normal (equilibrado e seguro)</option>
            </select>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="inAcademy"
              checked={inAcademy}
              onChange={(e) => setInAcademy(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="inAcademy" className="ml-3 text-sm font-medium text-gray-700">
              Colocar na academia para treinamento
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de detalhes do jogador
interface PlayerDetailsModalProps {
  player: AcademyPlayer;
  onClose: () => void;
  teamId: string;
}

function PlayerDetailsModal({ player, onClose, teamId }: PlayerDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any>({});
  const [lastTraining, setLastTraining] = useState<string | null>(null);
  const [trainingCount, setTrainingCount] = useState<number | null>(null);

  // Funções auxiliares para cores
  const getFocusColor = (focus: string) => {
    const colors: Record<string, string> = {
      'PAC': 'text-purple-600 bg-purple-100',
      'SHO': 'text-red-600 bg-red-100',
      'PAS': 'text-blue-600 bg-blue-100',
      'DRI': 'text-yellow-600 bg-yellow-100',
      'DEF': 'text-green-600 bg-green-100',
      'PHY': 'text-orange-600 bg-orange-100'
    };
    return colors[focus] || 'text-gray-600 bg-gray-100';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'baixa': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-red-600 bg-red-100';
      case 'normal': 
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  useEffect(() => {
    loadPlayerDetails();
  }, [player.id, teamId]);

  const loadPlayerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3004/api/v2/api/v2/academy/player-details/${player.id}?teamId=${teamId}`);
      if (!response.ok) throw new Error('Erro ao carregar detalhes do jogador');

      const data = await response.json();
      if (data.success) {
        setAttributes(data.data.attributes);
        setTrainingHistory(data.data.trainingHistory);
        setLastTraining(data.data.lastTraining);
        setTrainingCount(data.data.trainingCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Carregando detalhes do jogador...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <p className="text-lg text-red-600 mb-4 font-medium">{error}</p>
          <button 
            onClick={loadPlayerDetails}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header fixo - mais compacto */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Detalhes do Jogador: {player.name}
          </h3>
        </div>
        
        {/* Conteúdo com rolagem - mais compacto */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status e Atributos */}
            <div className="space-y-3">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  Status e Atributos
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                    <span className="text-xs text-gray-700">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      player.is_in_academy 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {player.is_in_academy ? '🏋️ Em treino' : '⏸️ Fora da academia'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                    <span className="text-xs text-gray-700">Foco:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getFocusColor(player.training_focus)} border`}>
                      {player.training_focus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                    <span className="text-xs text-gray-700">Idade:</span>
                    <span className="font-bold text-blue-600 text-sm">{player.age} anos</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                    <span className="text-xs text-gray-700">Overall:</span>
                    <span className="font-bold text-green-600 text-sm">{player.overall}</span>
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-white rounded-md">
                    <span className="text-xs text-gray-700">Potencial:</span>
                    <span className="font-bold text-purple-600 text-sm">{player.potential}</span>
                  </div>
                </div>
              </div>

              {/* Atributos - mais compacto */}
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Atributos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">PAC</span>
                      <span className="text-xs font-bold text-purple-600">{attributes.pace || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.pace || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">SHO</span>
                      <span className="text-xs font-bold text-red-600">{attributes.shooting || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.shooting || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">PAS</span>
                      <span className="text-xs font-bold text-blue-600">{attributes.passing || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.passing || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">DRI</span>
                      <span className="text-xs font-bold text-yellow-600">{attributes.dribbling || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.dribbling || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">DEF</span>
                      <span className="text-xs font-bold text-green-600">{attributes.defending || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.defending || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-white p-1.5 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-600">PHY</span>
                      <span className="text-xs font-bold text-orange-600">{attributes.physical || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" style={{width: `${attributes.physical || 0}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico e Estatísticas */}
            <div className="space-y-3">
              {/* Histórico de Treinamento - mais compacto */}
              <div className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  Histórico de Treinamento
                </h4>
                <div className="max-h-36 overflow-y-auto">
                  <table className="min-w-full bg-white rounded-md shadow-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase">Foco</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trainingHistory.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500 text-center">
                            Nenhum treinamento registrado
                          </td>
                        </tr>
                      ) : (
                        trainingHistory.map((training, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500">
                              {new Date(training.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium text-gray-900">
                              {training.focus}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Estatísticas Gerais - mais compacto */}
              <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Estatísticas Gerais
                </h4>
                <div className="space-y-2">
                  <div className="bg-white p-2 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-600">Último treino:</span>
                      <span className="text-xs font-bold text-blue-600">
                        {lastTraining ? new Date(lastTraining).toLocaleDateString('pt-BR') : 'Nunca'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-600">Total de sessões:</span>
                      <span className="text-xs font-bold text-purple-600">{trainingCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer fixo - mais compacto */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

