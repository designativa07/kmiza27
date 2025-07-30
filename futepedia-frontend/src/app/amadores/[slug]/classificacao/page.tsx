'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/config';
import ImageWithFallback from '@/components/ImageWithFallback';
import { ListOrdered } from 'lucide-react';

interface Standing {
  id: number;
  team: {
    id: number;
    name: string;
    logo_url: string | null;
  };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

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

async function getAmateurStandings(competitionId: number): Promise<Standing[]> {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/amateur/standings/${competitionId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch amateur standings:', error);
    return [];
  }
}

export default function AmateurStandingsPage({ params }: { params: { slug: string } }) {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const comp = await getAmateurCompetition(params.slug);
      if (comp) {
        setCompetition(comp);
        const standingsData = await getAmateurStandings(comp.id);
        setStandings(standingsData);
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

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Classificação</h2>
          </div>
          
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">P</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">J</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GP</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">GC</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {standings.map((standing, index) => (
                    <tr key={standing.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <ImageWithFallback
                            src={standing.team.logo_url}
                            alt={standing.team.name}
                            fallbackType="team"
                            size="xs"
                            className="h-6 w-6 mr-3"
                          />
                          <span className="text-sm font-medium text-gray-900">{standing.team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                        {standing.points}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.played}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.won}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.drawn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.lost}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.goals_for}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.goals_against}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">
                        {standing.goal_difference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <ListOrdered className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Classificação não disponível</h3>
              <p className="text-gray-600 text-sm">
                Ainda não há dados de classificação para esta competição.
              </p>
            </div>
          )}
        </div>
    </div>
  );
} 