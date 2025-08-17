'use client';

import React from 'react';
import { FaArrowUp, FaDollarSign, FaDumbbell, FaPlus } from 'react-icons/fa';
import { PlayerCardData, ATTRIBUTE_LABELS } from '@/types/player';

// Abreviaturas em português para exibição compacta
export const ATTRIBUTE_ABBREVIATIONS = {
  PAC: 'RIT',
  FIN: 'FIN',
  PAS: 'PAS',
  DRI: 'DRI',
  DEF: 'DEF',
  FIS: 'FIS',
  GOL: 'GOL'
} as const;

// Cores por faixa de overall
export const OVERALL_COLORS = {
  90: { bg: 'bg-purple-500', text: 'text-purple-600' },
  85: { bg: 'bg-blue-500', text: 'text-blue-600' },
  80: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
  75: { bg: 'bg-amber-500', text: 'text-amber-600' },
  70: { bg: 'bg-orange-500', text: 'text-orange-600' },
  0: { bg: 'bg-gray-400', text: 'text-gray-600' }
} as const;

// Cores por posição
export const POSITION_COLORS = {
  GK: 'bg-yellow-500',
  CB: 'bg-red-500',
  LB: 'bg-red-400', 
  RB: 'bg-red-400',
  CDM: 'bg-blue-500',
  CM: 'bg-blue-400',
  CAM: 'bg-blue-300',
  LM: 'bg-blue-400',
  RM: 'bg-blue-400',
  LW: 'bg-green-500',
  RW: 'bg-green-500',
  ST: 'bg-purple-500',
  CF: 'bg-purple-400'
} as const;

// Abreviaturas em português para posições
export const POSITION_ABBREVIATIONS = {
  GK: 'GOL',
  CB: 'ZAG',
  LB: 'LE',
  RB: 'LD',
  CDM: 'VOL',
  CM: 'MC',
  CAM: 'MO',
  LM: 'ME',
  RM: 'MD',
  LW: 'PE',
  RW: 'PD',
  ST: 'ATA',
  CF: 'SA'
} as const;

interface PlayerCardCompactProps {
  player: PlayerCardData;
  onClick?: () => void;
  onActionClick?: (action: string) => void;
  showActions?: boolean;
  isSelected?: boolean;
  size?: 'small' | 'medium' | 'large';
  playerType: 'youth' | 'professional'; // <-- NOVA PROP
}

