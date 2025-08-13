'use client';

import React, { useMemo, useState } from 'react';
import PlayerCard, { PlayerCardData } from './PlayerCard';

interface Props {
  players: PlayerCardData[];
}

export default function PlayerGrid({ players }: Props) {
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<string>('ALL');
  const [sort, setSort] = useState<'overall' | 'age' | 'salary'>('overall');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = players.filter((p) =>
      (!q || p.name.toLowerCase().includes(q)) && (pos === 'ALL' || p.position === pos),
    );
    list = list.sort((a, b) => {
      if (sort === 'age') return (a.age ?? 0) - (b.age ?? 0);
      if (sort === 'salary') return (b.salary ?? 0) - (a.salary ?? 0);
      return (b.overall ?? 0) - (a.overall ?? 0);
    });
    return list;
  }, [players, query, pos, sort]);

  const posToPt: Record<string, string> = { GK: 'GOL', CB: 'ZAG', LB: 'LE', RB: 'LD', CDM: 'VOL', CM: 'MC', CAM: 'MO', LW: 'PE', RW: 'PD', CF: 'SA', ST: 'ATA' };
  const positions = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar jogador" className="border rounded px-2 py-1 text-sm" />
        <select value={pos} onChange={(e) => setPos(e.target.value)} className="border rounded px-2 py-1 text-sm">
          {positions.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'ALL' : (posToPt[p] || p)}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="border rounded px-2 py-1 text-sm">
          <option value="overall">Ordenar por Overall</option>
          <option value="age">Ordenar por Idade</option>
          <option value="salary">Ordenar por Salário</option>
        </select>
        <div className="ml-auto text-sm text-gray-600">Folha: R$ {filtered.reduce((s, p) => s + (p.salary || 0), 0).toLocaleString()}/mês</div>
      </div>
      <div className="grid gap-1">
        {filtered.map((p) => (
          <PlayerCard key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}


