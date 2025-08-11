'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTeamLogoUrl } from '@/lib/cdn-simple';
import { getApiUrl } from '@/lib/config';
import { ArrowUpRight } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  logo_url: string;
  country?: string;
  city?: string;
  short_name?: string;
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

const fetchAllTeams = async (): Promise<Team[]> => {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/teams?limit=1000`);
    if (!res.ok) {
      console.error(`Error fetching all teams: ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return data.data || data;
  } catch (error) {
    console.error(`Failed to fetch all teams:`, error);
    return [];
  }
};

export function TeamsCard() {
  const [activeTab, setActiveTab] = useState('serie-a');
  const [teams, setTeams] = useState<Team[]>([]);
  const [internationalTeams, setInternationalTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [internationalLoading, setInternationalLoading] = useState(true);

  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      let competitionSlug;
      if (activeTab === 'serie-a') {
        competitionSlug = 'brasileirao';
      } else if (activeTab === 'serie-b') {
        competitionSlug = 'brasileiro-serie-b';
      } else if (activeTab === 'serie-c') {
        competitionSlug = 'brasileiro-serie-c';
      } else if (activeTab === 'serie-d') {
        competitionSlug = 'brasileiro-serie-d';
      }
      
      if (!competitionSlug) {
        setLoading(false);
        return;
      }
      
      const fetchedTeams = await fetchTeamsByCompetition(competitionSlug);
      setTeams(fetchedTeams);
      setLoading(false);
    };

    const loadInternationalTeams = async () => {
      setInternationalLoading(true);
      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/teams/international`);
        if (res.ok) {
          const data = await res.json();
          const teams = data.data || data;
          setInternationalTeams(teams);
        }
      } catch (error) {
        console.error('Erro ao carregar times internacionais:', error);
        setInternationalTeams([]);
      } finally {
        setInternationalLoading(false);
      }
    };

    loadTeams();
    loadInternationalTeams();
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
          <div key={team.id} className="text-center">
            <Link href={`/time/${team.id}`} title={team.name}>
              <img 
                src={getTeamLogoUrl(team.logo_url)} 
                alt={team.name} 
                className="h-8 w-8 object-contain transition-transform duration-200 hover:scale-110"
              />
            </Link>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate max-w-16">
              {team.short_name || team.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="bg-blue-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-blue-700 leading-tight px-4">TIMES</h3>
          <Link href="/times" className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 text-sm font-medium transition-colors flex items-center">
            Ver mais
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      <div className="pt-2 pb-4 px-4">
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
            <button
              onClick={() => setActiveTab('serie-c')}
              className={`${
                activeTab === 'serie-c'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Série C
            </button>
            <button
              onClick={() => setActiveTab('serie-d')}
              className={`${
                activeTab === 'serie-d'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              Série D
            </button>
          </nav>
        </div>
        <div className="mt-3">
          {renderTeamLogos()}
        </div>

        {/* Seção de Times Internacionais */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-100 -mt-6 -mx-4">
            <div>
              <h4 className="text-sm font-bold text-gray-700 leading-tight px-4 py-1">TIMES INTERNACIONAIS</h4>
            </div>
          </div>
          <div className="mt-3">
            {internationalLoading ? (
              <div className="grid grid-cols-5 gap-2 justify-items-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                ))}
              </div>
            ) : internationalTeams.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum time internacional selecionado.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2 justify-items-center">
                {internationalTeams.map((team) => (
                  <div key={team.id} className="relative group text-center">
                    <Link href={`/time/${team.id}`} title={team.name}>
                      <img 
                        src={getTeamLogoUrl(team.logo_url)} 
                        alt={team.name} 
                        className="h-8 w-8 object-contain transition-transform duration-200 hover:scale-110"
                      />
                    </Link>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate max-w-16">
                      {team.short_name || team.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 