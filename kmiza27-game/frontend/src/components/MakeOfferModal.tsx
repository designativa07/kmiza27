import React, { useState } from 'react';
import { FaTimes, FaDollarSign } from 'react-icons/fa';

interface Player {
  id: string;
  name: string;
  position: string;
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
            <p className="text-gray-300 text-sm mb-1">Posição: {player.position}</p>
            <p className="text-gray-300 text-sm">Time: {player.selling_team.name}</p>
                      <p className="text-green-400 font-semibold mt-2">
            Preço de Listagem: R$ {player.listing_price.toLocaleString()}
          </p>
          </div>
          
          <p className="text-sm text-gray-300">
            Digite o valor da sua oferta abaixo. Lembre-se que ofertas muito baixas podem ser rejeitadas.
          </p>
        </div>

        <div className="mb-6">
                  <label htmlFor="offerPrice" className="block text-sm font-medium text-gray-300 mb-2">
          Valor da Oferta (em R$)
        </label>
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
          
          {offerPrice && (
            <div className="mt-2 text-sm">
              {parseFloat(offerPrice) < player.listing_price * 0.8 ? (
                <p className="text-yellow-400">⚠️ Oferta muito baixa (menos de 80% do preço de listagem)</p>
              ) : parseFloat(offerPrice) > player.listing_price * 1.2 ? (
                <p className="text-blue-400">💎 Oferta generosa (mais de 120% do preço de listagem)</p>
              ) : (
                <p className="text-green-400">✅ Oferta dentro da faixa recomendada</p>
              )}
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
