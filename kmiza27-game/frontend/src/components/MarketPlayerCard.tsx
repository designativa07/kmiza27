import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User, Target, TrendingUp, Building2, Star, Zap, Shield, Heart, Brain, Footprints } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MarketPlayer {
  id: string;
  name: string;
  position: string;
  current_ability: number;
  potential_ability: number;
  market_value?: number;
  team_id: string;
}

interface MarketPlayerCardProps {
  player: MarketPlayer;
  playerType: 'youth' | 'professional';
  sellingTeam: string;
  onMakeOffer: () => void;
  existingOffer?: {
    id: string;
    offer_price: number;
    offer_status: string;
    created_at: string;
  };
}

export default function MarketPlayerCard({
  player,
  playerType,
  sellingTeam,
  onMakeOffer,
  existingOffer
}: MarketPlayerCardProps) {
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      GK: 'bg-gradient-to-r from-yellow-500 to-amber-500',
      CB: 'bg-gradient-to-r from-red-500 to-pink-500',
      LB: 'bg-gradient-to-r from-red-400 to-pink-400',
      RB: 'bg-gradient-to-r from-red-400 to-pink-400',
      DM: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      CM: 'bg-gradient-to-r from-blue-400 to-indigo-400',
      AM: 'bg-gradient-to-r from-blue-300 to-indigo-300',
      LW: 'bg-gradient-to-r from-green-500 to-emerald-500',
      RW: 'bg-gradient-to-r from-green-500 to-emerald-500',
      ST: 'bg-gradient-to-r from-purple-500 to-violet-500'
    };
    return colors[position] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return 'bg-gradient-to-r from-purple-500 to-violet-500';
    if (overall >= 85) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (overall >= 80) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    if (overall >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (overall >= 70) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getPotentialColor = (potential: number) => {
    if (potential >= 90) return 'text-purple-600 bg-purple-100 border-purple-200';
    if (potential >= 85) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (potential >= 80) return 'text-emerald-600 bg-emerald-100 border-emerald-200';
    if (potential >= 75) return 'text-amber-600 bg-amber-100 border-amber-200';
    if (potential >= 70) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  // Simular atributos baseados na habilidade atual (para mostrar as barras)
  const simulateAttributes = (overall: number) => {
    const base = Math.max(50, overall - 10);
    const variation = 15;
    return {
      pace: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation)),
      shooting: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation)),
      passing: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation)),
      dribbling: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation)),
      defending: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation)),
      physical: Math.min(100, Math.max(30, base + (Math.random() - 0.5) * variation))
    };
  };

  const attributes = simulateAttributes(player.current_ability);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden">
      {/* Header do jogador com gradiente - Reformulado para ser mais compacto */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl">⚽</span>
              {player.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className={`${getPositionColor(player.position)} text-white border-0 shadow-sm text-xs px-2 py-1`}
              >
                {player.position}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-1 ${
                  playerType === 'youth' ? 
                    'bg-green-100 text-green-800 border-green-200' : 
                    'bg-blue-100 text-blue-800 border-blue-200'
                }`}
              >
                {playerType === 'youth' ? '🏆 Júnior' : '👔 Profissional'}
              </Badge>
            </div>
          </div>
          
          {/* Overall e Potencial - Mais compactos */}
          <div className="text-right ml-3">
            <div className={`${getOverallColor(player.current_ability)} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg mb-1`}>
              {player.current_ability}
            </div>
            <div className="text-xs text-gray-500 font-medium">Overall</div>
            <div className={`text-sm font-bold px-2 py-1 rounded-full ${getPotentialColor(player.potential_ability)} border`}>
              {player.potential_ability}
            </div>
            <div className="text-xs text-gray-500 font-medium">Potencial</div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-6 space-y-6">
        {/* Atributos com barras coloridas */}
        <div>
          <h4 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            Atributos
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">PAC</span>
                <span className="text-sm font-bold text-purple-600">{Math.round(attributes.pace)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.pace}%`}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">SHO</span>
                <span className="text-sm font-bold text-red-600">{Math.round(attributes.shooting)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.shooting}%`}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">PAS</span>
                <span className="text-sm font-bold text-blue-600">{Math.round(attributes.passing)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.passing}%`}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">DRI</span>
                <span className="text-sm font-bold text-yellow-600">{Math.round(attributes.dribbling)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.dribbling}%`}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">DEF</span>
                <span className="text-sm font-bold text-green-600">{Math.round(attributes.defending)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.defending}%`}}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-600">PHY</span>
                <span className="text-sm font-bold text-orange-600">{Math.round(attributes.physical)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{width: `${attributes.physical}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações de mercado */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-lg">💰</span>
            Informações de Mercado
          </h4>
          
          <div className="space-y-3">
            {/* Time vendedor */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Time Vendedor</span>
              <span className="text-sm font-bold text-gray-900">{sellingTeam}</span>
            </div>
            
            {/* Valor de mercado */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Valor de Mercado</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(player.market_value || 0)}</span>
            </div>
          </div>
        </div>
        
        {/* Informações da oferta existente */}
        {existingOffer && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💼</span>
                Sua Oferta
              </h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatCurrency(existingOffer.offer_price)}
                  </span>
                </div>
                
                {/* The counterOfferPrice is removed from the interface, so this block is removed */}
              </div>
            </div>
          </div>
        )}
        
        {/* Botão de ação dinâmico */}
        <div className="pt-4">
          {existingOffer ? (
            <div className="space-y-2">
              {/* The counterOfferPrice is removed from the interface, so this block is simplified */}
              {existingOffer.offer_status === 'pending' ? (
                <Button 
                  onClick={onMakeOffer}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span className="text-lg mr-2">🤝</span>
                  Ver Contraproposta
                </Button>
              ) : existingOffer.offer_status === 'pending' ? (
                <Button 
                  disabled
                  className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold py-3 cursor-not-allowed"
                >
                  <span className="text-lg mr-2">⏳</span>
                  Oferta Pendente
                </Button>
              ) : existingOffer.offer_status === 'accepted' ? (
                <Button 
                  disabled
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 cursor-not-allowed"
                >
                  <span className="text-lg mr-2">✅</span>
                  Oferta Aceita
                </Button>
              ) : (
                <Button 
                  onClick={onMakeOffer}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span className="text-lg mr-2">🔄</span>
                  Nova Oferta
                </Button>
              )}
            </div>
          ) : (
            <Button 
              onClick={onMakeOffer}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span className="text-lg mr-2">💰</span>
              Fazer Oferta
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
