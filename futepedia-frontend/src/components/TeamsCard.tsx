'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';

interface Team {
  id: number;
  name: string;
  logo_url: string;
}

interface CompetitionTeam {
  team: Team;
}

const fetchTeamsByCompetition = async (slug: string): Promise<Team[]> => {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/competitions/slug/${slug}/teams`);
    if (!res.ok) {
      console.error(`Error fetching teams for ${slug}: ${res.statusText}`);
      return [];
    }
    const competitionTeams: CompetitionTeam[] = await res.json();
    return competitionTeams.map(ct => ct.team);
  } catch (error) {
    console.error(`Failed to fetch teams for ${slug}:`, error);
    return [];
  }
};

export function TeamsCard() {
  const [activeTab, setActiveTab] = useState('serie-a');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      const competitionSlug = activeTab === 'serie-a' ? 'brasileirao' : 'brasileiro-serie-b';
      const fetchedTeams = await fetchTeamsByCompetition(competitionSlug);
      setTeams(fetchedTeams);
      setLoading(false);
    };

    loadTeams();
  }, [activeTab]);

  const renderTeamLogos = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      );
    }

    if (teams.length === 0) {
      return <p className="text-sm text-gray-500 mt-2">Nenhum time encontrado.</p>;
    }

    return (
      <div className="grid grid-cols-5 gap-2 justify-items-center">
        {teams.map(team => (
          <Link href={`/time/${team.id}`} key={team.id} title={team.name}>
            <img 
              src={getTeamLogoUrl(team.logo_url)} 
              alt={team.name} 
              className="h-8 w-8 object-contain transition-transform duration-200 hover:scale-110"
            />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Times</h3>
        <Link href="/times" className="text-sm text-blue-600 hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="mt-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('serie-a')}
              className={`${
                activeTab === 'serie-a'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Série A
            </button>
            <button
              onClick={() => setActiveTab('serie-b')}
              className={`${
                activeTab === 'serie-b'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Série B
            </button>
          </nav>
        </div>
        <div className="mt-3">
          {renderTeamLogos()}
        </div>
      </div>
    </div>
  );
} 