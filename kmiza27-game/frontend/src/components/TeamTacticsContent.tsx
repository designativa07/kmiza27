'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

const TacticsBoard = dynamic(() => import('@/components/TacticsBoard'), { ssr: false });

export default function TeamTacticsContent() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { userTeams, setSelectedTeam, loadTeams } = useGameStore();
  const [suspendedPlayersCount, setSuspendedPlayersCount] = useState(0); // Placeholder

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

    // TODO: Adicionar lógica para buscar o número real de jogadores suspensos
    // Ex: const count = await gameApi.getSuspendedCount(teamId);
    // setSuspendedPlayersCount(count);

  }, [teamId, userTeams, setSelectedTeam, loadTeams]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/team/${teamId}`} className="px-3 py-1.5 border rounded text-sm hover:bg-slate-100">← Voltar ao Time</Link>
          <h1 className="text-2xl font-bold text-slate-800">Área Técnica</h1>
          <div />
        </div>

        {/* Estatísticas da Área Técnica */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jogadores Suspensos</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{suspendedPlayersCount}</div>
            </CardContent>
          </Card>
          {/* Outros cards de estatísticas podem ser adicionados aqui */}
        </div>

        <TacticsBoard />
      </div>
    </div>
  );
}


