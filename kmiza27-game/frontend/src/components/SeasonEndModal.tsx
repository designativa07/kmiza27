'use client';

import { useState } from 'react';

interface SeasonEndResult {
  season_result: {
    result: 'promoted' | 'relegated' | 'stayed' | 'champion';
    current_tier: number;
    next_tier: number;
    description: string;
  };
  final_position: number;
  final_points: number;
  games_played: number;
  next_tier: number;
  message: string;
}

interface SeasonEndModalProps {
  isOpen: boolean;
  seasonResult: SeasonEndResult;
  onContinue: () => void;
  onClose: () => void;
}

export default function SeasonEndModal({ isOpen, seasonResult, onContinue, onClose }: SeasonEndModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const getTierName = (tier: number): string => {
    const tierNames: Record<number, string> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return tierNames[tier] || 'Desconhecida';
  };

  const getResultIcon = () => {
    switch (seasonResult.season_result.result) {
      case 'promoted':
      case 'champion':
        return '🎉';
      case 'relegated':
        return '😔';
      case 'stayed':
        return '📍';
      default:
        return '🏁';
    }
  };

  const getResultColor = () => {
    switch (seasonResult.season_result.result) {
      case 'promoted':
      case 'champion':
        return 'text-green-600';
      case 'relegated':
        return 'text-red-600';
      case 'stayed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getResultTitle = () => {
    switch (seasonResult.season_result.result) {
      case 'promoted':
        return '🎉 PROMOÇÃO CONQUISTADA!';
      case 'champion':
        return '🏆 CAMPEÃO DA SÉRIE!';
      case 'relegated':
        return '😔 Rebaixamento';
      case 'stayed':
        return '📍 Permanência na Série';
      default:
        return '🏁 Fim de Temporada';
    }
  };

  const handleContinue = async () => {
    setIsProcessing(true);
    try {
      await onContinue();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-emerald-600 text-white p-6 rounded-t-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">{getResultIcon()}</div>
            <h2 className="text-3xl font-bold mb-2">{getResultTitle()}</h2>
            <p className="text-xl opacity-90">
              Temporada {new Date().getFullYear()} Finalizada
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Resultado Principal */}
          <div className="text-center mb-6">
            <div className={`text-2xl font-bold mb-2 ${getResultColor()}`}>
              {seasonResult.message}
            </div>
            <p className="text-gray-600">
              {seasonResult.season_result.description}
            </p>
          </div>

          {/* Estatísticas da Temporada */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              📊 Estatísticas da Temporada
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {seasonResult.final_position}º
                </div>
                <div className="text-sm text-gray-600">Posição Final</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {seasonResult.final_points}
                </div>
                <div className="text-sm text-gray-600">Pontos</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {seasonResult.games_played}
                </div>
                <div className="text-sm text-gray-600">Jogos</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  Série {getTierName(seasonResult.next_tier)}
                </div>
                <div className="text-sm text-gray-600">Próxima Série</div>
              </div>
            </div>
          </div>

          {/* Transição */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6 text-center border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">
              🆕 Próxima Temporada
            </h4>
            <p className="text-slate-700">
              Você jogará na <strong>Série {getTierName(seasonResult.next_tier)}</strong> na temporada {new Date().getFullYear() + 1}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Um novo calendário será gerado automaticamente com 19 times da máquina desta série.
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Fechar
            </button>
            <button
              onClick={handleContinue}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isProcessing
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Preparando...
                </div>
              ) : (
                '🚀 Continuar para Próxima Temporada'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}