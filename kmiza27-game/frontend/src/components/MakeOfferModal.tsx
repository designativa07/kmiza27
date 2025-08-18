import React, { useState } from 'react';
import { FaTimes, FaDollarSign } from 'react-icons/fa';

interface Player {
  id: string;
  name: string;
  position: string;
  current_ability: number;
  potential_ability: number;
  market_value?: number;
  listing_price: number;
  selling_team: { name: string };
}

interface MakeOfferModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({ player, isOpen, onClose, onConfirm }) => {
  const [offerPrice, setOfferPrice] = useState('');

  if (!isOpen || !player) {
    return null;
  }

  const handleConfirm = () => {
    const priceValue = parseFloat(offerPrice);
    if (!isNaN(priceValue) && priceValue > 0) {
      onConfirm(priceValue);
      onClose();
    } else {
      alert('Por favor, insira um preço válido.');
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || parseFloat(value) >= 0) {
      setOfferPrice(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-white font-bold">Fazer Oferta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" title="Fechar">
            <FaTimes />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg text-white font-semibold mb-2">{player.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Posição:</strong> {player.position}</p>
              <p><strong>Overall:</strong> {player.current_ability}</p>
              <p><strong>Potencial:</strong> {player.potential_ability}</p>
            </div>
          </div>
          
          {/* Valor de Mercado em Destaque */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4 mb-4 border border-blue-600">
            <div className="text-center">
              <h4 className="text-sm text-blue-200 font-medium mb-1">💰 Valor de Mercado</h4>
              <p className="text-2xl font-bold text-white">
                R$ {player.market_value?.toLocaleString() || 'N/A'}
              </p>
              <p className="text-xs text-blue-300 mt-1">
                Base para negociação
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-300">
            Digite o valor da sua oferta abaixo. Lembre-se que ofertas muito baixas podem ser rejeitadas.
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="offerPrice" className="block text-sm font-medium text-gray-300 mb-2">
            Valor da Oferta (em R$)
          </label>
          
          {/* Sugestões de Preço */}
          {player.market_value && (
            <div className="mb-3 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <p className="text-gray-300 text-xs font-medium mb-2">💡 Sugestões de Preço:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOfferPrice(Math.round(player.market_value! * 0.9).toString())}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded border border-gray-600"
                >
                  90%: R$ {Math.round(player.market_value! * 0.9).toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferPrice(player.market_value!.toString())}
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded border border-blue-600"
                >
                  100%: R$ {player.market_value!.toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferPrice(Math.round(player.market_value! * 1.1).toString())}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded border border-green-600"
                >
                  110%: R$ {Math.round(player.market_value! * 1.1).toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferPrice(Math.round(player.market_value! * 1.2).toString())}
                  className="text-xs bg-purple-700 hover:bg-purple-600 text-white px-2 py-1 rounded border border-purple-600"
                >
                  120%: R$ {Math.round(player.market_value! * 1.2).toLocaleString()}
                </button>
              </div>
            </div>
          )}
          
          <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 font-bold">R$</span>
        </div>
                    <input
          type="number"
          id="offerPrice"
          value={offerPrice}
          onChange={handlePriceChange}
          className="w-full bg-gray-900 border border-gray-700 text-white rounded-md pl-12 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ex: 5000"
          min="0"
          step="100"
        />
          </div>
          
          {offerPrice && player.market_value && (
            <div className="mt-3 space-y-2">
              {parseFloat(offerPrice) < player.market_value * 0.7 ? (
                <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm font-medium">🚨 Oferta Muito Baixa</p>
                  <p className="text-red-400 text-xs">Menos de 70% do valor de mercado. Alta chance de rejeição.</p>
                </div>
              ) : parseFloat(offerPrice) < player.market_value * 0.8 ? (
                <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                  <p className="text-yellow-300 text-sm font-medium">⚠️ Oferta Baixa</p>
                  <p className="text-yellow-400 text-xs">Entre 70-80% do valor de mercado. Pode ser rejeitada.</p>
                </div>
              ) : parseFloat(offerPrice) < player.market_value * 0.9 ? (
                <div className="p-3 bg-orange-900/30 border border-orange-600 rounded-lg">
                  <p className="text-orange-300 text-sm font-medium">📉 Oferta Moderada</p>
                  <p className="text-orange-400 text-xs">Entre 80-90% do valor de mercado. Negociação possível.</p>
                </div>
              ) : parseFloat(offerPrice) <= player.market_value * 1.1 ? (
                <div className="p-3 bg-green-900/30 border border-green-600 rounded-lg">
                  <p className="text-green-300 text-sm font-medium">✅ Oferta Justa</p>
                  <p className="text-green-400 text-xs">Entre 90-110% do valor de mercado. Alta chance de aceitação.</p>
                </div>
              ) : parseFloat(offerPrice) <= player.market_value * 1.3 ? (
                <div className="p-3 bg-blue-900/30 border border-blue-600 rounded-lg">
                  <p className="text-blue-300 text-sm font-medium">💎 Oferta Generosa</p>
                  <p className="text-blue-400 text-xs">Entre 110-130% do valor de mercado. Muito atrativa!</p>
                </div>
              ) : (
                <div className="p-3 bg-purple-900/30 border border-purple-600 rounded-lg">
                  <p className="text-purple-300 text-sm font-medium">👑 Oferta Premium</p>
                  <p className="text-purple-400 text-xs">Mais de 130% do valor de mercado. Extremamente atrativa!</p>
                </div>
              )}
              
              {/* Dicas de Negociação */}
              <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                <p className="text-gray-300 text-xs font-medium mb-1">💡 Dicas de Negociação:</p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• <strong>70-80%:</strong> Oferta arriscada, pode ser rejeitada</li>
                  <li>• <strong>80-90%:</strong> Oferta moderada, negociação possível</li>
                  <li>• <strong>90-110%:</strong> Oferta justa, alta chance de aceitação</li>
                  <li>• <strong>110%+:</strong> Oferta generosa, muito atrativa</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!offerPrice || parseFloat(offerPrice) <= 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <FaDollarSign />
            Fazer Oferta
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeOfferModal;
