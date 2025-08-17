'use client';

import React, { useState, useEffect } from 'react';

interface TrainingPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
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
  training_focus: string;
  training_intensity: 'baixa' | 'normal' | 'alta';
  is_in_academy: boolean;
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

interface TrainingStats {
  totalPlayers: number;
  averageAge: number;
  averageOverall: number;
  averagePotential: number;
  playersInAcademy: number;
  trainingFocusDistribution: Record<string, number>;
  intensityDistribution: Record<string, number>;
  moraleStats: {
    average: number;
    min: number;
    max: number;
  };
  fitnessStats: {
    average: number;
    min: number;
    max: number;
  };
}

interface TrainingPanelProps {
  teamId: string;
  onPlayerChanges?: () => void;
}

export default function TrainingPanel({ teamId, onPlayerChanges }: TrainingPanelProps) {
  const [players, setPlayers] = useState<TrainingPlayer[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPosition, setFilterPosition] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState<string | null>(null); // Novo estado para o modal de detalhes
  const [showQuickTraining, setShowQuickTraining] = useState(false); // Estado para o modal de treino rápido

  useEffect(() => {
    loadTrainingData();
  }, [teamId]);

  const loadTrainingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar jogadores profissionais para treinamento
      const [playersResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:3004/api/v2/api/v2/training/players?teamId=${teamId}`),
        fetch(`http://localhost:3004/api/v2/api/v2/training/stats?teamId=${teamId}`)
      ]);

      if (!playersResponse.ok) throw new Error('Erro ao carregar jogadores para treinamento');
      if (!statsResponse.ok) throw new Error('Erro ao carregar estatísticas de treinamento');

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

  const handlePlayerAction = async (playerId: string, action: string) => {
    if (action === 'training') {
      setSelectedPlayer(playerId);
    } else if (action === 'details') { // Adicionar nova ação para detalhes
      setSelectedPlayerForDetails(playerId);
    }
  };

  const handleTrainingConfig = async (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => {
    try {
      const response = await fetch('http://localhost:3004/api/v2/api/v2/training/set', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          teamId,
          focus,
          intensity,
          inAcademy
        })
      });

      if (response.ok) {
        await loadTrainingData();
        setSelectedPlayer(null);
      }
    } catch (err) {
      console.error('Erro ao configurar treinamento:', err);
    }
  };

  const applyTrainingWeek = async () => {
    try {
      const response = await fetch('http://localhost:3004/api/v2/api/v2/training/apply-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      });

      if (response.ok) {
        await loadTrainingData();
        alert('Semana de treinamento aplicada com sucesso!');
        
        // Notificar o componente pai sobre mudanças nos jogadores
        if (onPlayerChanges) {
          onPlayerChanges();
        }
      }
    } catch (err) {
      console.error('Erro ao aplicar semana de treinamento:', err);
    }
  };

  const handleQuickTrainingConfig = async (focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => {
    try {
      // Filtrar apenas jogadores profissionais (não estão na academia)
      const professionalPlayers = players.filter(p => !p.is_in_academy);
      
      for (const player of professionalPlayers) {
        const response = await fetch('http://localhost:3004/api/v2/api/v2/training/set', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            teamId: teamId,
            focus: focus,
            intensity: intensity,
            inAcademy: inAcademy,
            playerType: 'professional'
          })
        });

        if (!response.ok) {
          console.error(`Erro ao configurar treino para ${player.name}`);
        }
      }

      // Recarregar dados após configurar todos os jogadores
      await loadTrainingData();
      setShowQuickTraining(false);
      alert(`Treino configurado para ${professionalPlayers.length} jogadores profissionais!`);

    } catch (error) {
      console.error('Erro ao configurar treino rápido:', error);
      alert('Erro ao configurar treino rápido');
    }
  };

  const getFilteredPlayers = () => {
    let filtered = players;

    if (filterPosition) {
      filtered = filtered.filter(p => p.position === filterPosition);
    }

    if (filterAge) {
      const [min, max] = filterAge.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(p => p.age >= min && p.age <= max);
      } else {
        filtered = filtered.filter(p => p.age >= min);
      }
    }

    if (filterStatus === 'academy') {
      filtered = filtered.filter(p => p.is_in_academy);
    } else if (filterStatus === 'not-academy') {
      filtered = filtered.filter(p => !p.is_in_academy);
    }

    return filtered;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'baixa': return 'text-green-600 bg-green-100';
      case 'alta': return 'text-red-600 bg-red-100';
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

  const getMoraleColor = (morale: number) => {
    if (morale >= 80) return 'text-green-600 bg-green-100';
    if (morale >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFitnessColor = (fitness: number) => {
    if (fitness >= 85) return 'text-green-600 bg-green-100';
    if (fitness >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getFormColor = (form: number) => {
    if (form >= 80) return 'text-green-600 bg-green-100';
    if (form >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Carregando treinamento...</p>
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
            onClick={loadTrainingData}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🏋️ Módulo de Treinamento</h2>
            <p className="text-gray-600">Gerencie o desenvolvimento dos seus jogadores profissionais</p>
          </div>
          <button 
            onClick={applyTrainingWeek}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-lg">🏋️</span>
            Aplicar Semana de Treino
          </button>
          
          <button
            onClick={() => setShowQuickTraining(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          >
            <span className="text-xl">⚡</span>
            <span>Treino Rápido</span>
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalPlayers}</div>
              <div className="text-sm font-medium text-gray-700">Total de Jogadores</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.playersInAcademy}</div>
              <div className="text-sm font-medium text-gray-700">Em Treinamento</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.averageOverall}</div>
              <div className="text-sm font-medium text-gray-700">Overall Médio</div>
            </div>
            <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.averagePotential}</div>
              <div className="text-sm font-medium text-gray-700">Potencial Médio</div>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas detalhadas */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Estatísticas Detalhadas
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">📈</span>
                  Médias Gerais
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Idade: {stats.averageAge} anos</div>
                  <div>Overall: {stats.averageOverall}</div>
                  <div>Potencial: {stats.averagePotential}</div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">😊</span>
                  Moral
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Média: {stats.moraleStats.average}</div>
                  <div>Mín: {stats.moraleStats.min}</div>
                  <div>Máx: {stats.moraleStats.max}</div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">💪</span>
                  Fitness
                </h4>
                <div className="space-y-2 text-sm">
                  <div>Média: {stats.fitnessStats.average}</div>
                  <div>Mín: {stats.fitnessStats.min}</div>
                  <div>Máx: {stats.fitnessStats.max}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">🔍</span>
            Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idade</label>
              <select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">Todas as idades</option>
                <option value="22-25">22-25 anos</option>
                <option value="26-30">26-30 anos</option>
                <option value="31-35">31-35 anos</option>
                <option value="36">36+ anos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">Todos os status</option>
                <option value="academy">Na academia</option>
                <option value="not-academy">Fora da academia</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPosition('');
                  setFilterAge('');
                  setFilterStatus('');
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              >
                🗑️ Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de jogadores */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Jogadores Profissionais ({filteredPlayers.length})
            </h3>
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <p className="text-lg text-gray-500 font-medium">Nenhum jogador encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map(player => (
                <div key={player.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  {/* Header do jogador */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{player.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {player.position}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {player.age} anos
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{player.overall}</div>
                      <div className="text-xs text-gray-500 font-medium">Overall</div>
                      <div className="text-lg font-bold text-green-600">{player.potential}</div>
                      <div className="text-xs text-gray-500 font-medium">Potencial</div>
                    </div>
                  </div>

                  {/* Configurações de treinamento */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Foco:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFocusColor(player.training_focus)} border`}>
                          {player.training_focus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Intensidade:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getIntensityColor(player.training_intensity)} border capitalize`}>
                          {player.training_intensity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Moral e Fitness */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <span className="text-lg">💪</span>
                      Condição Física
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Moral:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMoraleColor(player.morale)} border`}>
                          {player.morale}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Fitness:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getFitnessColor(player.fitness)} border`}>
                          {player.fitness}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Atributos */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      Atributos
                      {player.attributeChanges && Object.keys(player.attributeChanges).length > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200 animate-pulse">
                          📈 Evoluindo
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">PAC</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-purple-600">{player.attributes.pace}</span>
                            {player.attributeChanges?.pace && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.pace}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.pace}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">SHO</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-600">{player.attributes.shooting}</span>
                            {player.attributeChanges?.shooting && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.shooting}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.shooting}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">PAS</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600">{player.attributes.passing}</span>
                            {player.attributeChanges?.passing && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.passing}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.passing}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">DRI</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-yellow-600">{player.attributes.dribbling}</span>
                            {player.attributeChanges?.dribbling && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.dribbling}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.dribbling}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">DEF</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-green-600">{player.attributes.defending}</span>
                            {player.attributeChanges?.defending && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.defending}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.defending}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600">PHY</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-orange-600">{player.attributes.physical}</span>
                            {player.attributeChanges?.physical && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full border border-green-200 animate-bounce">
                                +{player.attributeChanges.physical}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{width: `${player.attributes.physical}%`}}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações de treinamento recente */}
                    {player.lastTraining && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between text-xs text-blue-700">
                          <span>🕒 Último treino: {new Date(player.lastTraining).toLocaleDateString('pt-BR')}</span>
                          <span>📊 {player.trainingCount} sessões</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handlePlayerAction(player.id, 'training')}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">🎯</span>
                      Configurar Treino
                    </button>
                    <button
                      onClick={() => handlePlayerAction(player.id, 'details')}
                      className="px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">📊</span>
                      Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Modal de detalhes do jogador */}
      {selectedPlayerForDetails && (
        <PlayerDetailsModal
          player={players.find(p => p.id === selectedPlayerForDetails)!}
          onClose={() => setSelectedPlayerForDetails(null)}
          teamId={teamId}
        />
      )}

      {/* Modal de treino rápido */}
      {showQuickTraining && (
        <QuickTrainingConfigModal
          players={players.filter(p => !p.is_in_academy)} // Apenas jogadores profissionais (não estão na academia)
          onClose={() => setShowQuickTraining(false)}
          onSave={handleQuickTrainingConfig}
          teamId={teamId}
        />
      )}
    </div>
  );
}

