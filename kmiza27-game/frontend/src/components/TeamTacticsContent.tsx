'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

const TacticsBoard = dynamic(() => import('@/components/TacticsBoard'), { ssr: false });

export default function TeamTacticsContent() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { userTeams, setSelectedTeam, loadTeams } = useGameStore();

  useEffect(() => {
    const ensureTeam = async () => {
      try {
        if (!userTeams || userTeams.length === 0) {
          await loadTeams();
        }
        const found = (useGameStore.getState().userTeams || userTeams || []).find((t: any) => t.id === teamId);
        if (found) setSelectedTeam(found);
      } catch (_) {}
    };
    ensureTeam();
  }, [teamId, userTeams, setSelectedTeam, loadTeams]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/team/${teamId}`} className="px-3 py-1.5 border rounded text-sm hover:bg-slate-100">← Voltar ao Time</Link>
          <h1 className="text-2xl font-bold text-slate-800">Área Técnica</h1>
          <div />
        </div>
        <TacticsBoard />
      </div>
    </div>
  );
}


