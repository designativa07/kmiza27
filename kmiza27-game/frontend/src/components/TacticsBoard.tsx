'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';

type Slot = { id: string; label: string; pos: string };

const FORMATION_SLOTS: Record<string, Slot[]> = {
  '4-4-2': [
    { id: 'GK', label: 'GOL', pos: 'GK' },
    { id: 'LB', label: 'LE', pos: 'LB' },
    { id: 'CB1', label: 'ZAG', pos: 'CB' },
    { id: 'CB2', label: 'ZAG', pos: 'CB' },
    { id: 'RB', label: 'LD', pos: 'RB' },
    { id: 'LM', label: 'ME', pos: 'CM' },
    { id: 'CM1', label: 'MC', pos: 'CM' },
    { id: 'CM2', label: 'MC', pos: 'CM' },
    { id: 'RM', label: 'MD', pos: 'CM' },
    { id: 'ST1', label: 'ATA', pos: 'ST' },
    { id: 'ST2', label: 'ATA', pos: 'ST' },
  ],
  '4-3-3': [
    { id: 'GK', label: 'GOL', pos: 'GK' },
    { id: 'LB', label: 'LE', pos: 'LB' },
    { id: 'CB1', label: 'ZAG', pos: 'CB' },
    { id: 'CB2', label: 'ZAG', pos: 'CB' },
    { id: 'RB', label: 'LD', pos: 'RB' },
    { id: 'CM1', label: 'MC', pos: 'CM' },
    { id: 'CM2', label: 'MC', pos: 'CM' },
    { id: 'CM3', label: 'MC', pos: 'CM' },
    { id: 'LW', label: 'PE', pos: 'LW' },
    { id: 'ST', label: 'ATA', pos: 'ST' },
    { id: 'RW', label: 'PD', pos: 'RW' },
  ],
};

