'use client';

import React from 'react';

interface LogItem {
  id?: string;
  player_id: string;
  week: number;
  focus?: string;
  intensity?: string;
  delta_attributes?: Record<string, number>;
  created_at?: string;
}

interface Props {
  logs: LogItem[];
  compact?: boolean;
  limit?: number;
}

export default function YouthAcademyLogs({ logs, compact = false, limit = 10 }: Props) {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-gray-500">Sem logs de treino ainda.</div>;
  }

  return (
    <div className={compact ? '' : 'space-y-2'}>
      {logs.slice(0, limit).map((log, idx) => (
        <div key={idx} className={`bg-white ${compact ? '' : 'border rounded p-2'} text-xs`}>
          <div className="flex justify-between text-gray-600">
            <span>Sem: {log.week}</span>
            <span>Foco: {log.focus || '-'}</span>
            <span>Int: {log.intensity || '-'}</span>
          </div>
          {log.delta_attributes && (
            <div className="mt-1 text-[11px] text-gray-700 flex flex-wrap gap-1">
              {Object.entries(log.delta_attributes).map(([k, v]) => (
                <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {k.toUpperCase()}: +{(v as number).toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


