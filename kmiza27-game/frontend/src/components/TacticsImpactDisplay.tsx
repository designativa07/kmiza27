'use client';

import React from 'react';

interface TacticsImpactProps {
  tactics: {
    formation: string;
    style: 'defensivo' | 'equilibrado' | 'ofensivo';
    pressing: 'baixa' | 'média' | 'alta';
    width: 'estreito' | 'normal' | 'largo';
    tempo: 'lento' | 'normal' | 'rápido';
  };
  teamOverall?: number;
}

export default function TacticsImpactDisplay({ tactics, teamOverall = 75 }: TacticsImpactProps) {
  
  // Calcular impactos táticos baseado na lógica do backend
  const calculateImpacts = () => {
    let attackBonus = 0;
    let midfieldBonus = 0;
    let defenseBonus = 0;
    let cohesion = 70;

    // Modificadores por estilo
    switch (tactics.style) {
      case 'ofensivo':
        attackBonus += 15;
        midfieldBonus += 5;
        defenseBonus -= 10;
        break;
      case 'defensivo':
        attackBonus -= 10;
        midfieldBonus += 5;
        defenseBonus += 15;
        break;
      case 'equilibrado':
        attackBonus += 2;
        midfieldBonus += 8;
        defenseBonus += 2;
        break;
    }

    // Modificadores por formação
    switch (tactics.formation) {
      case '4-4-2':
        cohesion += 10;
        midfieldBonus += 5;
        break;
      case '4-3-3':
        attackBonus += 8;
        defenseBonus -= 3;
        break;
      case '4-2-3-1':
        midfieldBonus += 8;
        defenseBonus += 3;
        break;
      case '3-5-2':
        midfieldBonus += 12;
        defenseBonus -= 5;
        break;
      case '5-3-2':
        defenseBonus += 12;
        attackBonus -= 8;
        break;
    }

    // Modificadores por pressing
    switch (tactics.pressing) {
      case 'alta':
        midfieldBonus += 8;
        defenseBonus += 5;
        cohesion -= 5;
        break;
      case 'baixa':
        defenseBonus += 8;
        attackBonus -= 5;
        cohesion += 5;
        break;
    }

    // Ajustar pela qualidade dos jogadores
    const tacticalExecution = (teamOverall - 50) * 0.1;

    return {
      attack: attackBonus + tacticalExecution,
      midfield: midfieldBonus + tacticalExecution,
      defense: defenseBonus + tacticalExecution,
      cohesion: Math.max(30, Math.min(100, cohesion + tacticalExecution))
    };
  };

  const impacts = calculateImpacts();

  const getImpactColor = (value: number) => {
    if (value > 5) return 'text-green-600 bg-green-100';
    if (value > 0) return 'text-blue-600 bg-blue-100';
    if (value > -5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatImpact = (value: number) => {
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  };

  const getStyleDescription = () => {
    const descriptions = {
      'defensivo': 'Prioriza a segurança defensiva. Reduz o ataque mas aumenta a defesa.',
      'equilibrado': 'Balanceamento entre ataque e defesa. Boa coesão da equipe.',
      'ofensivo': 'Foca no ataque. Aumenta o poder ofensivo mas pode deixar a defesa vulnerável.'
    };
    return descriptions[tactics.style];
  };

  const getFormationDescription = () => {
    const descriptions = {
      '4-4-2': 'Formação clássica e equilibrada. Excelente coesão e controle do meio-campo.',
      '4-3-3': 'Formação ofensiva com três atacantes. Forte no ataque mas pode ser vulnerável atrás.',
      '4-2-3-1': 'Formação moderna com foco no meio-campo criativo e proteção defensiva.',
      '3-5-2': 'Formação que domina o meio-campo mas sacrifica solidez defensiva.',
      '5-3-2': 'Formação ultra-defensiva com cinco defensores e dois atacantes.'
    };
    return descriptions[tactics.formation as keyof typeof descriptions] || 'Formação personalizada.';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Impacto das Táticas na Simulação
        </h3>
        <div className="text-sm text-gray-600">
          Overall do Time: {teamOverall}
        </div>
      </div>

      {/* Impactos numéricos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-3 rounded-lg text-center ${getImpactColor(impacts.attack)}`}>
          <div className="text-2xl font-bold">
            {formatImpact(impacts.attack)}
          </div>
          <div className="text-sm font-medium">Ataque</div>
        </div>
        
        <div className={`p-3 rounded-lg text-center ${getImpactColor(impacts.midfield)}`}>
          <div className="text-2xl font-bold">
            {formatImpact(impacts.midfield)}
          </div>
          <div className="text-sm font-medium">Meio-Campo</div>
        </div>
        
        <div className={`p-3 rounded-lg text-center ${getImpactColor(impacts.defense)}`}>
          <div className="text-2xl font-bold">
            {formatImpact(impacts.defense)}
          </div>
          <div className="text-sm font-medium">Defesa</div>
        </div>
        
        <div className={`p-3 rounded-lg text-center ${getImpactColor(impacts.cohesion - 70)}`}>
          <div className="text-2xl font-bold">
            {impacts.cohesion.toFixed(0)}%
          </div>
          <div className="text-sm font-medium">Coesão</div>
        </div>
      </div>

      {/* Descrições detalhadas */}
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="font-semibold text-blue-800 mb-1">
            Estilo: {tactics.style.charAt(0).toUpperCase() + tactics.style.slice(1)}
          </h4>
          <p className="text-blue-700 text-sm">{getStyleDescription()}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <h4 className="font-semibold text-green-800 mb-1">
            Formação: {tactics.formation}
          </h4>
          <p className="text-green-700 text-sm">{getFormationDescription()}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
          <h4 className="font-semibold text-purple-800 mb-1">
            Configurações Avançadas
          </h4>
          <div className="text-purple-700 text-sm space-y-1">
            <div><strong>Pressing:</strong> {tactics.pressing} - {
              tactics.pressing === 'alta' ? 'Pressiona alto, gasta mais energia' :
              tactics.pressing === 'baixa' ? 'Conserva energia, foca na defesa' :
              'Equilíbrio entre pressing e conservação'
            }</div>
            <div><strong>Largura:</strong> {tactics.width} - {
              tactics.width === 'largo' ? 'Usa toda a largura do campo' :
              tactics.width === 'estreito' ? 'Jogo mais centralizado' :
              'Largura padrão'
            }</div>
            <div><strong>Tempo:</strong> {tactics.tempo} - {
              tactics.tempo === 'rápido' ? 'Jogo direto e acelerado' :
              tactics.tempo === 'lento' ? 'Posse de bola, construção lenta' :
              'Ritmo equilibrado'
            }</div>
          </div>
        </div>
      </div>

      {/* Dicas estratégicas */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
        <h4 className="font-semibold text-amber-800 mb-2">💡 Dicas Estratégicas</h4>
        <ul className="text-amber-700 text-sm space-y-1">
          <li>• Jogadores melhores executam táticas mais complexas com maior eficiência</li>
          <li>• Moral e forma dos jogadores influenciam a execução tática</li>
          <li>• Fadiga reduz a efetividade das táticas durante a partida</li>
          <li>• Times com melhor coesão performam melhor em momentos decisivos</li>
          <li>• Ajuste suas táticas baseado no oponente e situação do jogo</li>
        </ul>
      </div>

      {/* Barra de efetividade geral */}
      <div className="bg-gray-50 rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Efetividade Tática Geral</span>
          <span className="text-sm text-gray-600">
            {((impacts.cohesion + Math.max(0, impacts.attack) + Math.max(0, impacts.midfield) + Math.max(0, impacts.defense)) / 4).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(100, ((impacts.cohesion + Math.max(0, impacts.attack) + Math.max(0, impacts.midfield) + Math.max(0, impacts.defense)) / 4))}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
