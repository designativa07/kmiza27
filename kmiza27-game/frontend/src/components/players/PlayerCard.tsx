'use client';

import React from 'react';

export interface PlayerCardData {
  id: string;
  name: string;
  position: string;
  age?: number;
  overall?: number;
  salary?: number;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
  };
}

interface Props {
  player: PlayerCardData;
}

export default function PlayerCard({ player }: Props) {
  const posPt: Record<string, string> = {
    GK: 'GOL', CB: 'ZAG', LB: 'LE', RB: 'LD', CDM: 'VOL', CM: 'MC', CAM: 'MO',
    LW: 'PE', RW: 'PD', CF: 'SA', ST: 'ATA', LM: 'ME', RM: 'MD'
  };
  const label = posPt[player.position] || player.position;
  const badge = (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#1e88e5' }}>
      {label}
    </div>
  );

  const Bar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-1">
      <span className="w-6 text-[9px] tracking-wide text-gray-500">{label}</span>
      <div className="flex-1 h-1 bg-gray-100 rounded">
        <div className="h-1 rounded bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="w-5 text-[9px] text-gray-600 text-right">{value}</span>
    </div>
  );

  return (
    <div className="border rounded-lg p-2 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {badge}
          <div>
            <div className="font-semibold text-slate-800 text-sm">{player.name}</div>
            <div className="text-[10px] text-gray-600">{player.age ?? '—'} anos</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-blue-600">{player.overall ?? '-'}</div>
          <div className="text-[10px] text-gray-600">Overall</div>
          {player.salary != null && (
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">R$ {player.salary.toLocaleString()}/mês</div>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <Bar label="PAC" value={player.attributes.pace} />
        <Bar label="SHO" value={player.attributes.shooting} />
        <Bar label="PAS" value={player.attributes.passing} />
        <Bar label="DRI" value={player.attributes.dribbling} />
        <Bar label="DEF" value={player.attributes.defending} />
        <Bar label="PHY" value={player.attributes.physical} />
      </div>
    </div>
  );
}


