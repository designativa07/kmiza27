'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { gameApiReformed } from '@/services/gameApiReformed';
import TacticsImpactDisplay from './TacticsImpactDisplay';

type Slot = { id: string; label: string; pos: string };

// Mapa de traduções de posições para PT-BR
const POS_PT_BR: Record<string, string> = {
  GK: 'GOL',
  LB: 'LE',
  RB: 'LD',
  CB: 'ZAG',
  LM: 'ME',
  RM: 'MD',
  CM: 'MC',
  LW: 'PE',
  RW: 'PD',
  ST: 'ATA',
  DM: 'VOL',
  AM: 'MEI',
  LWB: 'ALA E',
  RWB: 'ALA D',
};

const toPt = (pos?: string) => (pos ? (POS_PT_BR[pos] || pos) : '');

// SISTEMA DE COORDENADAS SIMPLIFICADO
// Y: 10 = Topo (Atacantes), 90 = Baixo (Goleiro)
// X: 10 = Esquerda, 90 = Direita
const FORMATION_LAYOUTS: Record<string, Record<string, { x: number; y: number }>> = {
  '4-4-2': {
    // Linha de ataque (topo)
    ST1: { x: 35, y: 15 },
    ST2: { x: 65, y: 15 },
    // Linha de meio-campo
    LM: { x: 15, y: 45 },
    CM1: { x: 35, y: 48 },
    CM2: { x: 65, y: 48 },
    RM: { x: 85, y: 45 },
    // Linha de defesa
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 85, y: 70 },
    // Goleiro
    GK: { x: 50, y: 88 },
  },
  '4-3-3': {
    // Linha de ataque (topo)
    LW: { x: 20, y: 15 },
    ST: { x: 50, y: 12 },
    RW: { x: 80, y: 15 },
    // Linha de meio-campo
    CM1: { x: 25, y: 45 },
    CM2: { x: 50, y: 48 },
    CM3: { x: 75, y: 45 },
    // Linha de defesa
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 85, y: 70 },
    // Goleiro
    GK: { x: 50, y: 88 },
  },
  '4-2-3-1': {
    // Linha de ataque (topo)
    ST: { x: 50, y: 12 },
    // Linha ofensiva de meio-campo
    LW: { x: 20, y: 30 },
    AM: { x: 50, y: 32 },
    RW: { x: 80, y: 30 },
    // Linha defensiva de meio-campo
    DM1: { x: 35, y: 55 },
    DM2: { x: 65, y: 55 },
    // Linha de defesa
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 72 },
    CB2: { x: 65, y: 72 },
    RB: { x: 85, y: 70 },
    // Goleiro
    GK: { x: 50, y: 88 },
  },
  '3-5-2': {
    // Linha de ataque (topo)
    ST1: { x: 35, y: 15 },
    ST2: { x: 65, y: 15 },
    // Linha de meio-campo
    LWB: { x: 10, y: 45 },
    CM1: { x: 30, y: 48 },
    CM2: { x: 50, y: 50 },
    CM3: { x: 70, y: 48 },
    RWB: { x: 90, y: 45 },
    // Linha de defesa (3 zagueiros)
    CB1: { x: 25, y: 72 },
    CB2: { x: 50, y: 74 },
    CB3: { x: 75, y: 72 },
    // Goleiro
    GK: { x: 50, y: 88 },
  },
  '5-3-2': {
    // Linha de ataque (topo)
    ST1: { x: 35, y: 15 },
    ST2: { x: 65, y: 15 },
    // Linha de meio-campo
    CM1: { x: 25, y: 45 },
    CM2: { x: 50, y: 48 },
    CM3: { x: 75, y: 45 },
    // Linha de defesa (5 defensores)
    LB: { x: 10, y: 70 },
    CB1: { x: 28, y: 72 },
    CB2: { x: 50, y: 74 },
    CB3: { x: 72, y: 72 },
    RB: { x: 90, y: 70 },
    // Goleiro
    GK: { x: 50, y: 88 },
  },
};

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
  '4-2-3-1': [
    { id: 'GK', label: 'GOL', pos: 'GK' },
    { id: 'LB', label: 'LE', pos: 'LB' },
    { id: 'CB1', label: 'ZAG', pos: 'CB' },
    { id: 'CB2', label: 'ZAG', pos: 'CB' },
    { id: 'RB', label: 'LD', pos: 'RB' },
    { id: 'DM1', label: 'VOL', pos: 'CM' },
    { id: 'DM2', label: 'VOL', pos: 'CM' },
    { id: 'LW', label: 'PE', pos: 'LW' },
    { id: 'AM', label: 'MEI', pos: 'CM' },
    { id: 'RW', label: 'PD', pos: 'RW' },
    { id: 'ST', label: 'ATA', pos: 'ST' },
  ],
  '3-5-2': [
    { id: 'GK', label: 'GOL', pos: 'GK' },
    { id: 'CB1', label: 'ZAG', pos: 'CB' },
    { id: 'CB2', label: 'ZAG', pos: 'CB' },
    { id: 'CB3', label: 'ZAG', pos: 'CB' },
    { id: 'LWB', label: 'ALA E', pos: 'LB' },
    { id: 'RWB', label: 'ALA D', pos: 'RB' },
    { id: 'CM1', label: 'MC', pos: 'CM' },
    { id: 'CM2', label: 'MC', pos: 'CM' },
    { id: 'CM3', label: 'MC', pos: 'CM' },
    { id: 'ST1', label: 'ATA', pos: 'ST' },
    { id: 'ST2', label: 'ATA', pos: 'ST' },
  ],
  '5-3-2': [
    { id: 'GK', label: 'GOL', pos: 'GK' },
    { id: 'LB', label: 'LE', pos: 'LB' },
    { id: 'CB1', label: 'ZAG', pos: 'CB' },
    { id: 'CB2', label: 'ZAG', pos: 'CB' },
    { id: 'CB3', label: 'ZAG', pos: 'CB' },
    { id: 'RB', label: 'LD', pos: 'RB' },
    { id: 'CM1', label: 'MC', pos: 'CM' },
    { id: 'CM2', label: 'MC', pos: 'CM' },
    { id: 'CM3', label: 'MC', pos: 'CM' },
    { id: 'ST1', label: 'ATA', pos: 'ST' },
    { id: 'ST2', label: 'ATA', pos: 'ST' },
  ],
};

