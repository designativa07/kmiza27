'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';
import PlayerCardCompact, { PlayerCardData, ATTRIBUTE_LABELS } from './PlayerCardCompact';
import PlayerAttributesLegend from './PlayerAttributesLegend';

interface PlayersManagerReformedProps {
  teamId?: string;
}

export default function PlayersManagerReformed({ teamId }: PlayersManagerReformedProps) {
  const { selectedTeam } = useGameStore();
  const [players, setPlayers] = useState<PlayerCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'elenco' | 'academia' | 'lesoes' | 'estatisticas'>('elenco');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    position: 'all',
    ageMin: 16,
    ageMax: 40,
    overallMin: 40,
    search: ''
  });
  const [showLegend, setShowLegend] = useState(false);
  const [sortBy, setSortBy] = useState<'overall' | 'age' | 'name' | 'position' | 'salary'>('overall');

  const currentTeam = teamId || selectedTeam?.id;

  useEffect(() => {
    if (currentTeam) {
      loadPlayers();
    }
  }, [currentTeam]);

  const loadPlayers = async () => {
    if (!currentTeam) return;
    
    setLoading(true);
    try {
      // Carregar jogadores da API
      const playersData = await gameApiReformed.getPlayers(currentTeam);
      
      // Converter para formato do card
      const formattedPlayers: PlayerCardData[] = playersData.map((player: any) => ({
        id: player.id,
        name: player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        position: player.position || 'CM',
        age: player.age || 25,
        overall: player.overall || Math.round(((player.speed ?? 0) + (player.stamina ?? 0) + (player.strength ?? 0) + (player.passing ?? 0) + (player.shooting ?? 0) + (player.dribbling ?? 0) + (player.defending ?? 0)) / 7),
        potential: player.potential || 75,
        
        attributes: {
          PAC: Math.round(((player.speed ?? 0) + (player.stamina ?? 0)) / 2),
          FIN: player.shooting ?? 0,
          PAS: player.passing ?? 0,
          DRI: player.dribbling ?? 0,
          DEF: player.defending ?? 0,
          FIS: Math.round(((player.strength ?? 0) + (player.stamina ?? 0)) / 2),
          GOL: player.goalkeeping ?? 0
        },
        
        morale: player.morale ?? 60,
        fitness: player.fitness ?? 80,
        form: player.form ?? 5,
        fatigue: player.fatigue ?? 0,
        injury_severity: player.injury_severity ?? 0,
        
        salary: player.salary_monthly ?? 0,
        market_value: player.market_value ?? 0,
        
        training_focus: player.training_focus as keyof typeof ATTRIBUTE_LABELS,
        training_intensity: player.training_intensity as 'baixa' | 'normal' | 'alta',
        is_in_academy: player.is_in_academy ?? false,
        
        personality: player.personality,
        
        games_played: player.games_played ?? 0,
        goals_scored: player.goals_scored ?? 0,
        assists: player.assists ?? 0,
        average_rating: player.average_rating ?? 6.0
      }));
      
      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Erro ao carregar jogadores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar jogadores
  const filteredPlayers = players
    .filter(player => {
      if (filters.position !== 'all' && player.position !== filters.position) return false;
      if (player.age < filters.ageMin || player.age > filters.ageMax) return false;
      if (player.overall < filters.overallMin) return false;
      if (filters.search && !player.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      // Filtros por aba
      if (activeTab === 'academia' && !player.is_in_academy) return false;
      if (activeTab === 'lesoes' && (!player.injury_severity || player.injury_severity === 0)) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'overall': return b.overall - a.overall;
        case 'age': return a.age - b.age;
        case 'name': return a.name.localeCompare(b.name);
        case 'position': return a.position.localeCompare(b.position);
        case 'salary': return (b.salary || 0) - (a.salary || 0);
        default: return 0;
      }
    });

  const handlePlayerAction = async (playerId: string, action: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    try {
      switch (action) {
        case 'edit_training':
          // Abrir modal de treino
          setSelectedPlayer(playerId);
          break;
          
        case 'view_details':
          // Mostrar detalhes do jogador
          alert(`Detalhes de ${player.name} - Em desenvolvimento`);
          break;
          
        case 'promote':
          // Promover da academia
          if (player.is_in_academy) {
            await gameApiReformed.setTraining({
              playerId,
              focus: player.training_focus || 'PAS',
              intensity: 'normal',
              inAcademy: false
            });
            await loadPlayers();
          }
          break;
          
        case 'to_academy':
          // Enviar para academia
          await gameApiReformed.setTraining({
            playerId,
            focus: player.training_focus || 'PAS',
            intensity: 'normal',
            inAcademy: true
          });
          await loadPlayers();
          break;
      }
    } catch (error) {
      console.error('Erro na ação do jogador:', error);
    }
  };

  const applyTrainingWeek = async () => {
    if (!currentTeam) return;
    
    try {
      setLoading(true);
      await gameApiReformed.applyTrainingWeek(currentTeam);
      await loadPlayers();
      alert('Semana de treino aplicada com sucesso!');
    } catch (error) {
      console.error('Erro ao aplicar semana de treino:', error);
      alert('Erro ao aplicar treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">👥 Gerenciamento de Jogadores</h2>
        <p className="text-gray-700">Selecione um time para gerenciar os jogadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              👥 Gerenciamento de Jogadores
            </h2>
            <p className="text-gray-600">{players.length} jogadores no elenco</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={applyTrainingWeek}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Processando...' : '🏃 Aplicar Semana de Treino'}
            </button>
            
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              📊 {showLegend ? 'Ocultar' : 'Mostrar'} Legenda
            </button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      {showLegend && (
        <PlayerAttributesLegend showDetailed={true} />
      )}

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-1 mb-4">
          {[
            { key: 'elenco', label: 'Elenco Principal', count: players.filter(p => !p.is_in_academy).length },
            { key: 'academia', label: 'Academia', count: players.filter(p => p.is_in_academy).length },
            { key: 'lesoes', label: 'Lesionados', count: players.filter(p => p.injury_severity && p.injury_severity > 0).length },
            { key: 'estatisticas', label: 'Estatísticas', count: 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
            <select
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todas</option>
              <option value="GK">Goleiro</option>
              <option value="CB">Zagueiro</option>
              <option value="LB">Lateral Esq.</option>
              <option value="RB">Lateral Dir.</option>
              <option value="CM">Meio-campo</option>
              <option value="ST">Atacante</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Mín.</label>
            <input
              type="range"
              min="40"
              max="99"
              value={filters.overallMin}
              onChange={(e) => setFilters(prev => ({ ...prev, overallMin: Number(e.target.value) }))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{filters.overallMin}+</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nome do jogador..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="overall">Overall</option>
              <option value="age">Idade</option>
              <option value="name">Nome</option>
              <option value="position">Posição</option>
              <option value="salary">Salário</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                position: 'all',
                ageMin: 16,
                ageMax: 40,
                overallMin: 40,
                search: ''
              })}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de jogadores */}
      {loading ? (
        <div className="card text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando jogadores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map(player => (
            <PlayerCardCompact
              key={player.id}
              player={player}
              onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
              onActionClick={(action) => handlePlayerAction(player.id, action)}
              showActions={selectedPlayer === player.id}
              isSelected={selectedPlayer === player.id}
              size="medium"
            />
          ))}
        </div>
      )}

      {filteredPlayers.length === 0 && !loading && (
        <div className="card text-center py-8">
          <p className="text-gray-700">
            {activeTab === 'academia' ? 'Nenhum jogador na academia.' :
             activeTab === 'lesoes' ? 'Nenhum jogador lesionado.' :
             'Nenhum jogador encontrado com os filtros aplicados.'}
          </p>
        </div>
      )}

      {/* Estatísticas (se aba ativa) */}
      {activeTab === 'estatisticas' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">📈 Estatísticas do Elenco</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length)}
              </div>
              <div className="text-sm text-blue-800">Overall Médio</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(players.reduce((sum, p) => sum + (p.age || 0), 0) / players.length)}
              </div>
              <div className="text-sm text-green-800">Idade Média</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                R$ {Math.round(players.reduce((sum, p) => sum + (p.salary || 0), 0) / 1000)}k
              </div>
              <div className="text-sm text-purple-800">Folha Salarial</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">
                {players.filter(p => p.is_in_academy).length}
              </div>
              <div className="text-sm text-amber-800">Na Academia</div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>• Jogadores jovens (&lt;23 anos): {players.filter(p => p.age < 23).length}</p>
            <p>• Jogadores experientes (30+ anos): {players.filter(p => p.age >= 30).length}</p>
            <p>• Jogadores com overall 80+: {players.filter(p => p.overall >= 80).length}</p>
            <p>• Jogadores lesionados: {players.filter(p => p.injury_severity && p.injury_severity > 0).length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
