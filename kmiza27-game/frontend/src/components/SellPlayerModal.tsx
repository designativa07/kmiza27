import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface Player {
  id: string;
  name: string;
  // Adicione outros campos do jogador que possam ser úteis no modal
}

interface SellPlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
}

const SellPlayerModal: React.FC<SellPlayerModalProps> = ({ player, isOpen, onClose, onConfirm }) => {
  const [price, setPrice] = useState('');

  if (!isOpen || !player) {
    return null;
  }

  const handleConfirm = () => {
    const priceValue = parseFloat(price);
    if (!isNaN(priceValue) && priceValue > 0) {
      onConfirm(priceValue);
      onClose();
    } else {
      alert('Por favor, insira um preço válido.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-white font-bold">Vender Jogador</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FaTimes />
          </button>
        </div>
        <div className="text-center mb-4">
          <p className="text-lg text-white">Você está listando <span className="font-semibold">{player.name}</span> no mercado.</p>
          <p className="text-sm text-gray-300">Defina o preço de venda abaixo.</p>
        </div>
        <div className="mb-6">
          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
            Preço de Venda (em K$)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: 5000"
          />
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
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Confirmar Listagem
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellPlayerModal;
