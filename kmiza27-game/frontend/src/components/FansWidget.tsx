'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';

export default function FansWidget() {
  const { selectedTeam } = useGameStore();
  const [fans, setFans] = useState<{ fans_count: number; mood: number; trend?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      const data = await gameApiReformed.getFans(selectedTeam.id);
      setFans(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedTeam?.id]);

  if (!selectedTeam) return null;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <h3 className="text-md font-semibold text-slate-800 mb-2">🎟️ Torcida</h3>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : fans ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Torcedores</span>
            <span className="font-semibold">{fans.fans_count.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Humor</span>
            <span className="font-semibold">{fans.mood}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded">
            <div className="h-2 bg-rose-500 rounded" style={{ width: `${Math.max(0, Math.min(100, fans.mood))}%` }} />
          </div>
          <button onClick={load} className="w-full mt-2 text-xs border rounded px-2 py-1">Atualizar</button>
        </div>
      ) : (
        <div className="text-sm text-gray-600">Sem dados</div>
      )}
    </div>
  );
}