export default function TacticsBoard() {
  const { selectedTeam, getTactics, saveTactics } = useGameStore();
  const [tactics, setTactics] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bench, setBench] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!selectedTeam || !getTactics) return;
      setLoading(true);
      try {
        const [data, squadRaw] = await Promise.all([
          getTactics(selectedTeam.id),
          gameApiReformed.getPlayers(selectedTeam.id),
        ]);
        setTactics(data);
        setBench((data?.bench as string[]) || []);
        const norm = (squadRaw || []).map((p: any) => ({
          id: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          position: p.position || 'CM',
          overall: p.overall || Math.round(((p.speed ?? 0) + (p.stamina ?? 0) + (p.strength ?? 0) + (p.passing ?? 0) + (p.shooting ?? 0) + (p.dribbling ?? 0) + (p.defending ?? 0)) / 7),
        }));
        // Se vierem poucos jogadores (ex.: 3), tentar rota alternativa de segurança
        if (norm.length < 11) {
          try {
            const alt = await gameApiReformed.getPlayers(selectedTeam.id);
            const normAlt = (alt || []).map((p: any) => ({
              id: p.id,
              name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
              position: p.position || 'CM',
              overall: p.overall || Math.round(((p.speed ?? 0) + (p.stamina ?? 0) + (p.strength ?? 0) + (p.passing ?? 0) + (p.shooting ?? 0) + (p.dribbling ?? 0) + (p.defending ?? 0)) / 7),
            }));
            setPlayers(normAlt.length > norm.length ? normAlt : norm);
          } catch {
            setPlayers(norm);
          }
        } else {
          setPlayers(norm);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTeam, getTactics]);

  const slots = useMemo<Slot[]>(() => FORMATION_SLOTS[tactics?.formation || '4-4-2'] || FORMATION_SLOTS['4-4-2'], [tactics?.formation]);

  if (!selectedTeam) return <div className="card">Selecione um time</div>;
  if (loading || !tactics) return <div className="card">Carregando táticas...</div>;

  const assigned: Record<string, any> = (tactics.lineup || []).reduce((acc: any, row: any) => {
    acc[row.slotId] = row.playerId;
    return acc;
  }, {});

  const handleAssign = (slotId: string, playerId: string) => {
    const next = [...(tactics.lineup || [])].filter((row) => row.slotId !== slotId);
    next.push({ slotId, playerId });
    setTactics((t: any) => ({ ...t, lineup: next }));
    // remover do banco se estava lá
    setBench((b) => b.filter((id) => id !== playerId));
  };

  const handleBench = (playerId: string) => {
    // remove de qualquer slot e adiciona ao banco (máx 12)
    const without = (tactics.lineup || []).filter((row: any) => row.playerId !== playerId);
    setTactics((t: any) => ({ ...t, lineup: without }));
    setBench((b) => (b.includes(playerId) ? b : (b.length < 12 ? [...b, playerId] : b)));
  };

  // HTML5 DnD
  const onDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
  };
  const onDropSlot = (e: React.DragEvent, slotId: string) => {
    const pid = e.dataTransfer.getData('text/plain');
    if (pid) handleAssign(slotId, pid);
  };
  const onDropBench = (e: React.DragEvent) => {
    const pid = e.dataTransfer.getData('text/plain');
    if (pid) handleBench(pid);
  };

  const handleSave = async () => {
    if (!saveTactics || !tactics) return;
    await saveTactics({ teamId: selectedTeam!.id, ...tactics, bench });
    alert('Táticas salvas!');
  };

  const availablePlayers = players.sort((a, b) => (b.overall || 0) - (a.overall || 0));
  const assignedIds = new Set((tactics.lineup || []).map((r: any) => r.playerId));
  const benchIds = new Set(bench);
  const freePlayers = availablePlayers.filter((p) => !assignedIds.has(p.id) && !benchIds.has(p.id));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-3">🎯 Área Técnica - {selectedTeam.name}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-2 bg-gradient-to-b from-emerald-100 to-emerald-200 p-3 rounded border min-h-[320px]">
            {slots.map((s) => (
              <div
                key={s.id}
                className={`bg-white rounded p-2 border cursor-pointer ${selectedSlot === s.id ? 'ring-2 ring-emerald-500' : ''}`}
                onClick={() => setSelectedSlot(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropSlot(e, s.id)}
              >
                <div className="text-[10px] text-gray-500">{s.label}</div>
                <div className="text-sm font-semibold">
                  {players.find((p) => p.id === assigned[s.id])?.name || '—'}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-slate-100 rounded border" onDragOver={(e) => e.preventDefault()} onDrop={onDropBench}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Reservas ({benchIds.size}/12)</div>
              <div className="text-xs text-gray-600">Titulares: {(tactics.lineup || []).length}/11</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...benchIds].map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span key={id} className="px-2 py-1 text-xs bg-white border rounded cursor-move" draggable onDragStart={(e) => onDragStart(e, id)}>
                    {p.name} • {p.position} • {p.overall}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2">
            <label className="text-sm text-gray-700">Formação</label>
            <select className="w-full border rounded px-2 py-1" value={tactics?.formation || '4-4-2'} onChange={(e) => setTactics((t: any) => ({ ...t, formation: e.target.value, lineup: [] }))}>
              {Object.keys(FORMATION_SLOTS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-sm text-gray-700">Estilo</label>
            <select className="w-full border rounded px-2 py-1" value={tactics?.style || 'equilibrado'} onChange={(e) => setTactics((t: any) => ({ ...t, style: e.target.value }))}>
              {['defensivo','equilibrado','ofensivo'].map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-sm text-gray-700">Jogadores</label>
            <select disabled={!selectedSlot} className="w-full border rounded px-2 py-1" value={assigned[selectedSlot || ''] || ''} onChange={(e) => selectedSlot && handleAssign(selectedSlot, e.target.value)}>
              <option value="">Selecionar jogador para {selectedSlot || 'slot'}</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name || 'Sem nome'} • {p.position} • {p.overall ?? '-'}</option>
              ))}
            </select>
          </div>
          <div className="border rounded p-2 h-64 overflow-auto bg-white">
            {freePlayers.map((p) => (
              <div key={p.id} className="text-xs py-1 px-2 border-b last:border-b-0 cursor-move" draggable onDragStart={(e) => onDragStart(e, p.id)}>
                {p.name} • {p.position} • {p.overall}
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="mt-2 btn-primary w-full">Salvar Táticas</button>
        </div>
      </div>
    </div>
  );
}


