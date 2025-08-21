'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Shield, Zap, TrendingUp, HelpCircle } from 'lucide-react';
import { getTeamLogoUrl } from '@/lib/cdn-simple';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface PredictionData {
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  headToHead: {
    homeTeam: TeamStats;
    awayTeam: TeamStats;
  };
  predictionUnavailable?: boolean;
  fallbackUsed?: boolean;
}

interface TeamStats {
  name: string;
  logoUrl: string;
  position: number;
  points: number;
  form: string;
  powerIndex: number;
}

const FormIndicator = ({ form }: { form: string }) => {
  if (!form) return null;
  const formArray = form.split('');
  return (
    <div className="flex space-x-1">
      {formArray.map((result, index) => {
        let bgColor = '';
        switch (result.toUpperCase()) {
          case 'V': bgColor = 'bg-green-500'; break;
          case 'E': bgColor = 'bg-gray-400'; break;
          case 'D': bgColor = 'bg-red-500'; break;
          default: bgColor = 'bg-gray-200';
        }
        return <span key={index} className={`h-2 w-2 rounded-full ${bgColor}`}></span>;
      })}
    </div>
  );
};


export function MatchPrediction({ matchId }: { matchId: number }) {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/matches/${matchId}/prediction`);
        if (!response.ok) {
          throw new Error('Falha ao buscar predição da partida');
        }
        const predictionData = await response.json();
        setData(predictionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [matchId]);

  if (loading) {
    return (
        <div className="text-center p-6 bg-gray-50 rounded-lg border">
            <p className="text-gray-600">Calculando probabilidades...</p>
        </div>
    );
  }
  
  if (error || !data) return null; // Adicionado para segurança

  if (data.predictionUnavailable) {
    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
            <h4 className="font-semibold text-yellow-800">Predição Indisponível</h4>
            <p className="text-sm text-yellow-700">
                Não há dados suficientes para gerar uma predição confiável para esta partida.
            </p>
        </div>
    );
  }

  const { probabilities, headToHead, fallbackUsed } = data;
  const { homeTeam, awayTeam } = headToHead;

  return (
    <div className="space-y-4">
      {fallbackUsed && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-center text-xs text-blue-700">
          Aviso: A predição é baseada no desempenho geral das equipes, não na competição atual.
        </div>
      )}
      
      {/* Gráfico de Probabilidades */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-indigo-600"/>
            Probabilidades
        </h3>
        <div className="flex w-full h-8 bg-gray-200 rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex items-center justify-center text-white font-bold text-sm prediction-bar-home" style={{ width: `${probabilities.homeWin}%` }}>
            {probabilities.homeWin}%
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex items-center justify-center text-white font-bold text-sm prediction-bar-draw" style={{ width: `${probabilities.draw}%` }}>
            {probabilities.draw}%
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex items-center justify-center text-white font-bold text-sm prediction-bar-away" style={{ width: `${probabilities.awayWin}%` }}>
            {probabilities.awayWin}%
          </div>
        </div>
        <div className="flex justify-between text-xs mt-1">
            <span className="font-semibold text-blue-600">Vitória {homeTeam.name}</span>
            <span className="font-semibold text-gray-600">Empate</span>
            <span className="font-semibold text-red-600">Vitória {awayTeam.name}</span>
        </div>
      </div>

      {/* Head-to-Head */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-indigo-600"/>
            Head-to-Head
        </h3>
        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-lg border">
            {/* Time da Casa */}
            <div className="flex flex-col items-center text-center">
                <img src={getTeamLogoUrl(homeTeam.logoUrl)} alt={homeTeam.name} className="h-8 w-8 sm:h-12 sm:w-12 mb-1 sm:mb-2"/>
                <p className="font-bold text-xs sm:text-sm">{homeTeam.name}</p>
            </div>

            {/* Estatísticas */}
            <div className="flex flex-col justify-around text-center text-xs text-gray-600">
                <div>{homeTeam.position}º <span className="font-semibold">Pos.</span> {awayTeam.position}º</div>
                <div>{homeTeam.points} <span className="font-semibold">Pts</span> {awayTeam.points}</div>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <FormIndicator form={homeTeam.form} />
                    <span className="font-semibold">Forma</span>
                    <FormIndicator form={awayTeam.form} />
                </div>
                <div>{homeTeam.powerIndex.toFixed(0)} <span className="font-semibold text-indigo-500">Power</span> {awayTeam.powerIndex.toFixed(0)}</div>
            </div>
            
            {/* Time Visitante */}
            <div className="flex flex-col items-center text-center">
                <img src={getTeamLogoUrl(awayTeam.logoUrl)} alt={awayTeam.name} className="h-8 w-8 sm:h-12 sm:w-12 mb-1 sm:mb-2"/>
                <p className="font-bold text-xs sm:text-sm">{awayTeam.name}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
