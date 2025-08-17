'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    position: string;
    age: number;
    overall: number;
    potential: number;
    attributes: PlayerAttributes;
    training_focus?: string;
    training_intensity?: 'baixa' | 'normal' | 'alta';
    is_in_academy?: boolean;
    type?: 'youth' | 'professional';
    attributeChanges?: PlayerAttributes;
    lastTraining?: string;
    trainingCount?: number;
    morale?: number;
    fitness?: number;
    form?: number;
  };
  
  // Props para controlar o que mostrar
  showTrainingStatus?: boolean;
  showAttributes?: boolean;
  showPhysicalStats?: boolean;
  showTrainingHistory?: boolean;
  
  // Props para ações
  onConfigureTraining?: (playerId: string) => void;
  onViewDetails?: (playerId: string) => void;
  onListPlayer?: (playerId: string) => void;
  onFirePlayer?: (playerId: string) => void;
  onPromotePlayer?: (playerId: string) => void;
  onSendToAcademy?: (playerId: string) => void;
  onRemoveFromAcademy?: (playerId: string) => void;
  
  // Props para contexto
  context?: 'academy' | 'training' | 'roster' | 'market';
  
  // Props para estilização
  className?: string;
}

export default function PlayerCard({
  player,
  showTrainingStatus = true,
  showAttributes = true,
  showPhysicalStats = false,
  showTrainingHistory = false,
  onConfigureTraining,
  onViewDetails,
  onListPlayer,
  onFirePlayer,
  onPromotePlayer,
  onSendToAcademy,
  onRemoveFromAcademy,
  context = 'roster',
  className = ''
}: PlayerCardProps) {
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getTypeColor = (type?: string) => {
    if (type === 'youth') return 'bg-green-100 text-green-800';
    if (type === 'professional') return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getTypeLabel = (type?: string) => {
    if (type === 'youth') return 'Júnior';
    if (type === 'professional') return 'Profissional';
    return 'Jogador';
  };

  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false);
    
    switch (action) {
      case 'training':
        onConfigureTraining?.(player.id);
        break;
      case 'details':
        onViewDetails?.(player.id);
        break;
      case 'sell':
        onListPlayer?.(player.id);
        break;
      case 'fire':
        onFirePlayer?.(player.id);
        break;
      case 'promote':
        onPromotePlayer?.(player.id);
        break;
      case 'academy':
        if (player.is_in_academy) {
          onRemoveFromAcademy?.(player.id);
        } else {
          onSendToAcademy?.(player.id);
        }
        break;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative ${className}`}>
      {/* Menu dropdown no canto superior direito */}
      <div className="absolute top-4 right-4" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Menu de ações"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              {/* Treino */}
              {onConfigureTraining && (
                <button
                  onClick={() => handleMenuAction('training')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                >
                  <span className="text-lg">🎯</span>
                  Configurar Treino
                </button>
              )}

              {/* Detalhes */}
              {onViewDetails && (
                <button
                  onClick={() => handleMenuAction('details')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                >
                  <span className="text-lg">📊</span>
                  Ver Detalhes
                </button>
              )}

              {/* Vender/Listar */}
              {onListPlayer && context === 'roster' && (
                <button
                  onClick={() => handleMenuAction('sell')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                >
                  <span className="text-lg">📋</span>
                  Listar no Mercado
                </button>
              )}

              {/* Academia */}
              {(onSendToAcademy || onRemoveFromAcademy) && (
                <button
                  onClick={() => handleMenuAction('academy')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                >
                  <span className="text-lg">
                    {player.is_in_academy ? '⏸️' : '🏛️'}
                  </span>
                  {player.is_in_academy ? 'Remover da Academia' : 'Enviar para Academia'}
                </button>
              )}

              {/* Promover */}
              {onPromotePlayer && player.type === 'youth' && (
                <button
                  onClick={() => handleMenuAction('promote')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                >
                  <span className="text-lg">⬆️</span>
                  Promover para Profissional
                </button>
              )}

              {/* Separador */}
              <div className="border-t border-gray-200 my-1"></div>

              {/* Demitir */}
              {onFirePlayer && context === 'roster' && (
                <button
                  onClick={() => handleMenuAction('fire')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                >
                  <span className="text-lg">🚫</span>
                  Demitir Jogador
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header do jogador */}
      <div className="flex items-center justify-between mb-4 pr-12">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{player.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {player.position}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {player.age} anos
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(player.type)}`}>
              {getTypeLabel(player.type)}
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

      {/* Status de treinamento - condicional */}
      {showTrainingStatus && player.training_focus && player.training_intensity && (
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
      )}

      {/* Atributos - condicional */}
      {showAttributes && (
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
        </div>
      )}

      {/* Estatísticas físicas - condicional */}
      {showPhysicalStats && (player.morale !== undefined || player.fitness !== undefined || player.form !== undefined) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">💪</span>
            Condição Física
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {player.morale !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Moral:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  player.morale >= 80 ? 'text-green-600 bg-green-100' :
                  player.morale >= 60 ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                } border`}>
                  {player.morale}
                </span>
              </div>
            )}
            {player.fitness !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Fitness:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  player.fitness >= 85 ? 'text-green-600 bg-green-100' :
                  player.fitness >= 70 ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                } border`}>
                  {player.fitness}
                </span>
              </div>
            )}
            {player.form !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Forma:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  player.form >= 80 ? 'text-green-600 bg-green-100' :
                  player.form >= 60 ? 'text-yellow-600 bg-yellow-100' :
                  'text-red-600 bg-red-100'
                } border`}>
                  {player.form}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de treinamento - condicional */}
      {showTrainingHistory && player.lastTraining && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-700">
            <span>🕒 Último treino: {new Date(player.lastTraining).toLocaleDateString('pt-BR')}</span>
            {player.trainingCount && <span>📊 {player.trainingCount} sessões</span>}
          </div>
        </div>
      )}
    </div>
  );
}
