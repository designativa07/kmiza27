'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';

export default function NewsFeed() {
  const { selectedTeam } = useGameStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      const data = await gameApiReformed.getNews(selectedTeam.id);
      setItems(Array.isArray(data) ? data : data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedTeam?.id]);

  if (!selectedTeam) return null;

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-semibold text-slate-800">📰 Notícias do Clube</h3>
        <button onClick={load} className="text-xs border rounded px-2 py-1">Atualizar</button>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">Sem notícias ainda.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n, idx) => (
            <li key={idx} className="border rounded p-2">
              <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('pt-BR')}</div>
              <div className="text-sm font-medium">{n.title}</div>
              {n.message && <div className="text-sm text-gray-700">{n.message}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



