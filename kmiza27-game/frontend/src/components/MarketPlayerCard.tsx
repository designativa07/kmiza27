import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, User, Target, TrendingUp, Building2 } from 'lucide-react';

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
  listingPrice: number;
  sellingTeam: string;
  onMakeOffer: () => void;
}

export default function MarketPlayerCard({
  player,
  playerType,
  listingPrice,
  sellingTeam,
  onMakeOffer
}: MarketPlayerCardProps) {
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      GK: 'bg-yellow-500',
      CB: 'bg-red-500',
      LB: 'bg-red-400',
      RB: 'bg-red-400',
      DM: 'bg-blue-500',
      CM: 'bg-blue-400',
      AM: 'bg-blue-300',
      LW: 'bg-green-500',
      RW: 'bg-green-500',
      ST: 'bg-purple-500'
    };
    return colors[position] || 'bg-gray-500';
  };

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return 'bg-purple-500';
    if (overall >= 85) return 'bg-blue-500';
    if (overall >= 80) return 'bg-emerald-500';
    if (overall >= 75) return 'bg-amber-500';
    if (overall >= 70) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {player.name}
            </CardTitle>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`${getPositionColor(player.position)} text-white border-0`}
              >
                {player.position}
              </Badge>
              
              <Badge variant="outline">
                {playerType === 'youth' ? 'Jogador da Base' : 'Jogador Profissional'}
              </Badge>
            </div>
          </div>
          
          <div className={`${getOverallColor(player.current_ability)} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg`}>
            {player.current_ability}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estatísticas do jogador */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Habilidade Atual</p>
              <p className="font-semibold">{player.current_ability}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Potencial</p>
              <p className="font-semibold">{player.potential_ability}</p>
            </div>
          </div>
        </div>
        
        {/* Informações do mercado */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Time Vendedor</span>
            </div>
            <span className="text-sm font-medium">{sellingTeam}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Preço de Listagem</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              R$ {listingPrice.toLocaleString()}
            </span>
          </div>
          
          {player.market_value && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Valor de Mercado</span>
              </div>
              <span className="text-sm text-gray-600">
                R$ {player.market_value.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        
        {/* Botão de ação */}
        <Button 
          onClick={onMakeOffer}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
        >
          Fazer Oferta
        </Button>
      </CardContent>
    </Card>
  );
}
