import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Trash2, DollarSign, Clock, User, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Offer {
  id: string;
  player_id: string;
  player_name?: string;
  is_youth_player: boolean;
  listing_price: number;
  offer_price: number;
  offer_status: string;
  offer_made_at: string;
  buying_team?: { name: string };
  selling_team?: { name: string };
  counter_offer_price?: number;
}

interface OffersManagerProps {
  receivedOffers: Offer[];
  madeOffers: Offer[];
  onAcceptOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onMakeCounterOffer: (offerId: string, currentPrice: number) => void;
  onAcceptCounterOffer: (offerId: string) => void;
  onDeleteOffer: (offerId: string, type: 'received' | 'made') => void;
  isProcessingOffer: string | null;
  onRefresh: () => void;
}

const OffersManager: React.FC<OffersManagerProps> = ({
  receivedOffers,
  madeOffers,
  onAcceptOffer,
  onRejectOffer,
  onMakeCounterOffer,
  onAcceptCounterOffer,
  onDeleteOffer,
  isProcessingOffer,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'made'>('received');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'counter_offered': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'rejected': return 'Recusada';
      case 'counter_offered': return 'Contraproposta';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canDeleteOffer = (offer: Offer) => {
    return offer.offer_status === 'accepted' || 
           offer.offer_status === 'rejected' || 
           offer.offer_status === 'completed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Gerenciamento de Ofertas</h3>
        <div className="flex gap-2">
          <Button 
            onClick={onRefresh}
            variant="outline"
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ofertas Recebidas ({receivedOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('made')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'made'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Ofertas Feitas ({madeOffers.length})
        </button>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Ofertas Recebidas para Seus Jogadores</h4>
          
          {receivedOffers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma oferta recebida</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {receivedOffers.map((offer) => (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {offer.is_youth_player ? '🏆 Júnior' : '👔 Profissional'}
                        </Badge>
                        <Badge className={getStatusColor(offer.offer_status)}>
                          {getStatusText(offer.offer_status)}
                        </Badge>
                      </div>
                      
                      <h5 className="font-semibold text-gray-900 mb-1">
                        {offer.player_name || 'Jogador'}
                      </h5>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><Building2 className="h-3 w-3 inline mr-1" />Time: {offer.buying_team?.name}</p>
                        <p><DollarSign className="h-3 w-3 inline mr-1" />Oferta: {formatCurrency(offer.offer_price)}</p>
                        <p><Clock className="h-3 w-3 inline mr-1" />{formatDate(offer.offer_made_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ações baseadas no status */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {offer.offer_status === 'pending' && (
                      <>
                        <Button
                          onClick={() => onAcceptOffer(offer.id)}
                          disabled={isProcessingOffer === offer.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          onClick={() => onRejectOffer(offer.id)}
                          disabled={isProcessingOffer === offer.id}
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                        <Button
                          onClick={() => onMakeCounterOffer(offer.id, offer.offer_price)}
                          disabled={isProcessingOffer === offer.id}
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          size="sm"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Contraproposta
                        </Button>
                      </>
                    )}
                    
                    {offer.offer_status === 'counter_offered' && offer.counter_offer_price && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-600 font-medium">
                          Contraproposta: {formatCurrency(offer.counter_offer_price)}
                        </span>
                        <Button
                          onClick={() => onAcceptCounterOffer(offer.id)}
                          disabled={isProcessingOffer === offer.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                      </div>
                    )}
                    
                    {canDeleteOffer(offer) && (
                      <Button
                        onClick={() => onDeleteOffer(offer.id, 'received')}
                        variant="outline"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'made' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Suas Ofertas para Outros Jogadores</h4>
          
          {madeOffers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma oferta feita</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {madeOffers.map((offer) => (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {offer.is_youth_player ? '🏆 Júnior' : '👔 Profissional'}
                        </Badge>
                        <Badge className={getStatusColor(offer.offer_status)}>
                          {getStatusText(offer.offer_status)}
                        </Badge>
                      </div>
                      
                      <h5 className="font-semibold text-gray-900 mb-1">
                        {offer.player_name || 'Jogador'}
                      </h5>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><Building2 className="h-3 w-3 inline mr-1" />Time: {offer.selling_team?.name}</p>
                        <p><DollarSign className="h-3 w-3 inline mr-1" />Sua Oferta: {formatCurrency(offer.offer_price)}</p>
                        <p><Clock className="h-3 w-3 inline mr-1" />{formatDate(offer.offer_made_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ações baseadas no status */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {offer.offer_status === 'counter_offered' && offer.counter_offer_price && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-blue-600 font-medium">
                          Contraproposta: {formatCurrency(offer.counter_offer_price)}
                        </span>
                        <Button
                          onClick={() => onAcceptCounterOffer(offer.id)}
                          disabled={isProcessingOffer === offer.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                      </div>
                    )}
                    
                    {canDeleteOffer(offer) && (
                      <Button
                        onClick={() => onDeleteOffer(offer.id, 'made')}
                        variant="outline"
                        className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OffersManager;
