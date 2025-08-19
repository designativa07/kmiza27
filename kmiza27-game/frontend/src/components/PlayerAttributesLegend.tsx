'use client';

import React, { useState } from 'react';
import { ATTRIBUTE_LABELS } from '@/types/player';
import { OVERALL_COLORS } from './PlayerCardCompact';

interface PlayerAttributesLegendProps {
  showDetailed?: boolean;
  compact?: boolean;
}

export default function PlayerAttributesLegend({ 
  showDetailed = false, 
  compact = false 
}: PlayerAttributesLegendProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const attributeDescriptions = {
    PAC: {
      label: 'Ritmo',
      description: 'Velocidade e aceleração do jogador',
      includes: ['Velocidade', 'Aceleração', 'Resistência']
    },
    FIN: {
      label: 'Finalização',
      description: 'Capacidade de marcar gols',
      includes: ['Chute', 'Finalização', 'Chute de longe']
    },
    PAS: {
      label: 'Passe',
      description: 'Precisão e qualidade dos passes',
      includes: ['Passe curto', 'Passe longo', 'Visão de jogo']
    },
    DRI: {
      label: 'Drible',
      description: 'Habilidade com a bola nos pés',
      includes: ['Drible', 'Agilidade', 'Controle de bola']
    },
    DEF: {
      label: 'Defesa',
      description: 'Capacidade defensiva',
      includes: ['Marcação', 'Interceptação', 'Desarme']
    },
    FIS: {
      label: 'Físico',
      description: 'Força física e resistência',
      includes: ['Força', 'Resistência', 'Salto']
    },
    GOL: {
      label: 'Goleiro',
      description: 'Habilidades específicas de goleiro',
      includes: ['Reflexos', 'Posicionamento', 'Saída de gol']
    }
  };

  const overallRanges = [
    { min: 90, max: 99, label: 'Lendário', color: OVERALL_COLORS[90], description: 'Jogadores excepcionais, classe mundial' },
    { min: 85, max: 89, label: 'Excelente', color: OVERALL_COLORS[85], description: 'Jogadores de alto nível, titulares indiscutíveis' },
    { min: 80, max: 84, label: 'Muito Bom', color: OVERALL_COLORS[80], description: 'Jogadores sólidos, bom para séries altas' },
    { min: 75, max: 79, label: 'Bom', color: OVERALL_COLORS[75], description: 'Jogadores competentes, titulares potenciais' },
    { min: 70, max: 74, label: 'Regular', color: OVERALL_COLORS[70], description: 'Jogadores úteis, reservas de qualidade' },
    { min: 0, max: 69, label: 'Fraco', color: OVERALL_COLORS[0], description: 'Jogadores em desenvolvimento ou limitados' }
  ];

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        <span>ℹ️</span>
        <span>Ver legenda dos atributos</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Legenda dos Atributos
        </h3>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Atributos dos jogadores */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Atributos dos Jogadores</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(attributeDescriptions).map(([key, attr]) => (
            <div key={key} className="flex items-start gap-3 p-2 bg-gray-50 rounded-md">
              <div className="font-bold text-sm bg-gray-200 px-2 py-1 rounded text-center min-w-[40px]">
                {key}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{attr.label}</div>
                <div className="text-xs text-gray-600">{attr.description}</div>
                {showDetailed && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Inclui:</span> {attr.includes.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Faixas de Overall */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Faixas de Overall</h4>
        <div className="space-y-2">
          {overallRanges.map((range, index) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
              <div className={`${range.color.bg} w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                {range.min === 0 ? '60' : range.min}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{range.label}</span>
                  <span className="text-xs text-gray-500">
                    ({range.min}-{range.max === 99 ? '99+' : range.max})
                  </span>
                </div>
                <div className="text-xs text-gray-600">{range.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estados dos jogadores */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Estados dos Jogadores</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              🎓 Academia
            </span>
            <span className="text-xs text-gray-600">Jogador em treinamento na academia</span>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
              🏥 Lesão
            </span>
            <span className="text-xs text-gray-600">Jogador lesionado, não pode jogar</span>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
              😴 Cansado
            </span>
            <span className="text-xs text-gray-600">Alta fadiga, performance reduzida</span>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              ⭐ Destaque
            </span>
            <span className="text-xs text-gray-600">Jogador em excelente forma</span>
          </div>
        </div>
      </div>

      {/* Barras de atributos */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Interpretação das Barras</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '85%' }} />
            </div>
            <span className="text-xs text-gray-600 w-20">80+ (Verde)</span>
            <span className="text-xs text-gray-600">Excelente</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div className="bg-amber-400 h-2 rounded-full" style={{ width: '70%' }} />
            </div>
            <span className="text-xs text-gray-600 w-20">70-79 (Amarelo)</span>
            <span className="text-xs text-gray-600">Bom</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '60%' }} />
            </div>
            <span className="text-xs text-gray-600 w-20">&lt;70 (Cinza)</span>
            <span className="text-xs text-gray-600">Regular/Fraco</span>
          </div>
        </div>
      </div>

      {/* Dicas de jogo */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Dicas de Desenvolvimento</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Jogadores jovens (&lt;23 anos) evoluem mais rápido</li>
          <li>• Treino na academia acelera o desenvolvimento</li>
          <li>• Experiência de jogo também contribui para evolução</li>
          <li>• Moral alta aumenta a performance e desenvolvimento</li>
          <li>• Fadiga alta reduz a performance nas partidas</li>
          <li>• Personalidade influencia como o jogador se desenvolve</li>
        </ul>
      </div>
    </div>
  );
}
