'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/config';
import { TopScorersTable, TopScorer } from '@/components/TopScorersTable';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  category?: string;
}

async function getAmateurCompetition(slug: string): Promise<Competition | null> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/competitions?active=true&category=amateur`);
    if (!res.ok) return null;
    const competitions = await res.json();
    return competitions.find((comp: Competition) => comp.slug === slug) || null;
  } catch (error) {
    console.error('Failed to fetch amateur competition:', error);
    return null;
  }
}

async function getAmateurTopScorers(competitionId: number): Promise<TopScorer[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/amateur/top-scorers/${competitionId}`);
    if (!res.ok) return [];
    const topScorers = await res.json();
    
    // Converter formato dos artilheiros amadores para o formato esperado pelo TopScorersTable
    return topScorers.map((scorer: any) => ({
      player: {
        id: scorer.player_id,
        name: scorer.player_name,
        position: 'Atacante', // Valor padrão para amadores
        image_url: scorer.player_image || ''
      },
      team: {
        id: scorer.team_id,
        name: scorer.team_name,
        logo_url: scorer.team_logo || ''
      },
      goals: scorer.goals
    }));
  } catch (error) {
    console.error('Failed to fetch amateur top scorers:', error);
    return [];
  }
}

export default function AmateurTopScorersPage({ params }: { params: { slug: string } }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const comp = await getAmateurCompetition(params.slug);
      if (comp) {
        setCompetition(comp);
        const topScorersData = await getAmateurTopScorers(comp.id);
        setTopScorers(topScorersData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Competição não encontrada</h1>
      </div>
    );
  }

  return (
    <div>
      <TopScorersTable topScorers={topScorers} competitionName={competition.name} />
    </div>
  );
} 