export default function PlayerCardCompact({
  player,
  onClick,
  onActionClick,
  showActions = false,
  isSelected = false,
  size = 'medium',
  playerType, // <-- NOVA PROP
}: PlayerCardCompactProps) {
  
  // Determinar cores baseadas no overall
  const getOverallColor = (overall: number) => {
    if (overall >= 90) return OVERALL_COLORS[90];
    if (overall >= 85) return OVERALL_COLORS[85];
    if (overall >= 80) return OVERALL_COLORS[80];
    if (overall >= 75) return OVERALL_COLORS[75];
    if (overall >= 70) return OVERALL_COLORS[70];
    return OVERALL_COLORS[0];
  };

  const overallColor = getOverallColor(player.overall);
  const positionColor = POSITION_COLORS[player.position as keyof typeof POSITION_COLORS] || 'bg-gray-500';

  // Determinar tamanhos baseados no size prop
  const sizeClasses = {
    small: {
      card: 'p-2',
      avatar: 'w-8 h-8 text-xs',
      overall: 'w-6 h-6 text-xs',
      text: 'text-xs',
      name: 'text-sm font-medium',
      attributes: 'text-[10px] gap-1'
    },
    medium: {
      card: 'p-3',
      avatar: 'w-10 h-10 text-sm',
      overall: 'w-8 h-8 text-sm',
      text: 'text-sm',
      name: 'text-base font-semibold',
      attributes: 'text-xs gap-2'
    },
    large: {
      card: 'p-4',
      avatar: 'w-12 h-12 text-base',
      overall: 'w-10 h-10 text-base',
      text: 'text-base',
      name: 'text-lg font-semibold',
      attributes: 'text-sm gap-2'
    }
  };

  const classes = sizeClasses[size];

  // Indicadores de estado
  const getStatusIndicators = () => {
    const indicators = [];
    
    if (player.injury_severity && player.injury_severity > 0) {
      indicators.push(
        <span key="injury" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-800">
          🏥 Lesão
        </span>
      );
    }
    
    if (player.is_in_academy) {
      indicators.push(
        <span key="academy" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
          🎓 Academia
        </span>
      );
    }
    
    if (player.fatigue && player.fatigue > 70) {
      indicators.push(
        <span key="fatigue" className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
          😴 Cansado
        </span>
      );
    }

    return indicators;
  };

  // Barra de atributo
  const AttributeBar = ({ label, value, max = 99 }: { label: string; value: number; max?: number }) => {
    const percentage = (value / max) * 100;
    const barColor = value >= 80 ? 'bg-emerald-400' : value >= 70 ? 'bg-amber-400' : 'bg-gray-400';
    
    // Usar abreviaturas em português
    const abbreviation = ATTRIBUTE_ABBREVIATIONS[label as keyof typeof ATTRIBUTE_ABBREVIATIONS] || label;
    
    return (
      <div className="flex items-center gap-1">
        <span className={`font-medium ${classes.text} w-8 text-center`}>{abbreviation}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
          <div 
            className={`${barColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={`font-bold ${classes.text} w-6 text-center`}>{value}</span>
      </div>
    );
  };

  // Atributos principais para mostrar (exclui GOL se não for goleiro)
  const attributesToShow = player.position === 'GK' 
    ? ['GOL', 'DEF', 'FIS'] 
    : ['PAC', 'FIN', 'PAS', 'DRI', 'DEF', 'FIS'];

  return (
    <div 
      className={`
        border rounded-lg bg-white hover:shadow-md transition-all duration-200 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200 hover:border-gray-300'}
        ${classes.card}
      `}
      onClick={onClick}
    >
      {/* Header com avatar e overall */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Avatar com posição */}
          <div className={`${positionColor} ${classes.avatar} rounded-full flex items-center justify-center text-white font-bold`}>
            {POSITION_ABBREVIATIONS[player.position as keyof typeof POSITION_ABBREVIATIONS] || player.position}
          </div>
          
          {/* Nome e informações básicas */}
          <div className="flex-1 min-w-0">
            <h3 className={`${classes.name} text-gray-900 truncate`}>
              {player.name}
            </h3>
            <p className={`${classes.text} text-gray-600`}>
              {player.age} anos
              {player.personality && <span className="ml-1">• {player.personality}</span>}
            </p>
          </div>
        </div>
        
        {/* Overall */}
        <div className={`${overallColor.bg} ${classes.overall} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
          {player.overall}
        </div>
      </div>

      {/* Indicadores de estado */}
      {getStatusIndicators().length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {getStatusIndicators()}
        </div>
      )}

      {/* Atributos em barras compactas */}
      <div className={`space-y-1 ${classes.attributes}`}>
        {attributesToShow.map(attr => (
          <AttributeBar 
            key={attr}
            label={attr}
            value={player.attributes[attr as keyof typeof player.attributes] ?? 0}
          />
        ))}
      </div>

      {/* Informações adicionais em modo médio/grande */}
      {size !== 'small' && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            {player.potential && (
              <div>
                <span className="font-medium">Potencial:</span> {player.potential}
              </div>
            )}
            {player.salary && (
              <div>
                <span className="font-medium">Salário:</span> R$ {(player.salary / 1000).toFixed(0)}k
              </div>
            )}
            {player.games_played !== undefined && (
              <div>
                <span className="font-medium">Jogos:</span> {player.games_played}
              </div>
            )}
            {player.average_rating && (
              <div>
                <span className="font-medium">Média:</span> {player.average_rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seção de Ações */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-around gap-2">
          {playerType === 'youth' ? (
            <button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation(); // Evita que o clique feche o card
                onActionClick?.('promote');
              }}
            >
              <FaArrowUp />
              Promover
            </button>
          ) : (
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.('sell');
              }}
            >
              <FaDollarSign />
              Vender
            </button>
          )}

          <button
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.('train');
            }}
          >
            <FaDumbbell />
            Treinar
          </button>
        </div>
      )}
    </div>
  );
}