// Modal de configuração de treinamento
interface TrainingConfigModalProps {
  player: TrainingPlayer;
  onClose: () => void;
  onSave: (playerId: string, focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => void;
  teamId: string;
}

function TrainingConfigModal({ player, onClose, onSave, teamId }: TrainingConfigModalProps) {
  const [focus, setFocus] = useState(player.training_focus || 'PAS');
  const [intensity, setIntensity] = useState<'baixa' | 'normal' | 'alta'>(player.training_intensity || 'normal');
  const [inAcademy, setInAcademy] = useState(player.is_in_academy || false);

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
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as 'baixa' | 'normal' | 'alta')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="baixa">Baixa (menos risco, menos ganho)</option>
              <option value="normal">Normal (equilibrado)</option>
              <option value="alta">Alta (mais risco, mais ganho)</option>
            </select>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="inAcademy"
              checked={inAcademy}
              onChange={(e) => setInAcademy(e.target.checked)}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
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
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
  player: TrainingPlayer;
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

      const response = await fetch(`http://localhost:3004/api/v2/api/v2/training/player-details/${player.id}?teamId=${teamId}`);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
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
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
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
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
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

// Modal de treino rápido para profissionais
interface QuickTrainingConfigModalProps {
  players: TrainingPlayer[];
  onClose: () => void;
  onSave: (focus: string, intensity: 'baixa' | 'normal' | 'alta', inAcademy: boolean) => void;
  teamId: string;
}

function QuickTrainingConfigModal({ players, onClose, onSave, teamId }: QuickTrainingConfigModalProps) {
  const [focus, setFocus] = useState('PAS');
  const [intensity, setIntensity] = useState<'baixa' | 'normal' | 'alta'>('normal');
  const [inAcademy, setInAcademy] = useState(false);

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
    onSave(focus, intensity, inAcademy);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            Treino Rápido - Profissionais
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configurar treino para {players.length} jogadores profissionais
          </p>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Foco do Treinamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎯 Foco do Treinamento
              </label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="PAC">PAC - Pace (Velocidade)</option>
                <option value="SHO">SHO - Shooting (Finalização)</option>
                <option value="PAS">PAS - Passing (Passe)</option>
                <option value="DRI">DRI - Dribbling (Drible)</option>
                <option value="DEF">DEF - Defending (Defesa)</option>
                <option value="PHY">PHY - Physical (Físico)</option>
              </select>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getFocusColor(focus)} border`}>
                  {focus}
                </span>
              </div>
            </div>

            {/* Intensidade */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💪 Intensidade do Treino
              </label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as 'baixa' | 'normal' | 'alta')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
              </select>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getIntensityColor(intensity)} border`}>
                  {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                </span>
              </div>
              {intensity === 'alta' && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <span>⚠️</span>
                  Intensidade alta pode causar lesões, mas acelera o desenvolvimento.
                </p>
              )}
            </div>

            {/* Status da Academia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏛️ Status na Academia
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inAcademy"
                  checked={inAcademy}
                  onChange={(e) => setInAcademy(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="inAcademy" className="text-sm text-gray-700">
                  Incluir na Academia de Base
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Jogadores na academia recebem treino especial e proteção contra lesões.
              </p>
            </div>

            {/* Resumo */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>📋</span>
                Resumo da Configuração
              </h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Jogadores:</span>
                  <span className="font-semibold text-gray-900 ml-2">{players.length} profissionais</span>
                </div>
                <div>
                  <span className="text-gray-600">Foco:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getFocusColor(focus)}`}>
                    {focus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Intensidade:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getIntensityColor(intensity)}`}>
                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Academia:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${inAcademy ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                    {inAcademy ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Configurar Treino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