export default function TacticsBoard() {
  const { selectedTeam, getTactics, saveTactics } = useGameStore();
  const [tactics, setTactics] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bench, setBench] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'escalacao' | 'explicacao'>('escalacao');

  useEffect(() => {
    (async () => {
      if (!selectedTeam || !getTactics) return;
      setLoading(true);
      try {
        const [data, squadRaw] = await Promise.all([
          getTactics(selectedTeam.id),
          gameApiReformed.getPlayers(selectedTeam.id),
        ]);
        const fallback = { formation: '4-4-2', style: 'equilibrado', lineup: [], bench: [] as string[] };
        const safeData = data && typeof data === 'object' ? {
          formation: data.formation || '4-4-2',
          style: data.style || 'equilibrado',
          lineup: Array.isArray(data.lineup) ? data.lineup : [],
          bench: Array.isArray(data.bench) ? data.bench : [],
        } : fallback;
        setTactics(safeData);
        setBench(safeData.bench);
        const norm = (squadRaw || []).map((p: any) => ({
          id: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          position: p.position || 'CM',
          overall: p.overall || Math.round(((p.speed ?? 0) + (p.stamina ?? 0) + (p.strength ?? 0) + (p.passing ?? 0) + (p.shooting ?? 0) + (p.dribbling ?? 0) + (p.defending ?? 0)) / 7),
        }));
        setPlayers(norm);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTeam, getTactics]);

  const slots = useMemo<Slot[]>(() => FORMATION_SLOTS[tactics?.formation || '4-4-2'] || FORMATION_SLOTS['4-4-2'], [tactics?.formation]);
  const lineup = (tactics?.lineup as any[]) || [];
  const assignedIds = new Set(lineup.map((r: any) => r.playerId));
  
  const getPlayerForSlot = (slotId: string) => {
    const assignment = lineup.find((r: any) => r.slotId === slotId);
    return assignment ? players.find((p) => p.id === assignment.playerId) : null;
  };

  const handleAssign = (slotId: string, playerId: string) => {
    const next = [...(tactics.lineup || [])].filter((row) => row.slotId !== slotId && row.playerId !== playerId);
    next.push({ slotId, playerId });
    setTactics((t: any) => ({ ...t, lineup: next }));
    setBench((b) => b.filter((id) => id !== playerId));
  };

  const handleBench = (playerId: string) => {
    const without = (tactics.lineup || []).filter((row: any) => row.playerId !== playerId);
    setTactics((t: any) => ({ ...t, lineup: without }));
    setBench((b) => (b.includes(playerId) ? b : (b.length < 12 ? [...b, playerId] : b)));
  };

  const onDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData('text/plain', playerId);
  };

  const onDropSlot = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const pid = e.dataTransfer.getData('text/plain');
    if (pid) handleAssign(slotId, pid);
  };

  const onDropBench = (e: React.DragEvent) => {
    e.preventDefault();
    const pid = e.dataTransfer.getData('text/plain');
    if (pid) handleBench(pid);
  };

  const handleSave = async () => {
    if (!saveTactics || !tactics) return;
    const payload = {
      teamId: selectedTeam!.id,
      formation: tactics.formation,
      style: tactics.style,
      pressing: tactics.pressing || 'média',
      width: tactics.width || 'normal',
      tempo: tactics.tempo || 'normal',
      lineup: (tactics.lineup || []).map((r: any) => ({ slotId: r.slotId, playerId: r.playerId })),
    };
    await saveTactics(payload);
    alert('Táticas salvas com sucesso! As configurações avançadas serão aplicadas na próxima partida.');
  };

  const autoLineup = () => {
    if (!players || players.length === 0) return;
    const used = new Set<string>();
    const next: any[] = [];
    
    for (const s of slots) {
      const candidates = players
        .filter((p) => !used.has(p.id))
        .sort((a, b) => {
          // Priorizar por posição correta
          const aMatch = a.position === s.pos ? 1000 : 0;
          const bMatch = b.position === s.pos ? 1000 : 0;
          return (bMatch + (b.overall || 0)) - (aMatch + (a.overall || 0));
        });
      
      if (candidates[0]) {
        used.add(candidates[0].id);
        next.push({ slotId: s.id, playerId: candidates[0].id });
      }
    }
    
    const remaining = players.filter((p) => !used.has(p.id)).sort((a, b) => (b.overall || 0) - (a.overall || 0));
    const nextBench = remaining.slice(0, 12).map((p) => p.id);
    setTactics((t: any) => ({ ...t, lineup: next }));
    setBench(nextBench);
  };

  const clearLineup = () => {
    setTactics((t: any) => ({ ...t, lineup: [] }));
    setBench([]);
  };

  const overallClass = (ov?: number) => {
    const val = ov ?? 0;
    if (val >= 80) return 'text-emerald-600';
    if (val >= 70) return 'text-amber-600';
    return 'text-slate-600';
  };

  const overallBgClass = (ov?: number) => {
    const val = ov ?? 0;
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 70) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  if (!selectedTeam) return <div className="card">Selecione um time</div>;
  if (loading || !tactics) return <div className="card">Carregando táticas...</div>;

  const formation = tactics?.formation || '4-4-2';
  const layout = FORMATION_LAYOUTS[formation] || FORMATION_LAYOUTS['4-4-2'];
  const benchIds = new Set(bench);
  const freePlayers = players.filter((p) => !assignedIds.has(p.id) && !benchIds.has(p.id));

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">🎯 Área Técnica - {selectedTeam.name}</h3>
        
        {/* Abas */}
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('escalacao')}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'escalacao'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚽ Escalação & Táticas
          </button>
          <button
            onClick={() => setActiveTab('explicacao')}
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'explicacao'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Explicação dos Parâmetros
          </button>
        </div>
      </div>

      {activeTab === 'escalacao' ? (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Campo de futebol */}
            <div className="lg:col-span-2">
          <div className="relative bg-gradient-to-b from-green-600 to-green-700 p-4 rounded-lg min-h-[600px]">
            {/* Linhas do campo */}
            <div className="absolute inset-4 border-2 border-white rounded">
              {/* Linha do meio-campo */}
              <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white"></div>
              
              {/* Círculo central */}
              <div className="absolute w-20 h-20 border-2 border-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              
              {/* Área grande superior (ataque) */}
              <div className="absolute left-[20%] right-[20%] top-0 h-[15%] border-2 border-white border-t-0"></div>
              
              {/* Área grande inferior (defesa) */}
              <div className="absolute left-[20%] right-[20%] bottom-0 h-[15%] border-2 border-white border-b-0"></div>
              
              {/* Área pequena superior (ataque) */}
              <div className="absolute left-[35%] right-[35%] top-0 h-[8%] border-2 border-white border-t-0"></div>
              
              {/* Área pequena inferior (defesa) */}
              <div className="absolute left-[35%] right-[35%] bottom-0 h-[8%] border-2 border-white border-b-0"></div>
            </div>

            {/* Jogadores posicionados */}
            {slots.map((slot) => {
              const pos = layout[slot.id];
              const player = getPlayerForSlot(slot.id);
              
              if (!pos) return null;
              
              return (
                <div
                  key={slot.id}
                  className={`absolute bg-white rounded-lg p-2 border-2 cursor-pointer transition-all ${
                    selectedSlot === slot.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    minWidth: '100px',
                    zIndex: 10,
                  }}
                  onClick={() => setSelectedSlot(slot.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropSlot(e, slot.id)}
                >
                  {player && (
                    <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${overallBgClass(player.overall)} text-white text-xs font-bold flex items-center justify-center`}>
                      {player.overall}
                    </span>
                  )}
                  <div className="text-xs font-bold text-gray-600">{slot.label}</div>
                  <div className="text-sm font-semibold truncate">
                    {player ? player.name : '—'}
                  </div>
                  {player && (
                    <div className="text-xs text-gray-500">
                      {toPt(player.position)} • OVR {player.overall}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Banco de reservas */}
          <div className="mt-3 p-3 bg-gray-100 rounded-lg" onDragOver={(e) => e.preventDefault()} onDrop={onDropBench}>
            <div className="text-sm font-semibold mb-2">Reservas ({benchIds.size}/12)</div>
            <div className="flex flex-wrap gap-2">
              {[...benchIds].map((id) => {
                const p = players.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span 
                    key={id} 
                    className="px-3 py-2 text-xs bg-white border rounded cursor-move hover:shadow"
                    draggable 
                    onDragStart={(e) => onDragStart(e, id)}
                  >
                    {p.name} • {toPt(p.position)} • {p.overall}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel lateral */}
        <div>
          <div className="mb-3">
            <label className="text-sm font-medium mb-1 block">Formação</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={tactics?.formation || '4-4-2'}
              onChange={(e) => setTactics((t: any) => ({ ...t, formation: e.target.value, lineup: [] }))}
            >
              {Object.keys(FORMATION_SLOTS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium mb-1 block">Estilo</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm"
              value={tactics?.style || 'equilibrado'}
              onChange={(e) => setTactics((t: any) => ({ ...t, style: e.target.value }))}
            >
              <option value="defensivo">Defensivo</option>
              <option value="equilibrado">Equilibrado</option>
              <option value="ofensivo">Ofensivo</option>
            </select>
          </div>

          {/* Configurações Avançadas */}
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-800 mb-3">⚙️ Configurações Avançadas</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-purple-700 mb-1 block">🔥 Pressing</label>
                <select 
                  className="w-full border rounded px-2 py-1 text-xs"
                  value={tactics?.pressing || 'média'}
                  onChange={(e) => setTactics((t: any) => ({ ...t, pressing: e.target.value }))}
                >
                  <option value="baixa">Baixa - Conserva energia</option>
                  <option value="média">Média - Equilibrado</option>
                  <option value="alta">Alta - Pressão constante</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-purple-700 mb-1 block">📏 Largura</label>
                <select 
                  className="w-full border rounded px-2 py-1 text-xs"
                  value={tactics?.width || 'normal'}
                  onChange={(e) => setTactics((t: any) => ({ ...t, width: e.target.value }))}
                >
                  <option value="estreito">Estreito - Jogo centralizado</option>
                  <option value="normal">Normal - Largura padrão</option>
                  <option value="largo">Largo - Usa toda largura</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-purple-700 mb-1 block">⚡ Tempo</label>
                <select 
                  className="w-full border rounded px-2 py-1 text-xs"
                  value={tactics?.tempo || 'normal'}
                  onChange={(e) => setTactics((t: any) => ({ ...t, tempo: e.target.value }))}
                >
                  <option value="lento">Lento - Posse de bola</option>
                  <option value="normal">Normal - Ritmo equilibrado</option>
                  <option value="rápido">Rápido - Jogo direto</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-sm font-medium mb-1 block">
              Jogadores {selectedSlot && `para ${slots.find(s => s.id === selectedSlot)?.label}`}
            </label>
            <select
              disabled={!selectedSlot}
              className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
              value={lineup.find((r: any) => r.slotId === selectedSlot)?.playerId || ''}
              onChange={(e) => selectedSlot && handleAssign(selectedSlot, e.target.value)}
            >
              <option value="">Selecionar jogador</option>
              {players
                .filter((p) => !assignedIds.has(p.id) || lineup.find((r: any) => r.slotId === selectedSlot)?.playerId === p.id)
                .sort((a, b) => (b.overall || 0) - (a.overall || 0))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} • {toPt(p.position)} • {p.overall}
                  </option>
                ))}
            </select>
          </div>

          {/* Lista de jogadores disponíveis */}
          <div className="border rounded p-3 h-64 overflow-auto bg-white">
            <div className="text-xs font-semibold mb-2">Jogadores Disponíveis</div>
            {freePlayers.map((p) => (
              <div 
                key={p.id} 
                className="text-xs py-2 px-2 border-b cursor-move hover:bg-gray-50"
                draggable 
                onDragStart={(e) => onDragStart(e, p.id)}
              >
                <span className="font-medium">{p.name}</span>
                <span className="float-right">
                  {toPt(p.position)} • <span className={overallClass(p.overall)}>{p.overall}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button onClick={autoLineup} className="px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
              Auto 11
            </button>
            <button onClick={clearLineup} className="px-3 py-2 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">
              Limpar
            </button>
            <button 
              onClick={handleSave} 
              disabled={lineup.length < 11}
              className={`px-3 py-2 text-xs rounded ${
                lineup.length < 11 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              Salvar
            </button>
          </div>

          {/* Legenda */}
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
            <div className="font-semibold mb-2">Legenda de posições</div>
            <div className="grid grid-cols-2 gap-1 text-gray-600">
              <div>GOL — Goleiro</div>
              <div>LE — Lateral Esquerdo</div>
              <div>LD — Lateral Direito</div>
              <div>ZAG — Zagueiro</div>
              <div>ME — Meia Esquerda</div>
              <div>MD — Meia Direita</div>
              <div>MC — Meio-Campista</div>
              <div>PE — Ponta Esquerda</div>
              <div>PD — Ponta Direita</div>
              <div>ATA — Atacante</div>
            </div>
            
            <div className="font-semibold mt-3 mb-2">Legenda de cores (overall)</div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                ≥ 80
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                70-79
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                &lt; 70
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Titulares: {lineup.length}/11
          </div>
        </div>
      </div>

      {/* Impacto das táticas */}
      {tactics && (
        <div className="mt-6">
          <TacticsImpactDisplay 
            tactics={{
              formation: tactics.formation || '4-4-2',
              style: tactics.style || 'equilibrado',
              pressing: tactics.pressing || 'média',
              width: tactics.width || 'normal',
              tempo: tactics.tempo || 'normal'
            }}
            teamOverall={players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (p.overall || 0), 0) / players.length) : 75}
          />
        </div>
      )}
        </div>
      ) : (
        /* Aba de Explicação dos Parâmetros */
        <div className="space-y-6">
          
          {/* 🎮 Controles Disponíveis */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-blue-800 mb-4">🎮 Controles Disponíveis</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pressing */}
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  🔥 <span className="ml-2">Pressing (Pressão)</span>
                </h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Alta:</strong> Pressiona alto, gasta energia (+8 meio-campo, +5 defesa, -5 coesão)</div>
                  <div><strong>Média:</strong> Equilíbrio entre pressing e conservação</div>
                  <div><strong>Baixa:</strong> Conserva energia, foca na defesa (+8 defesa, -5 ataque, +5 coesão)</div>
                </div>
              </div>

              {/* Largura */}
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  📏 <span className="ml-2">Largura</span>
                </h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Largo:</strong> Usa toda a largura do campo (jogo pelas pontas)</div>
                  <div><strong>Normal:</strong> Largura padrão do campo</div>
                  <div><strong>Estreito:</strong> Jogo mais centralizado (foco no meio)</div>
                </div>
              </div>

              {/* Tempo */}
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  ⚡ <span className="ml-2">Tempo (Ritmo)</span>
                </h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Rápido:</strong> Jogo direto e acelerado (contra-ataques)</div>
                  <div><strong>Normal:</strong> Ritmo equilibrado</div>
                  <div><strong>Lento:</strong> Posse de bola, construção lenta (tiki-taka)</div>
                </div>
              </div>
            </div>
          </div>

          {/* 🎯 Como Usar Estrategicamente */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-green-800 mb-4">🎯 Como Usar Estrategicamente</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contra Time Mais Fraco */}
              <div className="bg-white rounded-lg p-4 border border-green-300">
                <h5 className="font-semibold text-green-800 mb-3">💪 Contra Time Mais Fraco</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Pressing:</strong> Alta (pressiona desde o início)</div>
                  <div><strong>Largura:</strong> Largo (explora pontas)</div>
                  <div><strong>Tempo:</strong> Rápido (jogo direto)</div>
                  <div className="mt-3 p-2 bg-green-100 rounded text-xs"><strong>Objetivo:</strong> Dominar e marcar muitos gols</div>
                </div>
              </div>

              {/* Contra Time Mais Forte */}
              <div className="bg-white rounded-lg p-4 border border-red-300">
                <h5 className="font-semibold text-red-800 mb-3">🛡️ Contra Time Mais Forte</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Pressing:</strong> Baixa (conserva energia)</div>
                  <div><strong>Largura:</strong> Estreito (defesa compacta)</div>
                  <div><strong>Tempo:</strong> Lento (controla posse)</div>
                  <div className="mt-3 p-2 bg-red-100 rounded text-xs"><strong>Objetivo:</strong> Minimizar riscos e buscar contra-ataques</div>
                </div>
              </div>

              {/* Jogo Equilibrado */}
              <div className="bg-white rounded-lg p-4 border border-blue-300">
                <h5 className="font-semibold text-blue-800 mb-3">⚖️ Jogo Equilibrado</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Pressing:</strong> Média (padrão)</div>
                  <div><strong>Largura:</strong> Normal (padrão)</div>
                  <div><strong>Tempo:</strong> Normal (padrão)</div>
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs"><strong>Objetivo:</strong> Configuração versátil para qualquer situação</div>
                </div>
              </div>
            </div>
          </div>

          {/* 🏆 Situações Recomendadas */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-amber-800 mb-4">🏆 Situações Recomendadas</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="font-semibold text-amber-800">🔄 Durante a Partida</h5>
                <div className="bg-white rounded p-3 text-sm">
                  <div className="space-y-2">
                    <div><strong>Perdendo:</strong> Pressing Alta + Largura Largo + Tempo Rápido</div>
                    <div><strong>Ganhando:</strong> Pressing Baixa + Largura Estreito + Tempo Lento</div>
                    <div><strong>Empate:</strong> Mantenha as configurações atuais ou ajuste conforme adversário</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-amber-800">⏰ Momento do Jogo</h5>
                <div className="bg-white rounded p-3 text-sm">
                  <div className="space-y-2">
                    <div><strong>Início (0-30 min):</strong> Configuração padrão para estudar o adversário</div>
                    <div><strong>Meio (30-70 min):</strong> Ajuste baseado no resultado parcial</div>
                    <div><strong>Final (70-90 min):</strong> Configuração urgente se necessário</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 💾 Como Salvar */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-purple-800 mb-4">💾 Como Salvar</h4>
            
            <div className="bg-white rounded-lg p-4 border">
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-700">
                <li><strong>Configure os parâmetros</strong> - Escolha Pressing, Largura e Tempo desejados</li>
                <li><strong>Defina a formação</strong> - Selecione entre 4-4-2, 4-3-3, 4-2-3-1, 3-5-2 ou 5-3-2</li>
                <li><strong>Escolha o estilo</strong> - Defensivo, Equilibrado ou Ofensivo</li>
                <li><strong>Escale os jogadores</strong> - Monte sua formação com 11 titulares</li>
                <li><strong>Clique em "Salvar"</strong> - As configurações serão aplicadas na próxima partida</li>
              </ol>
              
              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <p className="text-xs text-purple-800">
                  <strong>💡 Dica:</strong> As configurações são salvas automaticamente e aplicadas em todas as próximas partidas até você alterar novamente.
                </p>
              </div>
            </div>
          </div>

          {/* 📊 Visualização do Impacto */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Visualização do Impacto</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-semibold text-gray-800 mb-3">📈 Bônus Numéricos</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><strong>Ataque:</strong> Influencia chances de gol</div>
                  <div><strong>Meio-Campo:</strong> Controle do jogo e criação</div>
                  <div><strong>Defesa:</strong> Reduz chances do adversário</div>
                  <div><strong>Coesão:</strong> Eficiência geral da equipe</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border">
                <h5 className="font-semibold text-gray-800 mb-3">🎯 Como Interpretar</h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div><span className="px-2 py-1 bg-green-100 text-green-800 rounded">+10</span> Muito Positivo</div>
                  <div><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">+5</span> Positivo</div>
                  <div><span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">0</span> Neutro</div>
                  <div><span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">-5</span> Negativo</div>
                  <div><span className="px-2 py-1 bg-red-100 text-red-800 rounded">-10</span> Muito Negativo</div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg">
              <h6 className="font-semibold text-gray-800 mb-2">🔮 Fatores que Influenciam</h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700">
                <div>
                  <strong>Overall dos Jogadores:</strong> Times melhores executam táticas com mais eficiência
                </div>
                <div>
                  <strong>Moral da Equipe:</strong> Jogadores motivados performam melhor
                </div>
                <div>
                  <strong>Forma dos Jogadores:</strong> Jogadores em boa forma aplicam melhor as instruções
                </div>
              </div>
            </div>
          </div>

          {/* Voltar para Escalação */}
          <div className="text-center">
            <button
              onClick={() => setActiveTab('escalacao')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ⚽ Voltar para Escalação & Táticas
            </button>
          </div>

        </div>
      )}
    </div>
  );
}